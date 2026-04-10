-- ============================================================
-- Plating.ai + 광고 생성 서비스 Supabase 스키마
-- Supabase 대시보드 > SQL Editor에 전체 붙여넣기 후 실행
-- ============================================================

-- 1. UUID 확장 (Supabase 기본 활성화되어 있으나 명시)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 2. campaigns 테이블
--    플레이팅 / 광고 생성 작업 단위
-- ============================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    menu_name       TEXT NOT NULL,           -- 메뉴명 (플레이팅) / 광고 설명 (광고생성)
    ingredients     TEXT,                    -- 재료 설명 (플레이팅용)
    style_id        TEXT,                    -- 무드 컬러 ID (플레이팅: korean/white/... | 광고생성: cartoon/realistic/...)
    category_key    TEXT,                    -- 업종 키 (광고생성 전용: food/it/fashion/beauty/other)
    selected_copy   TEXT,                    -- 선택된 광고 카피 (광고생성 전용)
    feature_type    TEXT NOT NULL DEFAULT 'plating', -- 'plating' | 'ad_generate'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS campaigns_user_id_idx ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS campaigns_created_at_idx ON public.campaigns(created_at DESC);


-- ============================================================
-- 3. assets 테이블
--    생성된 이미지 결과물 (비율별 저장)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id          UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    generated_image_url  TEXT NOT NULL,      -- base64 data URL (data:image/png;base64,...)
    platform             TEXT,               -- 비율/플랫폼 (예: '1:1 (인스타 피드)', '9:16 (스토리/릴스)')
    ad_copy              TEXT,               -- 광고 카피 (광고생성 전용)
    created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS assets_campaign_id_idx ON public.assets(campaign_id);
CREATE INDEX IF NOT EXISTS assets_user_id_idx ON public.assets(user_id);


-- ============================================================
-- 4. Row Level Security (RLS) 활성화
--    본인 데이터만 접근 가능
-- ============================================================

-- campaigns RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns: 본인만 조회" ON public.campaigns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "campaigns: 본인만 삽입" ON public.campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns: 본인만 수정" ON public.campaigns
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "campaigns: 본인만 삭제" ON public.campaigns
    FOR DELETE USING (auth.uid() = user_id);


-- assets RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets: 본인만 조회" ON public.assets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "assets: 본인만 삽입" ON public.assets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assets: 본인만 수정" ON public.assets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "assets: 본인만 삭제" ON public.assets
    FOR DELETE USING (auth.uid() = user_id);


-- ============================================================
-- 5. 확인용 쿼리 (실행 후 테이블 목록 확인)
-- ============================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
