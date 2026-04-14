"use client";

import React from "react";
import { Download, CheckCircle, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function ExportPage() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaign_id');
  const [assetUrl, setAssetUrl] = useState("https://images.unsplash.com/photo-1544025162-811c0f0552b7?auto=format&fit=crop&q=80&w=1600&h=800");
  const [campaignData, setCampaignData] = useState<{ menu_name: string; selected_copy: string | null } | null>(null);

  useEffect(() => {
    if (campaignId) {
      const fetchAssetData = async () => {
        const { data: asset } = await supabase
          .from('assets')
          .select('generated_image_url')
          .eq('campaign_id', campaignId)
          .limit(1)
          .single();
        
        if (asset?.generated_image_url) {
          setAssetUrl(asset.generated_image_url);
        }

        const { data: campaign } = await supabase
          .from('campaigns')
          .select('menu_name, selected_copy')
          .eq('id', campaignId)
          .single();
        
        if (campaign) {
          setCampaignData(campaign);
        }
      };
      fetchAssetData();
    }
  }, [campaignId]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      if (url.includes('unsplash.com')) {
        toast.warning("이 이미지는 임시 샘플 이미지입니다. 실제 AI가 생성한 이미지를 저장해주세요.");
        return;
      }
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      console.error(e);
      toast.error("다운로드 중 에러가 발생했습니다.");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative overflow-y-auto">
      <div className="p-4 md:px-10 md:py-6 space-y-6 mb-2 max-w-[1600px] mx-auto w-full">


        {/* Success Message Section */}
        <section className="flex flex-col items-center text-center space-y-2 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center mb-1">
            <CheckCircle className="text-primary w-5 h-5" />
          </div>
          <h2 className="text-[19px] font-semibold tracking-tight text-slate-800">최종 배너가 성공적으로 준비되었습니다</h2>
          <p className="text-slate-500 max-w-sm mx-auto text-[13px] leading-relaxed">
            각종 배달 앱, 소셜 미디어 및 웹사이트 규격에 맞춰 고비율 에셋 최적화가 완료되었습니다. 지금 바로 내보내세요.
          </p>
        </section>

        {/* Asset Bento Grid */}
        <section className="grid grid-cols-12 gap-5 pb-4">

          {/* Web Hero Banner (Large) */}
          <div className="col-span-12 md:col-span-8 group relative rounded-2xl overflow-hidden bg-white border border-surface-container-highest/60 hover:border-primary/30 transition-all duration-500 animate-in fade-in slide-in-from-bottom-8 duration-700 shadow-xl h-[400px]">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${assetUrl}')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-8 transition-opacity">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-white/90 font-bold tracking-[0.2em] uppercase mb-1.5 block drop-shadow-sm">WEB HERO BANNER</span>
                  <h3 className="text-white text-[20px] font-bold drop-shadow-sm line-clamp-2 max-w-lg mb-1 leading-tight">
                    {campaignData?.selected_copy || campaignData?.menu_name || "공식 웹사이트 메인 히어로"}
                  </h3>
                  <p className="text-white/70 text-[11px] font-medium drop-shadow-sm">1920 x 800 px</p>
                </div>
                <button 
                  onClick={() => handleDownload(assetUrl, 'hero_banner.jpg')}
                  className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                  title="저장"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>


          </div>

          {/* Instagram Story (Portrait) */}
          <div className="col-span-12 md:col-span-4 group relative rounded-2xl overflow-hidden bg-white border border-surface-container-highest/60 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 shadow-xl h-[400px]">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${assetUrl}')` }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/70 flex flex-col justify-between p-8">
              <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase drop-shadow-sm self-start">STORY</span>
              <div className="flex justify-between items-end">
                <div className="text-white drop-shadow-sm">
                  <h3 className="text-[18px] font-bold leading-snug line-clamp-3">
                    {campaignData?.selected_copy || campaignData?.menu_name || "인스타 스토리"}
                  </h3>
                  <p className="text-[11px] text-white/70 font-medium mt-1">1080 x 1920 px</p>
                </div>
                <button 
                  onClick={() => handleDownload(assetUrl, 'instagram_story.jpg')}
                  className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                  title="저장"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>



          </div>

          {/* Delivery App Banner (Medium) */}
          <div className="col-span-12 md:col-span-6 group relative rounded-2xl overflow-hidden bg-white border border-surface-container-highest/60 h-72 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 shadow-xl">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${assetUrl}')` }}></div>
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="bg-primary text-white border-0 px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-md">DELIVERY APP</span>
              </div>
              <div className="flex justify-between items-end text-white drop-shadow-md">
                <div className="flex-1 mr-4 min-w-0">
                  <h3 className="text-[16px] font-bold truncate">
                    {campaignData?.selected_copy || campaignData?.menu_name || "배달의민족/쿠팡이츠 배너"}
                  </h3>
                  <p className="text-[11px] text-white/70 font-medium mt-0.5">1280 x 720 px</p>
                </div>
                <button 
                  onClick={() => handleDownload(assetUrl, 'delivery_banner.jpg')}
                  className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                  title="저장"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Instagram Post (Square) */}
          <div className="col-span-12 md:col-span-6 group relative rounded-2xl overflow-hidden bg-white border border-surface-container-highest/60 h-72 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 shadow-xl">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${assetUrl}')` }}></div>
            <div className="absolute inset-0 bg-primary/30 group-hover:bg-primary/20 transition-colors duration-500"></div>
            <div className="absolute inset-0 p-8 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="bg-slate-900 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase shadow-md">INSTAGRAM</span>
              </div>
              <div className="flex justify-between items-end text-white drop-shadow-md">
                <div className="flex-1 mr-4 min-w-0">
                  <h3 className="text-[16px] font-bold truncate">
                    {campaignData?.selected_copy || campaignData?.menu_name || "인스타그램 정방형 포스트"}
                  </h3>
                  <p className="text-[11px] text-white/70 font-medium mt-0.5">1080 x 1080 px</p>
                </div>
                <button 
                  onClick={() => handleDownload(assetUrl, 'instagram_post.jpg')}
                  className="bg-white/90 backdrop-blur-md hover:bg-white text-slate-900 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95"
                  title="저장"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
