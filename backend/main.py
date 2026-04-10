import json
import base64
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from PIL import Image, ImageOps
from celery_app import celery_app

app = FastAPI(title="광고 생성 API")


def _normalize_uploaded_image(file_bytes: bytes, field_name: str) -> bytes:
    if not file_bytes:
        raise HTTPException(status_code=400, detail=f"{field_name} is empty")

    try:
        image = Image.open(io.BytesIO(file_bytes))
        image = ImageOps.exif_transpose(image)
        image = image.convert("RGB")
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"{field_name} is not a valid image file",
        )

    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return buf.getvalue()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/generate")
async def generate(
    user_input: str = Form(...),
    category_key: str = Form(...),
    theme_key: str = Form(...),
    history: str = Form("[]"),
    product_image: UploadFile = File(None),
    product_position: str = Form("bottom-center"),
    text_position: str = Form("top"),
    font_name: str = Form("nanumpen"),
    text_color: str = Form("#FFF5B4"),
    font_size_ratio: float = Form(0.052),
):
    history_list = json.loads(history)
    product_bytes = None
    if product_image:
        raw_bytes = await product_image.read()
        product_bytes = _normalize_uploaded_image(raw_bytes, "product_image")
    product_image_b64 = base64.b64encode(product_bytes).decode() if product_bytes else None

    task = celery_app.send_task(
        "tasks.generate_ad",
        args=[
            user_input, category_key, theme_key, history_list,
            product_image_b64, product_position, text_position,
            font_name, text_color, font_size_ratio,
        ],
    )
    return {"job_id": task.id}


@app.post("/plating")
async def plating(
    food_image: UploadFile = File(...),
    mood_key: str = Form(...),
    menu_name: str = Form(...),
):
    raw_bytes = await food_image.read()
    food_bytes = _normalize_uploaded_image(raw_bytes, "food_image")
    food_image_b64 = base64.b64encode(food_bytes).decode()

    task = celery_app.send_task(
        "tasks.plating_ad",
        args=[food_image_b64, mood_key, menu_name],
    )
    return {"job_id": task.id}


@app.get("/status/{job_id}")
async def status(job_id: str):
    result = celery_app.AsyncResult(job_id)

    if result.state == "PENDING":
        return {"status": "pending"}
    elif result.state == "STARTED":
        return {"status": "processing"}
    elif result.state == "SUCCESS":
        return {"status": "done", **result.result}
    elif result.state == "FAILURE":
        detail = str(result.result)
        if "SYSTEM_ERROR:" in detail:
            return {"status": "failed_system", "detail": detail}
        return {"status": "failed_input", "detail": detail}
    return {"status": result.state.lower()}
