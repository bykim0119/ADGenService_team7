# AdGen.ai — AI 광고 비주얼 제작 서비스
![제품 시연](image-1.png)
생성형 AI를 활용하여 소상공인이 디자인 역량 없이도 **광고 이미지**와 **카피**를 자동 제작하는 서비스입니다.

# 보고서
📄 [프로젝트 보고서](docs/7팀_보고서.pdf)

---

## 주요 기능

### 광고 생성

업종·테마·텍스트 설명만 입력하면 AI가 SDXL 배경을 생성하고 GPT가 한국어 카피와 해시태그를 작성합니다.

| 기능 | 설명 |
|------|------|
| 업종 / 카테고리 선택 | 음식·외식 / IT·앱 / 패션·의류 / 뷰티·화장품 / 기타 — 업종별 광고 전략 프롬프트 자동 적용 |
| 테마 / 스타일 선택 | 카툰 / 실사 / 미니멀 |
| 광고 이미지 생성 | ComfyUI → SDXL(DreamShaper XL) + IP-Adapter Plus (T4 GPU) |
| 제품 이미지 합성 | 제품 사진 업로드 시 IP-Adapter로 스타일 반영 |
| 광고 문구 생성 | GPT-4o-mini 기반 한국어 카피 자동 생성 (멀티턴 수정 가능) |
| 해시태그 생성 | GPT-4o-mini 기반 업종별 한국어 해시태그 6개 자동 생성 |
| GPT 병렬 호출 | SDXL 프롬프트·카피·태그 3개 GPT 호출 병렬 실행 (~4s 단축) |
| 워커 Warmup | Celery 워커 시작 시 ComfyUI에 더미 요청으로 SDXL 체크포인트 VRAM 프리로드 |

### 공통 편집 기능

| 기능 | 설명 |
|------|------|
| Fabric.js 캔버스 편집 | 텍스트 · 이미지 레이어 직접 편집 |
| 비율 4종 선택 | 1:1 (인스타 피드) / 9:16 (인스타 스토리) / 16:9 (유튜브 썸네일) / 21:9 (배너 광고) |
| 텍스트 컬러 팔레트 | 9종 럭셔리 컬러 선택 (퓨어 화이트, 딥 블랙, 로즈 레드 등) |
| 진행률 표시 | Redis + WebSocket 기반 실시간 생성 진행률 |
| 결과 저장 & 다운로드 | Supabase에 저장 후 PNG 다운로드 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| 캔버스 편집기 | Fabric.js 6 |
| 인증 / DB | Supabase (Auth + PostgreSQL + RLS) |
| 백엔드 API | FastAPI + Celery (비동기 작업 큐) |
| 메시지 브로커 | Redis |
| 이미지 생성 API | ComfyUI (workflow JSON 기반, port 8188) |
| 광고 생성 모델 | SDXL (Lykon/DreamShaper XL, fp16) + IP-Adapter Plus (h94/IP-Adapter ViT-H) |
| LLM | OpenAI GPT-4o-mini (SDXL 프롬프트 빌드 + 카피 + 해시태그 병렬 생성) |
| 컨테이너 | Docker (ComfyUI GPU pod + CPU backend/worker pod + Next.js frontend pod) |
| 오케스트레이션 | Kubernetes (GKE, T4 Spot GPU 노드) |

---

## 아키텍처

```
[사용자 브라우저]
      │
      ▼
[Next.js 프론트엔드]  LoadBalancer (port 80 → 3000)
      │  /api/backend/* → rewrites → backend-service:8000
      ▼
[FastAPI 백엔드]    비동기 작업 발행 → job_id 즉시 반환
      │
      ▼
[Redis]            브로커 + 진행률 저장 (TTL 1h)
      │
      ▼
[Celery Worker]    CPU 노드
      └── [광고 생성 태스크] generate_ad
          ├── (병렬) build_sd_prompt() → GPT-4o-mini: SDXL 영문 프롬프트 생성
          ├── (병렬) write_copy()      → GPT-4o-mini: 멀티턴 한국어 카피 생성
          ├── (병렬) generate_tags()   → GPT-4o-mini: 한국어 해시태그 6개 생성
          └── generate_image()         → ComfyUI: SDXL + IP-Adapter 이미지 생성

[ComfyUI Service]  GPU 노드 (T4 Spot) · ClusterIP · port 8188
      └── 광고 생성: SDXL(DreamShaper XL) + IP-Adapter Plus → 1024×1024 PNG

[프론트엔드]  GET /api/status/{job_id} 2초 폴링 → 완료 시 base64 이미지 수신
[Supabase]   campaigns / assets 테이블 저장 (RLS, 본인 데이터만 접근)
```

### 백엔드 API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET`  | `/health` | 헬스 체크 |
| `POST` | `/generate` | 광고 이미지 생성 (비동기, job_id 반환) |
| `POST` | `/copy` | 광고 카피 단독 생성 (멀티턴) |
| `POST` | `/tags` | 해시태그 단독 생성 |
| `GET`  | `/status/{job_id}` | 생성 진행률 조회 |

### VRAM 구성 (T4 14.56 GB · ComfyUI 관리)

| 워크플로우 | 주요 컴포넌트 | VRAM |
|-----------|-------------|------|
| 광고 생성 | SDXL UNet + IP-Adapter + CLIP + VAE + 런타임 | ~8.2 GB |
| T4 한계 | | 14.56 GB (여유 ~6.4 GB) |

---

## 페이지 구성 (Next.js App Router)

| 경로 | 설명 |
|------|------|
| `/` | 대시보드 — 히어로 슬라이드쇼, 통계 (총 생성 수 / 활성 광고 / 저장 에셋), 최근 작업 목록 |
| `/editor` | 광고 생성 에디터 — 업종/테마/텍스트 입력 + 제품 이미지 업로드 + Fabric.js 편집 |
| `/assets` | 저장된 에셋 목록 |
| `/export` | 최종 결과물 확인 및 다운로드 |
| `/notifications` | 알림 목록 |
| `/settings` | 계정 설정 |
| `/login` | Supabase 인증 로그인 |
| `/signup` | 회원가입 |

---

## 디렉토리 구조

```
project3_team/
├── backend/
│   ├── main.py              # FastAPI 엔드포인트 (/generate, /copy, /tags, /status/{job_id})
│   ├── tasks.py             # Celery 태스크 (generate_ad, warmup)
│   ├── comfyui_client.py    # ComfyUI HTTP + WebSocket 클라이언트 (SDXL+IP-Adapter 워크플로우)
│   ├── pipeline_sdxl.py     # build_sd_prompt / write_copy / generate_tags (GPT-4o-mini)
│   ├── categories.py        # 업종별 광고 전략 프롬프트
│   ├── themes.py            # 테마별 스타일 프롬프트
│   ├── celery_app.py        # Celery 앱 설정
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # 대시보드
│   │   ├── editor/page.tsx       # 광고 생성 에디터
│   │   ├── assets/page.tsx       # 에셋 목록
│   │   ├── export/page.tsx       # 결과 다운로드
│   │   ├── notifications/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── api/
│   │       ├── generate/route.ts        # 광고 생성 프록시 (FormData → /generate)
│   │       ├── generate-copy/route.ts   # 카피 단독 생성 프록시 (→ /copy)
│   │       ├── tags/route.ts            # 해시태그 생성 프록시 (→ /tags)
│   │       └── status/[job_id]/route.ts # 폴링용 상태 확인
│   ├── components/
│   │   ├── layout/          # Sidebar, Header
│   │   └── ui/              # shadcn/ui 컴포넌트 (Button, Card, Input 등)
│   ├── lib/
│   │   ├── supabase.ts      # Supabase 클라이언트 초기화
│   │   └── utils.ts         # cn 유틸
│   └── next.config.js       # /api/backend/* → backend-service:8000 rewrites
├── scripts/
│   ├── download_models.py   # ComfyUI 최초 기동 시 모델 자동 다운로드
│   └── entrypoint.sh        # ComfyUI 컨테이너 진입점
├── k8s/
│   ├── backend.yaml             # FastAPI Deployment + ClusterIP Service
│   ├── worker.yaml              # Celery Worker Deployment (CPU pod)
│   ├── frontend.yaml            # Next.js Deployment + LoadBalancer (port 80)
│   ├── redis.yaml               # Redis Deployment + Service
│   ├── comfyui.yaml             # ComfyUI Deployment (GPU) + ClusterIP Service
│   ├── comfyui-models-pvc.yaml  # 모델 저장용 PVC (25Gi)
│   └── hf-cache-pvc.yaml        # HuggingFace 모델 캐시 PVC
├── supabase/
│   └── schema.sql           # campaigns / assets 테이블 + RLS 정책
├── Dockerfile.backend       # python:3.11-slim (CPU, FastAPI + Worker 공용)
├── Dockerfile.comfyui       # pytorch:2.5.1-cuda12.4 + ComfyUI + IPAdapter_plus
└── Dockerfile.frontend      # Node 20 multi-stage → Next.js standalone (port 3000)
```

---

## GKE 배포

### 사전 요구사항

- GKE 클러스터 (T4 GPU 노드풀 포함)
- Artifact Registry 저장소
- Supabase 프로젝트 및 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 발급

### DB 초기화 (Supabase)

Supabase 대시보드 > SQL Editor에서 `supabase/schema.sql` 전체 실행.

### Secret 생성

```bash
kubectl create secret generic ad-secrets \
  --from-literal=OPENAI_API_KEY=sk-... \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
  --from-literal=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
  --from-literal=HF_TOKEN=hf_... \
  --from-literal=CIVITAI_API_KEY=...
```

### 이미지 빌드 & 푸시

```bash
REGISTRY=asia-east1-docker.pkg.dev/<PROJECT>/ad-gen-project

docker build -f Dockerfile.comfyui -t $REGISTRY/comfyui:latest .
docker push $REGISTRY/comfyui:latest

docker build -f Dockerfile.backend -t $REGISTRY/backend:latest .
docker push $REGISTRY/backend:latest

# NEXT_PUBLIC_ 변수는 빌드 타임 번들링 필요 — --no-cache 권장
docker build --no-cache -f Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<url> \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<key> \
  -t $REGISTRY/frontend:latest .
docker push $REGISTRY/frontend:latest
```

### 배포

```bash
# PVC + ComfyUI (최초 기동 시 모델 자동 다운로드 ~15분 소요)
kubectl apply -f k8s/comfyui-models-pvc.yaml
kubectl apply -f k8s/hf-cache-pvc.yaml
kubectl apply -f k8s/comfyui.yaml

# 나머지
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/worker.yaml
kubectl apply -f k8s/frontend.yaml
```

### Secret 키 변경 시 재배포 절차

```bash
# 1. Secret 재생성
kubectl delete secret ad-secrets
kubectl create secret generic ad-secrets \
  --from-literal=OPENAI_API_KEY=... \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=... \
  --from-literal=NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=... \
  --from-literal=HF_TOKEN=... \
  --from-literal=CIVITAI_API_KEY=...

# 2. Frontend 이미지 재빌드 (NEXT_PUBLIC_ 변수는 빌드타임 번들링)
docker build --no-cache -f Dockerfile.frontend \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=<url> \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<key> \
  -t $REGISTRY/frontend:latest .
docker push $REGISTRY/frontend:latest

# 3. 전체 재배포
kubectl rollout restart deployment/frontend deployment/backend deployment/worker
```

### ComfyUI GUI 디버깅

```bash
kubectl port-forward deployment/comfyui 8188:8188
# → localhost:8188 에서 ComfyUI GUI 접근
```

---

## 모델 라이선스

| 모델 / 패키지 | 라이선스 |
|-------------|---------|
| Lykon/DreamShaper XL (SDXL) | Apache 2.0 계열 |
| h94/IP-Adapter Plus (SDXL ViT-H) | Apache 2.0 |
| ComfyUI | GPL-3.0 (서버사이드) |
| GPT-4o-mini (OpenAI API) | 상업 이용 허용 |
