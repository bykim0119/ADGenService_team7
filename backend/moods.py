"""플레이팅 무드 컬러 → SDXL 프롬프트 매핑."""

MOODS: dict[str, dict] = {
    "white": {
        "label": "화이트",
        "prompt": (
            "minimalist white marble table, bright airy studio, soft diffused light, "
            "clean white background, scandinavian style, high-key lighting"
        ),
    },
    "korean": {
        "label": "베이지",
        "prompt": (
            "warm beige linen tablecloth, natural wood surface, soft warm light, "
            "neutral tones, cozy cafe atmosphere, muted earthy palette"
        ),
    },
    "terracotta": {
        "label": "테라코타",
        "prompt": (
            "terracotta clay background, warm orange-red tones, mediterranean style, "
            "rustic ceramic surface, warm golden hour light, earthy natural textures"
        ),
    },
    "olive": {
        "label": "올리브",
        "prompt": (
            "olive green slate background, botanical garden setting, muted green tones, "
            "natural foliage accents, soft dappled light, organic earthy feel"
        ),
    },
    "slate": {
        "label": "딥슬레이트",
        "prompt": (
            "deep dark slate surface, dramatic moody lighting, dark charcoal background, "
            "cinematic shadows, luxury fine dining atmosphere, bold contrast"
        ),
    },
    "japanese": {
        "label": "그레이",
        "prompt": (
            "cool gray concrete surface, modern minimalist setting, overcast diffused light, "
            "neutral gray tones, contemporary restaurant style, clean lines"
        ),
    },
    "western": {
        "label": "타우프",
        "prompt": (
            "warm taupe textured background, soft greige tones, vintage linen surface, "
            "gentle warm light, sophisticated neutral palette, timeless elegance"
        ),
    },
    "chinese": {
        "label": "앤틱샌드",
        "prompt": (
            "antique sandy beige background, aged parchment texture, warm golden tones, "
            "vintage aesthetic, soft warm ambient light, rustic charm"
        ),
    },
}
