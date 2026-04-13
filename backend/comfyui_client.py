"""
ComfyUI HTTP + WebSocket 클라이언트.
SDXL(DreamShaper XL) + IP-Adapter Plus 워크플로우를 ComfyUI API로 실행.
WebSocket으로 샘플링 진행률을 실시간 수신해 Redis에 저장.
"""
import json
import os
import time
import uuid

import redis as redis_lib
import requests
import websocket as ws_lib
from io import BytesIO

COMFYUI_URL = os.environ.get("COMFYUI_URL", "http://comfyui-service:8188")
REDIS_URL   = os.environ.get("REDIS_URL",   "redis://redis-service:6379/0")
TIMEOUT_SEC    = 300
PROGRESS_TTL   = 3600  # Redis key TTL (1시간)

SDXL_CKPT      = "dreamshaper_xl.safetensors"
IPADAPTER_CKPT = "ip-adapter-plus_sdxl_vit-h.bin"
CLIP_VISION    = "clip_vit_h.safetensors"
NEGATIVE_PROMPT = "text, watermark, blurry, low quality, deformed, ugly, nsfw"

# 노드별 진행률 기준값 (KSampler 구간은 progress 이벤트로 세분화)
_NODE_PCT = {
    "1": 5,   # CheckpointLoaderSimple
    "2": 10,  # CLIPTextEncode (positive)
    "3": 12,  # CLIPTextEncode (negative)
    "4": 14,  # EmptyLatentImage
    "9": 7,   # IPAdapterModelLoader
    "10": 9,  # CLIPVisionLoader
    "11": 11, # LoadImage
    "12": 13, # IPAdapterAdvanced
    "7": 92,  # VAEDecode
    "8": 97,  # SaveImage
}
_KSAMPLER_START = 15
_KSAMPLER_END   = 90


def _redis() -> redis_lib.Redis:
    return redis_lib.from_url(REDIS_URL, decode_responses=True)


def _set_progress(job_id: str | None, pct: int) -> None:
    if not job_id:
        return
    _redis().setex(f"ad:progress:{job_id}", PROGRESS_TTL, pct)


def _build_workflow(prompt: str, uploaded_image_name: str | None, ip_adapter_weight: float = 0.7) -> dict:
    """ComfyUI API 워크플로우 JSON 구성."""
    seed = int(time.time() * 1000) % (2 ** 31)

    workflow = {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": SDXL_CKPT},
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt, "clip": ["1", 1]},
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": NEGATIVE_PROMPT, "clip": ["1", 1]},
        },
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1024, "height": 1024, "batch_size": 1},
        },
        "6": {
            "class_type": "KSampler",
            "inputs": {
                "model": None,
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
                "seed": seed,
                "steps": 30,
                "cfg": 6.0,
                "sampler_name": "euler_ancestral",
                "scheduler": "karras",
                "denoise": 1.0,
            },
        },
        "7": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["6", 0], "vae": ["1", 2]},
        },
        "8": {
            "class_type": "SaveImage",
            "inputs": {"images": ["7", 0], "filename_prefix": "ad_gen"},
        },
    }

    if uploaded_image_name:
        workflow["9"]  = {"class_type": "IPAdapterModelLoader", "inputs": {"ipadapter_file": IPADAPTER_CKPT}}
        workflow["10"] = {"class_type": "CLIPVisionLoader",     "inputs": {"clip_name": CLIP_VISION}}
        workflow["11"] = {"class_type": "LoadImage",            "inputs": {"image": uploaded_image_name}}
        workflow["12"] = {
            "class_type": "IPAdapterAdvanced",
            "inputs": {
                "model": ["1", 0],
                "ipadapter": ["9", 0],
                "image": ["11", 0],
                "clip_vision": ["10", 0],
                "weight": ip_adapter_weight,
                "weight_type": "linear",
                "combine_embeds": "concat",
                "start_at": 0.0,
                "end_at": 1.0,
                "embeds_scaling": "V only",
            },
        }
        workflow["6"]["inputs"]["model"] = ["12", 0]
    else:
        workflow["6"]["inputs"]["model"] = ["1", 0]

    return workflow


def _upload_image(image_bytes: bytes) -> str:
    """ComfyUI에 이미지 업로드. 업로드된 파일명 반환."""
    name = f"product_{uuid.uuid4().hex[:8]}.png"
    resp = requests.post(
        f"{COMFYUI_URL}/upload/image",
        files={"image": (name, BytesIO(image_bytes), "image/png")},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["name"]


def _fetch_image(filename: str, subfolder: str, output_type: str) -> bytes:
    """생성된 이미지 바이트 다운로드."""
    resp = requests.get(
        f"{COMFYUI_URL}/view",
        params={"filename": filename, "subfolder": subfolder, "type": output_type},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.content


def _run_with_progress(workflow: dict, job_id: str | None) -> tuple[str, str, str]:
    """
    WebSocket으로 ComfyUI에 연결해 워크플로우를 실행.
    progress 이벤트를 수신해 Redis에 저장.
    완료 후 (filename, subfolder, type) 반환.
    """
    client_id = uuid.uuid4().hex
    _set_progress(job_id, 3)

    ws_url = COMFYUI_URL.replace("http://", "ws://").replace("https://", "wss://")
    sock = ws_lib.create_connection(
        f"{ws_url}/ws?clientId={client_id}",
        timeout=30,
    )

    try:
        # 워크플로우 큐 등록
        resp = requests.post(
            f"{COMFYUI_URL}/prompt",
            json={"prompt": workflow, "client_id": client_id},
            timeout=30,
        )
        resp.raise_for_status()
        prompt_id = resp.json()["prompt_id"]
        _set_progress(job_id, 5)

        deadline = time.time() + TIMEOUT_SEC

        while time.time() < deadline:
            remaining = deadline - time.time()
            if remaining <= 0:
                break
            sock.settimeout(min(remaining, 10))

            try:
                raw = sock.recv()
            except ws_lib.WebSocketTimeoutException:
                continue

            # 바이너리 프레임(이미지 미리보기)은 스킵
            if isinstance(raw, bytes):
                continue

            msg   = json.loads(raw)
            mtype = msg.get("type")
            data  = msg.get("data", {})

            if mtype == "progress":
                val = data.get("value", 0)
                mx  = data.get("max", 1)
                if mx > 0:
                    pct = _KSAMPLER_START + int((val / mx) * (_KSAMPLER_END - _KSAMPLER_START))
                    _set_progress(job_id, pct)

            elif mtype == "executing":
                node = data.get("node")
                pid  = data.get("prompt_id")
                if node is None and pid == prompt_id:
                    # 모든 노드 실행 완료
                    _set_progress(job_id, 100)
                    break
                if node in _NODE_PCT:
                    _set_progress(job_id, _NODE_PCT[node])

            elif mtype == "execution_error" and data.get("prompt_id") == prompt_id:
                raise RuntimeError(
                    f"ComfyUI 추론 실패: {data.get('exception_message', 'unknown')}"
                )
        else:
            raise TimeoutError(f"ComfyUI 응답 없음 ({TIMEOUT_SEC}s 초과): prompt_id={prompt_id}")

        # 결과 이미지 경로 조회
        resp = requests.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=10)
        resp.raise_for_status()
        history = resp.json()

        for node_output in history.get(prompt_id, {}).get("outputs", {}).values():
            if "images" in node_output:
                img = node_output["images"][0]
                return img["filename"], img.get("subfolder", ""), img.get("type", "output")

        raise RuntimeError("ComfyUI 결과에서 이미지를 찾을 수 없음")

    finally:
        sock.close()


def generate_image(
    prompt: str,
    product_image: bytes | None = None,
    ip_adapter_weight: float = 0.7,
    job_id: str | None = None,
) -> bytes:
    """
    ComfyUI를 통해 SDXL 이미지 생성.
    product_image가 있으면 IP-Adapter Plus 적용.
    job_id가 있으면 진행률을 Redis에 저장.
    반환: PNG bytes
    """
    uploaded_name = None
    if product_image:
        uploaded_name = _upload_image(product_image)

    workflow = _build_workflow(prompt, uploaded_name, ip_adapter_weight)
    filename, subfolder, output_type = _run_with_progress(workflow, job_id)
    return _fetch_image(filename, subfolder, output_type)
