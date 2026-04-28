# 협업일지

---

## 2026-03-30

**목표 설정 및 설계 발표**

- 각자 개인 개발 후 잘한 점을 모아 하나로 통합하는 전략 수립
- 설계서 작성 후 팀원 전체에게 발표

---

## 2026-03-31

**기본 모델 프로토타입**

- `flux-schnell` 기반 text2img 기본 구현 완료

---

## 2026-04-01

**서비스 아키텍처 설계 + 모델 교체**

- `flux + IP-Adapter` 형태의 image+text → image 파이프라인 구현
- **문제 발생:** flux 모델을 로컬에서 가동 불가 (시스템 마비)
- **대응:** GKE 이전을 전제로 프론트/백엔드를 제외한 구조로 구현
  - 우선 VM 단일 환경에서 완성 → 이후 GKE 배포
  - 인프라 스펙: `n1-standard-4`, `T4 Spot`, `e2-small`

---

## 2026-04-02

**GKE 연동 시작**

- 계정 전환 후 클러스터 생성 시도 → 기본 제공 GPU가 0이어서 할당 요청
- 로컬 WSL에 `gcloud`, `kubectl` 설치
- Artifact Registry 이미지 푸시

---

## 2026-04-03

**GKE 인프라 구성 완료 + 엔드투엔드 테스트**

| 작업 | 내용 |
|------|------|
| GKE 클러스터 생성 | `cluster-main`, `asia-east1-c` |
| GPU 노드풀 생성 | `n1-highmem-4` + T4 Spot |
| Artifact Registry | `ad-gen-project` 생성 및 인증 설정 |
| Docker 이미지 빌드 & 푸시 | `Dockerfile.backend` / `Dockerfile.frontend` |
| Kubernetes 매니페스트 작성 | Deployment, Service (backend/frontend 각각) |
| `kubectl apply` 배포 | YAML 적용 → 실제 파드 실행 |
| NVIDIA GPU DaemonSet 확인 | GKE 관리형 드라이버 자동 적용 여부 확인 |
| 엔드투엔드 테스트 | Streamlit UI 외부 접근 및 광고 생성 전체 흐름 확인 |
| IP-Adapter 호환성 검증 | XLabs IP-Adapter-v2 가중치 ↔ `diffusers load_ip_adapter` GPU 환경 테스트 |

> **Deployment:** 컨테이너 이미지 실행 수를 지정, 장애 시 자동 재시작  
> **Service:** 파드에 고정 IP/DNS 부여, 재시작 시 IP 변경 문제 해결  
> **DaemonSet:** 모든 노드에 파드 1개씩 자동 배포 (GPU 드라이버 설치용)

---

## 2026-04-06

**모델 최적화 + 아키텍처 고도화**

- GKE 제한 자원에 맞게 모델 양자화 및 최적화
- 파이프라인 분할: `SDXL + IP-Adapter` / `flux-schnell` 두 가지로 분리
- GKE에 Redis + Worker 비동기 아키텍처 추가
- 폰트 및 문구 스타일 변경 기능 추가
- **팀 회의:** 미완성 팀원이 과반수 → 다음 날도 개인 개발 진행하기로 결정

---

## 2026-04-07

**모델 튜닝 + 기능 통합 논의**

- `ip-adapter scale` 파라미터 튜닝
- 기능 통합 방향 논의: 팀원 개발 기능을 우선 참고하여 반영 후 이후 고도화

---

## 2026-04-08

**ComfyUI 도입 설계**

- ComfyUI를 추가하여 기존 아키텍처 수정 및 재설계

---

## 2026-04-09

**ComfyUI GKE 배포**

- ComfyUI를 GKE 파드에 독립 배포, API 형태로 호출
- **문제 발생:** 기존 Redis와 기능 충돌 (병렬화 등 유사 기능 중복)

---

## 2026-04-10

**Redis + ComfyUI 역할 분리**

- Worker → ComfyUI 파드에 요청 전송
- Redis → 기존처럼 비동기 큐 역할 유지
- 두 컴포넌트가 충돌 없이 맞물리도록 구조 수정

---

## 2026-04-13

**UI 전면 개편 + 성능 개선**

- **에디터 리디자인:** 2패널 채팅 UI로 변경 + 해시태그 생성 기능 추가
- **성능:** GPT 병렬 호출 적용 → 약 4초 속도 개선
- **UX:** 진행 바(progress bar) 적용
- **레이아웃 복원:** 3컬럼 구조 (좌: 설정 | 중: 캔버스 | 우: 히스토리)
- **플랫폼명 복원:** 인스타 피드, 인스타 스토리 등 비율 명칭
- **배포 설정 수정:** backend/worker `imagePullPolicy: Always`
- **팀원 PR 반영:** `steps=24`, `cfg=7.5`

---

## 2026-04-14

**ComfyUI 최적화**

- ComfyUI warmup 기능 추가: 더미 요청으로 모델 미리 로드
- ComfyUI 파라미터 튜닝

---

## 2026-04-15

**팀원 인프라 접근 권한 설정**

- 팀원 GKE 계정 등록 및 권한 부여

---

## 2026-04-16 — 04-17

**이미지 생성 프롬프트 고도화**

- 프롬프트 고도화 작업 시작
- 룰 추가, step 최적화

---

## 2026-04-20

**버그 수정 + 발표 준비**

- Fabric.js 드래그 버그 수정
- `arch.md` 현행화
- 중간 발표 준비

---

## 2026-04-21

**중간 발표**

---

## 2026-04-22

**피드백 반영**

- 발표 피드백 기반 PPT 수정
- 추가 개선 작업 진행

---

## 2026-04-23

- `arch.md` 업데이트

---

## 2026-04-24

- `feature/advanced-copy-generation` 브랜치 → main 병합 (PR #8)

---

## 2026-04-27

- `90heum` 브랜치 백엔드 개선사항 반영
- SDXL CLIP 77토큰 제한 규칙 복원 및 프롬프트 구조 개선
- README 서비스 시연 이미지 추가
- README 프로젝트 보고서 PDF 링크 추가
