import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export type Campaign = {
  id: string
  user_id: string
  menu_name: string
  ingredients?: string
  style_id?: string
  category_key?: string
  selected_copy?: string
  feature_type: 'plating' | 'ad_generate'
  created_at: string
}

export type Asset = {
  id: string
  user_id: string
  campaign_id: string
  generated_image_url: string
  platform?: string
  ad_copy?: string
  created_at: string
}
