import base64
from concurrent.futures import ThreadPoolExecutor
from celery.utils.log import get_task_logger
from celery_app import celery_app
from pipeline_sdxl import build_sd_prompt, write_copy, generate_tags
from comfyui_client import generate_image

logger = get_task_logger(__name__)


@celery_app.task(bind=True, name="tasks.generate_ad")
def generate_ad(
    self,
    user_input,
    category_key,
    theme_key,
    history,
    product_image_b64,
    product_position,
    text_position,
    font_name,
    text_color,
    font_size_ratio,
    ip_adapter_weight=0.7,
):
    product_bytes = base64.b64decode(product_image_b64) if product_image_b64 else None

    # GPT 3회 호출 병렬 실행 (순차 ~4-6s → 병렬 ~1.5s)
    with ThreadPoolExecutor(max_workers=3) as executor:
        f_prompt = executor.submit(build_sd_prompt, user_input, category_key, theme_key)
        f_copy   = executor.submit(write_copy,      user_input, category_key, history)
        f_tags   = executor.submit(generate_tags,   user_input, category_key)
        sd_prompt   = f_prompt.result()
        copy_result = f_copy.result()
        tags        = f_tags.result()

    logger.warning(f"[SD_PROMPT] {sd_prompt}")
    copy_text = copy_result["copy"]
    message   = copy_result["message"]

    # 이미지 생성: ComfyUI API 호출
    # 텍스트 오버레이는 프론트엔드 Fabric.js 캔버스에서 처리
    try:
        image_bytes = generate_image(sd_prompt, product_bytes, ip_adapter_weight, self.request.id)
    except Exception as e:
        raise RuntimeError(f"SYSTEM_ERROR: image generation failed — {e}") from e

    return {
        "image": base64.b64encode(image_bytes).decode(),
        "copy": copy_text,
        "tags": tags,
        "message": message,
        "sd_prompt": sd_prompt,
    }
