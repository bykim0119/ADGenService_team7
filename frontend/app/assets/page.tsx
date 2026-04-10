"use client";

import React, { useEffect, useState } from "react";
import { FolderOpen, ExternalLink, Calendar, Download, ChefHat, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AssetRecord {
  id: string;
  generated_image_url: string;
  created_at: string;
  platform: string;
  campaigns: {
    menu_name: string;
    style_id: string;
  };
}

const STYLE_LABELS: Record<string, string> = {
  warm_brunch: "☀️ 햇살 브런치",
  elegant_dining: "🕯️ 고급 다이닝",
  night_market: "🏮 심야 식당",
  garden_terrace: "🌿 가든 테라스",
  french_dining: "프렌치 다이닝",
  modern_minimal: "모던 미니멀",
  rustic_natural: "러스틱 내추럴",
  dark_moody: "다크 무디"
};

const PLATFORM_LABELS: Record<string, string> = {
  "정사각형 (인스타)": "인스타 피드",
  "스토리 (세로형)": "인스타 스토리",
  "와이드 (풍경형)": "유튜브 썸네일",
  "와이드뷰 (영화)": "배너 광고",
  "1:1": "인스타 피드",
  "9:16": "인스타 스토리",
  "16:9": "유튜브 썸네일",
  "21:9": "배너 광고",
  "1:1 (인스타 피드)": "인스타 피드",
  "9:16 (스토리/릴스)": "인스타 스토리",
  "16:9 (와이드 광고)": "유튜브 썸네일",
  "21:9 (시네마틱)": "배너 광고",
  "인스타 피드": "인스타 피드",
  "인스타 스토리": "인스타 스토리",
  "유튜브 썸네일": "유튜브 썸네일",
  "배너 광고": "배너 광고"
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllAssets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('assets')
          .select(`
            id,
            generated_image_url,
            created_at,
            platform,
            campaigns!inner (
              menu_name,
              style_id
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Data loading error:", error);
          return;
        }
        
        setAssets(data as unknown as AssetRecord[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAssets();
  }, []);

  const handleDownload = async (url: string, prefixName: string) => {
    try {
      if (url.includes('unsplash.com')) {
        toast.warning("This is a temporary sample image.");
        return;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const safeName = prefixName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      link.download = `${safeName}_${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during download.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("정말 이 에셋을 삭제하시겠습니까?")) {
      const { error } = await supabase.from('assets').delete().eq('id', id);
      if (!error) {
        setAssets(prev => prev.filter(a => a.id !== id));
        toast.success("에셋이 삭제되었습니다.");
      } else {
        toast.error("에셋 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  const handlePreview = (base64: string) => {
    try {
      const parts = base64.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);
      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }
      const blob = new Blob([uInt8Array], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      // Note: revoked on window close or manual cleanup if needed, but for preview simple open is enough
    } catch (e) {
      console.error(e);
      // Fallback for simple URLs
      window.open(base64, '_blank');
    }
  };

  return (
    <div className="p-8 md:p-12 mb-20 max-w-[1600px] mx-auto w-full flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div 
        className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-8 slide-in-from-left-8 duration-1000 ease-out"
        style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
      >
        <h1 className="text-3xl font-bold text-on-surface tracking-tight !border-0">에셋 라이브러리</h1>
        <p className="text-[14px] font-medium text-on-surface/60 !border-0">관리 중인 모든 브랜드 에셋과 광고 디자인을 확인하세요.</p>
      </div>
      
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 animate-in fade-in duration-700">
          <div className="w-20 h-20 bg-primary/5 rounded-[32px] flex items-center justify-center text-primary animate-pulse shadow-xl shadow-primary/5">
             <ChefHat className="w-10 h-10" />
          </div>
          <p className="text-[13px] font-bold text-primary/60 tracking-widest uppercase">에셋 로딩 중...</p>
          <p className="text-on-surface/40 text-[11px] font-bold tracking-tight bg-surface-container-lowest px-4 py-1.5 rounded-full border border-surface-container-highest/60 shadow-sm">AI가 에셋 라이브러리를 불러오는 중입니다...</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-surface-container-highest/60 rounded-xl bg-surface-container-lowest min-h-[400px]">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center border border-surface-container-highest/40 shadow-sm mb-4">
            <FolderOpen className="w-6 h-6 text-on-surface/20" />
          </div>
          <h3 className="text-[17px] font-semibold text-on-surface/80">에셋이 비어 있습니다</h3>
          <p className="text-[13px] text-on-surface/40 mt-2 max-w-sm text-center leading-relaxed">새로운 광고를 생성하고 에셋을 라이브러리에 저장해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="group overflow-hidden rounded-xl border border-surface-container-highest/60 hover:border-primary/30 transition-all duration-300 hover:shadow-lg flex flex-col bg-white">
              <div className="aspect-square relative overflow-hidden bg-surface-container-low">
                <img 
                  src={asset.generated_image_url} 
                  alt={asset.campaigns?.menu_name || "Generated Asset"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
                  <Badge className="bg-on-surface/90 text-white border-0 text-[10px] px-2.5 py-1.5 font-bold shadow-md backdrop-blur-md">
                    {PLATFORM_LABELS[asset.platform] || asset.platform || "인스타 피드"}
                  </Badge>
                  <Badge className="bg-white/90 text-primary border-0 text-[9px] px-2 py-0.5 font-bold shadow-sm backdrop-blur-md">
                    {STYLE_LABELS[asset.campaigns?.style_id] || asset.campaigns?.style_id?.toUpperCase() || "STYLE"}
                  </Badge>
                </div>
                
                <div className="absolute inset-0 bg-on-surface/40 opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px] flex items-center justify-center gap-3">
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }}
                    className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 shadow-xl border-2 border-white/20 transition-transform active:scale-95"
                    title="에셋 삭제"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </Button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePreview(asset.generated_image_url); }} 
                    className="w-10 h-10 rounded-full bg-white text-on-surface hover:bg-surface-container-highest flex items-center justify-center transition-all shadow-lg active:scale-95"
                    title="원본 보기"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDownload(asset.generated_image_url, asset.campaigns?.menu_name || 'plating_ai'); }}
                    className="w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center transition-all shadow-lg active:scale-95"
                    title="다운로드"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-5 flex flex-col gap-2">
                <h4 className="font-bold text-[15px] text-on-surface line-clamp-1">
                  {asset.campaigns?.menu_name || "이름 없는 메뉴"}
                </h4>
                <div className="flex items-center text-on-surface/30 text-[11px] font-bold tracking-tight">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {new Date(asset.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
