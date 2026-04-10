# Supabase 세팅 가이드

## 1. 프로젝트 생성

1. [supabase.com](https://supabase.com) 로그인
2. **New Project** 클릭
3. 프로젝트명, DB 비밀번호, 리전(Northeast Asia - Seoul 권장) 설정
4. 생성 완료까지 약 1~2분 대기

---

## 2. 스키마 적용

1. 좌측 메뉴 **SQL Editor** 클릭
2. `schema.sql` 전체 내용 붙여넣기 후 **Run** 실행
3. 하단에 `table_name` 목록에 `assets`, `campaigns` 확인

---

## 3. 인증 설정

1. 좌측 메뉴 **Authentication > Providers**
2. **Email** provider 활성화 (기본값)
3. **Confirm email** 옵션: 개발 중에는 OFF 권장 (빠른 테스트용)

---

## 4. 환경변수 발급

1. 좌측 메뉴 **Project Settings > API**
2. 아래 두 값 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 5. .env.local 파일 생성

Next.js 프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxx
```

> `.env.local`은 `.gitignore`에 포함되어 있어야 합니다. (Next.js 기본 제공)

---

## 6. GKE Secret 등록

```bash
kubectl create secret generic ad-secrets \
  --from-literal=OPENAI_API_KEY=sk-... \
  --from-literal=HF_TOKEN=hf_... \
  --from-literal=CIVITAI_API_KEY=... \
  --from-literal=NEXT_PUBLIC_SUPABASE_URL=https://... \
  --from-literal=NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 테이블 구조 요약

### campaigns
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | auth.users 참조 |
| menu_name | TEXT | 메뉴명 / 광고 설명 |
| ingredients | TEXT | 재료 (플레이팅 전용) |
| style_id | TEXT | 무드/테마 ID |
| category_key | TEXT | 업종 키 (광고생성 전용) |
| selected_copy | TEXT | 선택된 카피 (광고생성 전용) |
| feature_type | TEXT | 'plating' \| 'ad_generate' |
| created_at | TIMESTAMPTZ | 생성 시각 |

### assets
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | auth.users 참조 |
| campaign_id | UUID | campaigns 참조 |
| generated_image_url | TEXT | base64 data URL |
| platform | TEXT | 비율/플랫폼명 |
| ad_copy | TEXT | 광고 카피 (광고생성 전용) |
| created_at | TIMESTAMPTZ | 생성 시각 |
