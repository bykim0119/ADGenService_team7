# 이미지 생성 품질 개선 작업 (heum)

## 변경 파일 목록

- `backend/themes.py`
- `backend/categories.py`
- `frontend/app/editor/page.tsx`

---

## 1. 테마 프롬프트 강화 (`backend/themes.py`)

기존 프롬프트가 너무 짧고 단순해서 이미지 품질이 낮았음. 각 테마별로 구체적인 스타일 키워드를 추가해 생성 품질을 개선.

| 테마 | 기존 | 개선 |
|------|------|------|
| 카툰 | `cartoon style, flat design, vibrant colors` | cel-shading, bold outlines, pop art, 2D stylized art 등 추가 |
| 실사 | `photorealistic, professional product photography` | 8k resolution, cinematic color grading, DSLR quality, soft bokeh 등 추가 |
| 미니멀 | `minimalist design, clean white background` | negative space, fine art photography, understated luxury 등 추가 |

---

## 2. 카테고리 프롬프트 강화 (`backend/categories.py`)

업종별 광고 프롬프트가 단순해서 업종 특성이 이미지에 잘 반영되지 않았음. 각 카테고리에 맞는 분위기와 스타일 키워드를 구체적으로 추가.

| 카테고리 | 주요 추가 키워드 |
|----------|----------------|
| 음식/카페 | warm golden hour lighting, steam rising, shallow depth of field |
| IT/앱 | futuristic blue/purple lighting, dark gradient background, high-tech atmosphere |
| 패션/의류 | vogue magazine style, dramatic studio lighting, urban background |
| 뷰티/화장품 | luxury cosmetic, pastel background, dewy glass skin effect |
| 기타 | dramatic lighting, eye-catching visual, premium brand quality |

---

## 3. IP-Adapter 슬라이더 개선 (`frontend/app/editor/page.tsx`)

제품 이미지 업로드 시 원본을 얼마나 반영할지 조절하는 슬라이더 개선.

| 항목 | 기존 | 개선 | 이유 |
|------|------|------|------|
| 기본값 | `0.7` | `0.5` | 기존 값이 너무 높아 원본과 거의 동일한 이미지가 생성됨. 낮춰서 더 창의적인 결과 유도 |
| step | `0.1` | `0.05` | 더 세밀한 강도 조절 가능 |

**슬라이더 범위 의미:**
- 낮음 (0.1~0.4): 프롬프트 중심으로 창의적인 이미지 생성
- 중간 (0.5): 프롬프트와 이미지 스타일 균형
- 높음 (0.7~1.0): 업로드한 제품 이미지 스타일을 강하게 반영
