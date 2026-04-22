import base64
import io
from celery.utils.log import get_task_logger
from celery_app import celery_app
from pipeline_sdxl import generate_prompt_and_copy, generate_depth_map, _get_rembg_session
from comfyui_client import generate_image, generate_plating_image
from moods import MOODS
from PIL import Image

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
):
    product_bytes = base64.b64decode(product_image_b64) if product_image_b64 else None

    gen_result = generate_prompt_and_copy(user_input, category_key, theme_key, history)
    sd_prompt = gen_result["sd_prompt"]
    logger.warning(f"[SD_PROMPT] {sd_prompt}")
    copy_text = gen_result["copy"]
    message = gen_result["message"]

    # 이미지 생성: ComfyUI API 호출
    # 텍스트 오버레이는 프론트엔드 Fabric.js 캔버스에서 처리
    try:
        image_bytes = generate_image(sd_prompt, product_bytes)
    except Exception as e:
        raise RuntimeError(f"SYSTEM_ERROR: image generation failed — {e}") from e

    return {
        "image": base64.b64encode(image_bytes).decode(),
        "copy": copy_text,
        "message": message,
        "sd_prompt": sd_prompt,
    }


@celery_app.task(bind=True, name="tasks.plating_ad")
def plating_ad(self, food_image_b64: str, mood_key: str, menu_name: str):
    from rembg import remove

    food_bytes = base64.b64decode(food_image_b64)

    # 1. ZoeDepth로 깊이맵 생성 (CPU)
    logger.warning("[PLATING] ZoeDepth 깊이맵 생성 중...")
    try:
        depth_bytes = generate_depth_map(food_bytes)
    except Exception as e:
        raise RuntimeError(f"SYSTEM_ERROR: depth map generation failed — {e}") from e

    # 2. 무드 프롬프트 조합
    mood = MOODS.get(mood_key, MOODS["white"])
    prompt = (
        f"empty {mood['prompt']}, no food, no people, "
        f"professional food photography background, 8k, photorealistic"
    )
    logger.warning(f"[PLATING] 배경 생성 프롬프트: {prompt}")

    # 3. ComfyUI ControlNet Depth로 배경 생성
    logger.warning("[PLATING] ComfyUI ControlNet Depth 배경 생성 중...")
    try:
        background_bytes = generate_plating_image(prompt, depth_bytes)
    except Exception as e:
        raise RuntimeError(f"SYSTEM_ERROR: background generation failed — {e}") from e

    # 4. 음식 사진 누끼 (rembg)
    logger.warning("[PLATING] rembg 누끼 처리 중...")
    try:
        food_no_bg = remove(food_bytes, session=_get_rembg_session())
    except Exception as e:
        raise RuntimeError(f"SYSTEM_ERROR: background removal failed — {e}") from e

    # 5. PIL 합성
    logger.warning("[PLATING] PIL 합성 중...")
    bg_img = Image.open(io.BytesIO(background_bytes)).convert("RGBA")
    food_img = Image.open(io.BytesIO(food_no_bg)).convert("RGBA")

    result_bytes = _composite_plating(bg_img, food_img)
    logger.warning("[PLATING] 완료")

    return {"image": base64.b64encode(result_bytes).decode()}


def _composite_plating(bg: Image.Image, food: Image.Image) -> bytes:
    """누끼 음식을 배경 하단 중앙에 합성."""
    from PIL import ImageFilter

    bg_w, bg_h = bg.size
    food_size = int(bg_w * 0.55)
    food = food.resize((food_size, food_size), Image.LANCZOS)

    # 소프트 엣지
    r, g, b, a = food.split()
    a = a.filter(ImageFilter.GaussianBlur(1.5))
    food = Image.merge("RGBA", (r, g, b, a))

    x = (bg_w - food_size) // 2
    y = bg_h - food_size - int(bg_h * 0.05)
    canvas = bg.copy()
    canvas.paste(food, (x, y), food)

    buf = io.BytesIO()
    canvas.convert("RGB").save(buf, format="PNG")
    return buf.getvalue()
