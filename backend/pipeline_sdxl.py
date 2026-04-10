"""
현재 역할: build_sd_prompt / write_copy 제공.
이미지 생성(generate_image)은 ComfyUI API(comfyui_client.py)로 위임.
"""
import json as _json
import os
from openai import OpenAI
from dotenv import load_dotenv
from categories import CATEGORIES
from themes import THEMES

load_dotenv()

_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def build_sd_prompt(user_input: str, category: str, theme: str) -> str:
    """GPT-4o-mini를 사용해 카테고리/테마/사용자 입력을 기반으로 SDXL용 영문 프롬프트 생성."""
    category_prompt = CATEGORIES[category]["prompt"]
    theme_prompt = THEMES[theme]["prompt"]

    response = _openai.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert at writing Stable Diffusion XL image generation prompts for advertisement images. "
                    "CRITICAL RULES:\n"
                    "1. Output MUST be entirely in English — no Korean, no other languages, English only.\n"
                    "2. The prompt is fed to a CLIP encoder with a hard 77-token limit. Keep it strictly under 55 English words.\n"
                    "3. Structure: [subject/person/action/food] [mood/lighting] [style keywords]. Most important content first.\n"
                    "4. If the user mentions a person, action, or specific food, it MUST appear at the start of the prompt.\n"
                    "5. Style and atmosphere keywords go last — they are expendable if truncated.\n"
                    "6. Output only the prompt text. No explanation, no Korean, no other commentary."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"User scene description (highest priority): {user_input}\n"
                    f"Category context (atmosphere reference): {category_prompt}\n"
                    f"Visual theme (style reference): {theme_prompt}\n\n"
                    "Write the SDXL prompt:"
                ),
            },
        ],
    )
    return response.choices[0].message.content.strip()


def generate_tags(user_input: str, category: str) -> list[str]:
    """GPT-5-mini를 사용해 광고 내용에 맞는 한국어 해시태그 6개 생성."""
    category_label = CATEGORIES[category]["label"]

    response = _openai.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    f"당신은 {category_label} 업종 SNS 마케팅 전문가입니다. "
                    "사용자의 광고 설명을 보고 SNS에서 효과적인 한국어 해시태그 6개를 생성하세요. "
                    "반드시 JSON 형식으로만 응답하세요: {\"tags\": [\"#태그1\", \"#태그2\", ...]}"
                ),
            },
            {"role": "user", "content": user_input},
        ],
    )
    content = response.choices[0].message.content.strip()
    try:
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        import json as _json
        data = _json.loads(content)
        return data.get("tags", [])
    except Exception:
        return []


def write_copy(user_input: str, category: str, history: list) -> dict:
    """GPT-4o-mini를 사용해 멀티턴 컨텍스트를 반영한 한국어 광고 문구 생성.
    반환: {"copy": str, "message": str}
    """
    category_label = CATEGORIES[category]["label"]

    messages = [
        {
            "role": "system",
            "content": (
                f"당신은 {category_label} 업종 소상공인을 위한 광고 카피라이터입니다. "
                "반드시 아래 JSON 형식으로만 응답하세요:\n"
                '{"copy": "광고 문구만", "message": "사용자에게 전달할 안내만"}\n\n'
                "엄격한 규칙:\n"
                "- copy: 순수 광고 문구만. 반드시 2줄 이내(줄바꿈 \\n 사용). 어떤 안내·설명·요청도 포함 금지.\n"
                "- message: 추가 정보 요청, 피드백 제안 등 사용자에게 전달할 안내. 없으면 반드시 빈 문자열(\"\").\n"
                "- copy 필드에 안내·설명 문구를 절대 넣지 마세요. 안내는 message에만.\n"
                "- 이전 대화 히스토리가 있다면 피드백을 반영해 copy를 개선\n"
                "- 예시 copy: \"지금 이 순간, 특별한 맛\\n오늘만의 특별 메뉴를 만나보세요\""
            ),
        }
    ]

    for turn in history:
        messages.append({"role": "user", "content": turn["user_input"]})
        messages.append({"role": "assistant", "content": f'{{"copy": {_json.dumps(turn["copy"], ensure_ascii=False)}, "message": ""}}'})

    messages.append({"role": "user", "content": user_input})

    response = _openai.chat.completions.create(
        model="gpt-5-mini",
        messages=messages,
    )
    content = response.choices[0].message.content.strip()
    try:
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        data = _json.loads(content)
    except _json.JSONDecodeError:
        data = {"copy": content, "message": ""}
    return {
        "copy": data.get("copy", content).strip(),
        "message": data.get("message", "").strip(),
    }
