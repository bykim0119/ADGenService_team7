# Architecture

## 시스템 아키텍처

```mermaid
flowchart TD
    Browser["브라우저"]

    subgraph SUPA["Supabase (외부)"]
        AUTH["Auth\n이메일/비밀번호 인증"]
        DB[("PostgreSQL\ncampaigns · assets\nRLS 적용")]
    end

    subgraph GKE["GKE Cluster"]
        FE["Frontend\nNext.js 14 · LoadBalancer · port 3000"]
        BE["Backend\nFastAPI · ClusterIP · port 8000"]
        RD[("Redis\nbroker + 결과 저장 TTL 1h")]

        subgraph CPU["CPU Node"]
            WK["Celery Worker\nZoeDepth · rembg · comfyui_client"]
        end

        subgraph GPU["GPU Node (T4 Spot)"]
            CUI["ComfyUI\nSDXL + IP-Adapter\nSDXL + ControlNet Depth\nport 8188"]
        end
    end

    OAI["OpenAI API\nGPT-5-mini"]
    PVC[("PVC\n모델 저장\n25 Gi")]

    Browser -- "로그인 / 회원가입" --> SUPA
    Browser -- "① POST /api/generate\n   POST /api/synthesize" --> FE
    Browser -- "③ GET /api/status/{job_id} (2초 폴링)" --> FE
    FE -- "rewrites proxy" --> BE
    FE -- "캠페인·에셋 저장/조회" --> DB
    BE -- "② send_task() → job_id 반환" --> RD
    RD -- "태스크 전달" --> WK
    WK -- "결과 저장 (TTL 1h)" --> RD
    WK -- "build_sd_prompt\nwrite_copy" --> OAI
    WK -- "④ POST /prompt\n⑤ GET /history/{id}\n⑥ GET /view" --> CUI
    CUI -- "모델 로드" --> PVC
```

---

## 광고 생성 파이프라인

```mermaid
flowchart TD
    IN["user_input · category · theme\nproduct_image (optional)"]

    subgraph GPT["OpenAI API (GPT-5-mini)"]
        P1["build_sd_prompt()\n→ 영문 SDXL 프롬프트"]
        P2["write_copy()\n→ 한국어 광고 카피 (멀티턴)"]
    end

    subgraph COMFY["ComfyUI Service (GPU · port 8188)"]
        WF["SDXL Workflow\nDreamShaper XL · 30 steps · 1024×1024"]
        IPA["IP-Adapter Plus\nViT-H · weight=0.5"]
    end

    PROD{"product_image?"}

    REMBG["rembg (CPU)\n배경 제거 · 소프트 엣지"]

    OUT["PNG → base64\nRedis 저장 (TTL 1h)"]

    CANVAS["Fabric.js 캔버스 (프론트엔드)\n텍스트 오버레이 · 비율 선택 · 레이어 편집"]

    IN --> P1
    IN --> P2
    P1 --> WF
    PROD -- "Yes" --> REMBG
    REMBG --> IPA
    WF --> IPA
    PROD -- "No" --> WF
    IPA --> OUT
    P2 --> CANVAS
    OUT --> CANVAS
```

---

## 플레이팅 파이프라인

```mermaid
flowchart TD
    IN2["food_image · mood_key · menu_name"]

    ZOE["ZoeDepth (CPU)\nIntel/zoedepth-nyu\n음식사진 → 깊이맵(그레이스케일)"]

    subgraph COMFY2["ComfyUI Service (GPU · port 8188)"]
        CN["ControlNet Depth SDXL\nstrength=0.6 · end_at=0.85"]
        WF2["SDXL Workflow\nDreamShaper XL · 30 steps · 1024×1024"]
    end

    MOOD["MOODS dict\n무드 컬러 8종 → SDXL 프롬프트"]
    REMBG2["rembg (CPU)\n음식 누끼 제거"]
    COMP["PIL 합성\n하단 중앙 배치 · 소프트 엣지"]

    OUT2["PNG → base64\nRedis 저장 (TTL 1h)"]
    CANVAS2["Fabric.js 캔버스 (프론트엔드)\n텍스트 오버레이 · 비율 선택"]

    IN2 --> ZOE
    IN2 --> MOOD
    ZOE --> CN
    MOOD --> WF2
    CN --> WF2
    WF2 --> COMP
    IN2 --> REMBG2
    REMBG2 --> COMP
    COMP --> OUT2
    OUT2 --> CANVAS2
```

---

## VRAM 구성 (T4 14.56 GB · ComfyUI 관리)

ComfyUI `model_management.py`가 워크플로우 전환 시 IP-Adapter ↔ ControlNet Depth 자동 swap.

```mermaid
block-beta
  columns 1
  block:AD["광고 생성 워크플로우 (~8.2 GB)"]
    A1["SDXL UNet  fp16  ~5.0 GB"]
    A2["CLIP-L + OpenCLIP-G  ~1.4 GB"]
    A3["VAE  fp16  ~0.3 GB"]
    A4["IP-Adapter Plus ViT-H  ~1.0 GB"]
    A5["ComfyUI 런타임  ~0.5 GB"]
  end
  block:PLATING["플레이팅 워크플로우 (~9.7 GB)"]
    B1["SDXL UNet  fp16  ~5.0 GB"]
    B2["CLIP-L + OpenCLIP-G  ~1.4 GB"]
    B3["VAE  fp16  ~0.3 GB"]
    B4["ControlNet Depth SDXL  ~2.5 GB"]
    B5["ComfyUI 런타임  ~0.5 GB"]
  end
  block:CPU2["CPU RAM (Celery Worker)"]
    C1["ZoeDepth  Intel/zoedepth-nyu  ~1.2 GB"]
    C2["rembg  U2Net  ONNX Runtime"]
  end
```

---

## ComfyUI 워크플로우 구조

### 광고 생성 — 기본 (제품 이미지 없음)

```
[1] CheckpointLoaderSimple (dreamshaper_xl.safetensors)
        ├── CLIP → [2] CLIPTextEncode (positive prompt)
        ├── CLIP → [3] CLIPTextEncode (negative prompt)
        ├── MODEL → [6] KSampler
        └── VAE   → [7] VAEDecode → [8] SaveImage
[4] EmptyLatentImage (1024×1024) → [6] KSampler
```

### 광고 생성 — IP-Adapter 포함 (제품 이미지 있음)

```
[1] CheckpointLoaderSimple
        └── [9] IPAdapterModelLoader + [10] CLIPVisionLoader + [11] LoadImage
                └── [12] IPAdapterAdvanced (weight=0.5)
                        └── MODEL → [6] KSampler → [7] VAEDecode → [8] SaveImage
```

### 플레이팅 — ControlNet Depth

```
[1] CheckpointLoaderSimple (dreamshaper_xl.safetensors)
        ├── CLIP → [2] CLIPTextEncode (무드 positive prompt)
        ├── CLIP → [3] CLIPTextEncode (negative prompt)
        ├── MODEL → [8] KSampler
        └── VAE   → [9] VAEDecode → [10] SaveImage
[4] EmptyLatentImage (1024×1024) → [8] KSampler
[5] ControlNetLoader (controlnet-depth-sdxl-1.0.safetensors)
[6] LoadImage (ZoeDepth 깊이맵)
        └── [7] ControlNetApplyAdvanced (strength=0.6, end_percent=0.85)
                └── positive/negative → [8] KSampler
```

KSampler 공통 파라미터: `steps=30`, `cfg=7.5`, `euler_ancestral`, `karras`, `denoise=1.0`

---

## Supabase DB 스키마

```mermaid
erDiagram
    auth_users {
        uuid id PK
        text email
    }
    campaigns {
        uuid id PK
        uuid user_id FK
        text menu_name
        text ingredients
        text style_id
        text category_key
        text selected_copy
        text feature_type
        timestamptz created_at
    }
    assets {
        uuid id PK
        uuid user_id FK
        uuid campaign_id FK
        text generated_image_url
        text platform
        text ad_copy
        timestamptz created_at
    }

    auth_users ||--o{ campaigns : "user_id"
    auth_users ||--o{ assets : "user_id"
    campaigns ||--o{ assets : "campaign_id"
```

두 테이블 모두 RLS 적용 — `auth.uid() = user_id` 일치 시에만 본인 데이터 접근 가능.

---

## 접근 제어

| 서비스 | 노출 방식 | 비고 |
|--------|-----------|------|
| Frontend (Next.js) | LoadBalancer (공개) | port 3000 |
| Backend (FastAPI) | ClusterIP | `/api/backend/*` rewrites로 접근 |
| Worker | 없음 (Celery 소비) | Redis 큐 구독 |
| ComfyUI | ClusterIP (port 8188) | Worker에서만 접근, 외부 미노출 |
| Redis | ClusterIP | Backend ↔ Worker 브로커 |
| Supabase | 외부 SaaS | PUBLISHABLE_KEY + RLS로 보호 |

ComfyUI GUI 디버깅 시: `kubectl port-forward deployment/comfyui 8188:8188`
