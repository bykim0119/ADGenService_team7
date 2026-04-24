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
    """기본 버전으로 원복: 카테고리/테마/사용자 입력을 기반으로 SDXL용 영문 프롬프트 생성."""
    category_prompt = CATEGORIES[category]["prompt"]
    theme_prompt = THEMES[theme]["prompt"]

    response = _openai.chat.completions.create(
        model="gpt-5-mini",
        messages=[
            {
                "role": "system",
                "content": "You are a professional assistant that generates high-quality image prompts for SDXL in English. Output ONLY the prompt.",
            },
            {
                "role": "user",
                "content": f"Generate an advertising image prompt for: {user_input}. Style: {theme_prompt}. Category: {category_prompt}.",
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
                    f"당신은 {category_label} 분야의 SNS 인기 인플루언서이자 마케팅 전문가입니다. "
                    "인스타그램, 틱톡 등 최신 트렌드를 반영하여 클릭율을 높일 수 있는 매력적인 한국어 해시태그 6개를 생성하세요. "
                    "단순한 키워드 나열이 아닌, 검색량이 많고 타겟팅이 명확한 태그를 선정하십시오. "
                    "반드시 JSON 형식으로만 응답하세요: {\"tags\": [\"#태그1\", \"#태그2\", ...]}"
                ),
            },
            {"role": "user", "content": f"작업 컨셉: {user_input}"},
        ],
    )
    content = response.choices[0].message.content.strip()
    try:
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        data = _json.loads(content)
        return data.get("tags", [])
    except Exception:
        return []


def write_copy(user_input: str, category: str, history: list) -> dict:
    """GPT-5-mini를 사용해 사용자의 의도와 마케팅 전략이 반영된 세련된 광고 문구 생성."""
    cat_data = CATEGORIES[category]
    category_label = cat_data["label"]
    strategy = cat_data.get("strategy", "")

    messages = [
        {
            "role": "system",
            "content": (
                f"당신은 글로벌 광고 대행사의 수석 카피라이터이며, 현재 {category_label} 프로젝트를 담당하고 있습니다. "
                "사용자의 요청(Concept)을 완벽하게 이해하고, 소비자의 마음을 움직이는 심리학적 마케팅 기법을 적용하세요. "
                "반드시 아래 JSON 형식으로만 응답하세요:\n"
                '{"copy": "광고 문구", "message": "사용자 안내"}\n\n'
                "고도화 지침:\n"
                f"- 전략: {strategy}\n"
                "- 창의성: 사용자의 입력을 그대로 복사하거나 단순히 요약하지 마세요. 컨셉의 핵심 가치를 뽑아내어 새로운 비유나 감성적인 언어로 재창조하십시오.\n"
                "- 톤앤매너: 사용자의 입력된 톤을 유지하되, 더욱 세련되고 감각적인 표현으로 정제하세요.\n"
                "- 구성: copy 필드는 반드시 '헤드라인\\n서브카피' 구조로 2줄 이내로 작성하세요. (줄바꿈 \\n 사용)\n"
                "- 금기: '...하세요', '~입니다'와 같은 평범한 어미보다는 명사형 종결이나 감각적인 의성어/의태어를 적절히 활용하세요.\n"
                "- 가독성: 텍스트가 이미지를 가리지 않도록 핵심만 간결하고 임팩트 있게 작성하세요.\n"
                "- 안내: 문구에 대한 짧은 해설이나 피드백은 'message' 필드에 담아주세요."
            ),
        }
    ]

    for turn in history:
        messages.append({"role": "user", "content": turn["user_input"]})
        messages.append({"role": "assistant", "content": f'{{"copy": {_json.dumps(turn["copy"], ensure_ascii=False)}, "message": ""}}'})

    messages.append({"role": "user", "content": f"이번 광고의 핵심 프로젝트 컨셉입니다: {user_input}"})

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
