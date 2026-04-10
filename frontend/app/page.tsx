"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FolderOpen, MousePointerClick, TrendingUp, Megaphone, Loader2, ArrowRight, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const [userName, setUserName] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalGenerated: 0, activeCampaigns: 0, savedAssets: 0 });
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    {
      img: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=2069&auto=format&fit=crop",
      title: "Elevate Your Brand",
      subtitle: "AI Ad Generator",
      desc: "인공지능이 설계하는 감각적인 광고 비주얼.\n단 한 번의 터치로 완벽한 광고 이미지를 생성하세요."
    },
    {
      img: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?q=80&w=2000&auto=format&fit=crop",
      title: "Master the Aesthetics",
      subtitle: "Smart Brand Design",
      desc: "브랜드 아이덴티티를 담은 광고 디자인.\n업종, 테마, 분위기를 설정하면 AI가 완성합니다."
    },
    {
      img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2000&auto=format&fit=crop",
      title: "Design for Everyone",
      subtitle: "High-End Visual AI",
      desc: "누구나 쉽게 만드는 프로급 광고 시안.\n시각적 경험을 통해 브랜드 로열티를 확보하세요."
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name);
      } else if (user.email) {
        setUserName(user.email.split('@')[0]);
      }

      const [{ count: campCount }, { count: assetCount }] = await Promise.all([
        supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('assets').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      ]);

      setStats({
        totalGenerated: (campCount || 0) + (assetCount || 0),
        activeCampaigns: campCount || 0,
        savedAssets: assetCount || 0
      });

      const { data: camps } = await supabase
        .from('campaigns')
        .select('*, assets(generated_image_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (camps) {
        setRecentCampaigns(camps.map(c => ({
          id: c.id,
          name: c.menu_name,
          status: "초안",
          date: new Date(c.created_at).toLocaleDateString(),
          image: c.assets?.[0]?.generated_image_url || null
        })));
      }

      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center justify-center text-primary animate-pulse shadow-xl shadow-primary/5">
           <ChefHat className="w-10 h-10" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[13px] font-bold text-primary/60 tracking-widest uppercase">로딩 중...</p>
        </div>
        <p className="text-slate-400 text-[11px] font-bold tracking-tight bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 shadow-sm">AI가 회원님의 광고 정보를 가져오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="p-8 md:p-12 mb-20 max-w-[1200px] mx-auto w-full flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
          안녕하세요, {userName || "사용자"}님!
        </h1>
        <p className="text-[14px] font-medium text-slate-500">오늘도 AI와 함께 완벽한 광고 이미지를 만들어 보세요.</p>
      </div>

      {/* Hero Slide Show: Horizontal Slide 리모델링 */}
      <Card className="group relative overflow-hidden rounded-[36px] border-0 bg-white p-0 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] transition-all duration-1000 h-[380px]">
        
        {/* Sliding Container */}
        <div 
          className="absolute inset-0 flex transition-transform duration-[1000ms] ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroSlides.map((slide, idx) => (
            <div 
              key={idx}
              className="relative w-full h-full shrink-0 bg-cover bg-center"
              style={{ backgroundImage: `url("${slide.img}")` }}
            >
               <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-10" />
               
               {/* Slide Content (Inside each slide for better sync) */}
               <div className="relative z-20 p-10 md:py-14 md:px-16 flex flex-col items-start justify-center h-full gap-6 max-w-4xl">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-[1px] bg-white/40" />
                       <span className="text-[10px] font-black text-white/80 tracking-[0.5em] uppercase">
                         {slide.subtitle}
                       </span>
                    </div>
                    
                    <h2 className="text-4xl md:text-[48px] font-bold text-white leading-[1.1] tracking-tight drop-shadow-xl">
                       {slide.title.split(" ").map((word, i) => (
                         i === 0 ? <span key={i} className="text-primary-foreground/90 font-serif italic font-light mr-3">{word}</span> : <span key={i}>{word} </span>
                       ))}
                    </h2>
                    
                    <p className="text-[14px] text-white/80 max-w-md leading-relaxed font-medium drop-shadow-lg whitespace-pre-wrap">
                      {slide.desc}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 mt-2">
                    <Link href="/editor">
                      <Button className="h-12 px-8 rounded-lg font-bold text-[14px] text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all overflow-hidden relative group border-0">
                        <span className="relative z-10 flex items-center justify-center gap-2">
                           광고 생성하기
                           <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                      </Button>
                    </Link>
                  </div>
               </div>
            </div>
          ))}
        </div>

        {/* Slide Dots Indicator (Fixed Position) */}
        <div className="absolute bottom-8 right-12 z-30 flex gap-2.5">
          {heroSlides.map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentSlide(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                currentSlide === i ? "bg-white w-8 shadow-lg shadow-white/20" : "bg-white/30 hover:bg-white/50"
              )}
            />
          ))}
        </div>
      </Card>




      {/* Stats Board (Compact & Unified Design) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "총 생성 수", value: stats.totalGenerated, icon: TrendingUp },
          { label: "활성 광고", value: stats.activeCampaigns, icon: MousePointerClick },
          { label: "저장된 에셋", value: stats.savedAssets, icon: FolderOpen }
        ].map((item, idx) => (
          <Card key={idx} className="group relative p-5 rounded-[24px] border border-slate-100 bg-white transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 cursor-default overflow-hidden">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                  {item.label}
                </p>
                <div className="flex items-baseline gap-1.5">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">
                    {item.value}
                  </h3>
                  <span className="text-[12px] font-bold text-slate-300">개</span>
                </div>
              </div>
            </div>
            
            {/* Subtle glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Card>
        ))}
      </div>

      {/* Recent Campaigns */}
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2 text-slate-800 ml-1">
          <FolderOpen className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-bold">최근 작업한 디자인</h3>
        </div>
        <div className="flex flex-col gap-3">
          {recentCampaigns.length === 0 ? (
            <div className="py-20 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50">
               <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                 <Megaphone className="w-6 h-6 text-slate-200" />
               </div>
               <p className="text-slate-400 text-[14px] font-bold">아직 생성된 광고가 없습니다.</p>
               <p className="text-slate-300 text-[12px] mt-2 font-medium">첫 번째 AI 디자인을 만들어보세요!</p>
            </div>
          ) : recentCampaigns.map((campaign) => (
            <Link key={campaign.id} href={`/export?campaign_id=${campaign.id}`}>
              <Card className="p-5 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-primary/20 hover:bg-primary/[0.01] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-primary transition-colors" />
                <div className="flex items-center gap-5 relative z-10">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/5 group-hover:border-primary/10 transition-all overflow-hidden bg-cover bg-center" style={{ backgroundImage: campaign.image ? `url(${campaign.image})` : 'none' }}>
                    {!campaign.image && <Megaphone className="w-4 h-4 opacity-20" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-slate-800 group-hover:text-primary transition-colors">{campaign.name}</h4>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[11px] text-slate-400 font-bold">{campaign.date}</p>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="text-[11px] text-slate-400 font-medium">최근에 수정됨</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <Button variant="ghost" size="icon" className="group-hover:bg-primary/5 rounded-full text-slate-300 group-hover:text-primary w-10 h-10 transition-all">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
