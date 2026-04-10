# 병합 계획서 (Merge Plan)

> 작성일: 2026-04-09  
> 대상: `project3_team` (우리) + `plating-ai-main` (팀원)

---

## 1. 기본 방향

| 항목 | 결정 |
|------|------|
| **베이스 프로젝트** | 팀원 UI (plating-ai, Next.js 14) |
| **백엔드** | 우리 FastAPI + Celery + ComfyUI(SDXL) 유지, 플레이팅 기능 직접 구현 |
| **인증** | Supabase (우리가 직접 세팅, 팀원 코드의 테이블 스키마 참고) |
| **에디터** | Fabric.js 캔버스 유지 |
| **배포** | 기존 GKE 유지, Dockerfile.frontend만 Next.js로 교체 |
| **디렉토리** | 현재 `project3_team/` 폴더에서 병합 진행 |

---

## 2. 기능 구조 (사이드바 분리)

```
사이드바
├── 🍽️ 플레이팅
│   ├── 음식 사진 업로드
│   ├── 무드 컬러 8종 선택 (화이트/베이지/테라코타/올리브/딥슬레이트/그레이/타우프/앤틱샌드)
│   └── ZoeDepth(CPU) 깊이맵 → SDXL + ControlNet Depth(ComfyUI) 배경 생성 → rembg 누끼 → PIL 합성
│
└── 📢 광고 생성
    ├── 업종 선택 5종 (food/it/fashion/beauty/other)
    ├── 테마 선택 3종 (cartoon/realistic/minimal)
    ├── 텍스트 설명 입력
    ├── 제품 이미지 업로드 (선택)
    ├── SDXL + IP-Adapter 이미지 생성 (ComfyUI)
    └── GPT 카피 생성 + 텍스트 오버레이

공통
├── Fabric.js 캔버스 편집기
├── 비율 선택 (1:1 / 9:16 / 16:9 / 21:9)
├── 결과물 다운로드
└── Supabase 저장 (캠페인/에셋)
```

---

## 3. 플레이팅 백엔드 처리 방식

### 확정 방식: ComfyUI + ControlNet Depth SDXL

```
음식사진 업로드
  → ZoeDepth (CPU, 깊이맵 생성)
  → SDXL + ControlNet Depth (ComfyUI, 무드 프롬프트로 배경 생성)
  → rembg 누끼 (CPU, 기존 Worker 재사용)
  → PIL 합성 (기존 _composite_product 재사용)
```

**기각된 방식:**

| 방식 | 기각 이유 |
|------|---------|
| 팀원 GCP VM 직접 호출 | 팀원 없이 진행, VM 상태 미확인 |
| fal.ai / Replicate API | 과금 발생, 추가 비용 계획 없음 |
| HuggingFace Inference API | 두 모델 모두 미지원 확인 |
| ComfyUI 재활용 (ControlNet 없음) | 배경이 음식 깊이/조명을 모름 → 합성 어색 |

---

## 4. 자원 견적 (T4 GPU · 20 GB PVC)

### VRAM

| 워크플로우 | 주요 컴포넌트 | VRAM |
|-----------|-------------|------|
| 광고 생성 (기존) | SDXL UNet + IP-Adapter + CLIP + VAE + 런타임 | 8.2 GB |
| 플레이팅 (추가) | SDXL UNet + ControlNet Depth + CLIP + VAE + 런타임 | 9.7 GB |

> ComfyUI `model_management.py`가 워크플로우 전환 시 IP-Adapter(1.0 GB) ↔ ControlNet Depth(2.5 GB) 자동 swap.  
> 두 워크플로우 동시 요청 시 전환에 수 초 지연 발생 가능.

| 자원 | 현재 | 추가 후 | 한계 | 가능 여부 |
|------|------|---------|------|---------|
| VRAM (플레이팅 피크) | 8.2 GB | **9.7 GB** | 14.56 GB | ✅ 여유 4.86 GB |
| PVC 스토리지 | ~7 GB | **~10.7 GB** | 20 GB | ✅ 여유 9.3 GB |
| 시스템 RAM (ZoeDepth CPU) | - | **+1.2 GB** | - | ✅ |

### 추가 다운로드 모델

| 모델 | 용도 | 크기 |
|------|------|------|
| `diffusers/controlnet-depth-sdxl-1.0` (fp16 safetensors) | 배경 생성 ControlNet | 2.5 GB |
| `Intel/zoedepth-nyu` | 음식사진 → 깊이맵 변환 (CPU) | ~1.2 GB |
| **합계** | | **~3.7 GB** |

---

## 5. 백엔드 통합 계획

| 엔드포인트 | 기능 | 처리 방식 |
|-----------|------|----------|
| `POST /generate` | 광고 이미지 생성 (SDXL + IP-Adapter) | 기존 Celery 비동기 → job_id 반환 |
| `GET /status/{job_id}` | 작업 상태 폴링 | 기존 유지 |
| `POST /plating` | 플레이팅 배경 합성 (ControlNet Depth) | **신규** - Celery 비동기 → job_id 반환 |

> 플레이팅도 ComfyUI 호출이 포함되므로 광고 생성과 동일하게 Celery 비동기 처리.

---

## 6. Next.js 프론트엔드 연동 변경사항

### 6-1. API 프록시 (nginx → next.config.js)

**현재 nginx.conf:**
```nginx
location /api/ {
    proxy_pass http://backend-service:8000/;
}
```

**변경 후 next.config.js:**
```js
rewrites: async () => [
  { source: '/api/:path*', destination: 'http://backend-service:8000/:path*' }
]
```

### 6-2. API 호출 방식 통일

팀원 `synthesize/route.ts`는 JSON body 사용.  
우리 `/generate`는 **FormData (multipart)** 수신.  
→ Next.js API Route에서 FormData로 변환하여 전송하거나, 백엔드에 JSON 엔드포인트 추가.

### 6-3. 비동기 폴링 추가

광고 생성 · 플레이팅 모두 job_id 반환 후 2초 폴링 방식.  
팀원 UI에 폴링 로직 추가 필요 (현재 동기 방식).

### 6-4. "use client" 지시어

폴링, useState, useEffect 사용 컴포넌트에 `"use client"` 명시 필요.

---

## 7. 병합 전 체크리스트

### Supabase 세팅 (우리가 직접)
- [x] Supabase 프로젝트 신규 생성
- [x] `campaigns` 테이블 생성 (id, user_id, menu_name, created_at)
- [x] `assets` 테이블 생성 (id, user_id, campaign_id, generated_image_url)
- [x] Storage 버킷 생성 (생성된 이미지 저장용)
- [x] `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 발급 및 `.env.local` 입력
  - 비고: 신버전 Supabase는 ANON_KEY 대신 PUBLISHABLE_KEY 사용

### 백엔드 작업
- [x] `backend/main.py`에 `/plating` 엔드포인트 추가
- [x] `backend/tasks.py`에 `plating_ad` Celery 태스크 추가
- [x] `backend/comfyui_client.py`에 ControlNet Depth 워크플로우 추가
- [x] `backend/pipeline_sdxl.py`에 ZoeDepth 깊이맵 생성 함수 추가
- [x] `scripts/download_models.py`에 ControlNet Depth SDXL + ZoeDepth 다운로드 추가
- [x] `backend/requirements.txt`에 ZoeDepth 관련 의존성 추가 (transformers, timm, accelerate)
- [x] `backend/moods.py` 신규 생성 (무드 8종 → SDXL 프롬프트 매핑, 팀원 STYLE_OPTIONS ID 맞춤)
- [x] `/generate` FormData 수신 방식 유지 (기존 그대로)

### 프론트엔드 작업
- [x] `plating-ai-main` 기반 Next.js 프로젝트 구성 확인 (Next.js 14.2.3)
- [x] `lib/supabase.ts` 신규 생성 (PUBLISHABLE_KEY 사용)
- [x] `lib/utils.ts` 신규 생성 (shadcn cn 유틸)
- [x] `next.config.js` 신규 생성 (`/api/backend/*` 프록시 rewrites)
- [x] 사이드바에 플레이팅 / 광고 생성 두 영역 분리
- [x] 광고 생성 UI 컴포넌트 이식 (업종 5종 / 테마 3종 / 광고설명 입력)
- [x] 광고 생성 + 플레이팅 폴링 로직 추가 (job_id 기반 2초 폴링)
- [x] `app/api/synthesize/route.ts` → 플레이팅 전용 FormData + job_id 반환
- [x] `app/api/generate/route.ts` 신규 생성 (광고생성 FormData + job_id 반환)
- [x] `app/api/status/[job_id]/route.ts` 신규 생성 (폴링용)
- [x] 에디터 페이지 모드 탭 분리 (`?mode=plating` / `?mode=ad`)

### 인프라 작업
- [x] `Dockerfile.frontend` Next.js standalone 3-stage 빌드로 교체 (port 3000)
- [x] `k8s/frontend.yaml` containerPort 3000, BACKEND_URL env 추가, Service targetPort 3000
- [x] `k8s/comfyui-models-pvc.yaml` 20Gi → 25Gi 증설
- [x] 기존 `OPENAI_API_KEY` Secret(`ad-secrets`) 재사용
- [x] GKE Secret에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 추가 (`kubectl patch secret ad-secrets` 완료)
  ```
  kubectl create secret generic ad-secrets \
    --from-literal=OPENAI_API_KEY=<key> \
    --from-literal=NEXT_PUBLIC_SUPABASE_URL=<url> \
    --from-literal=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<key> \
    --dry-run=client -o yaml | kubectl apply -f -
  ```
- [ ] Docker 빌드 시 ARG 주입 필요 (NEXT_PUBLIC_ 변수는 빌드 타임 번들링)
  ```
  docker build -f Dockerfile.frontend \
    --build-arg NEXT_PUBLIC_SUPABASE_URL=<url> \
    --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<key> \
    -t frontend:latest .
  ```

---

## 8. 미결 사항

| 항목 | 현황 | 액션 |
|------|------|------|
| 카피 생성 위치 | 팀원: Next.js Route 직접 / 우리: Celery Worker | 광고생성은 Celery 유지, 플레이팅 카피는 Next.js Route 유지 |
| 멀티턴 히스토리 | 우리 기능에만 존재 | 광고 생성 영역에만 유지 |
| ZoeDepth CPU 처리 속도 | 미측정 | 초기 구현 후 병목 시 GPU offload 검토 |
