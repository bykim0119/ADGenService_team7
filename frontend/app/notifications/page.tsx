"use client";

import React, { useState, useEffect } from "react";
import { Bell, Sparkles, Info, CheckCircle2, ChevronRight, Search, Loader2, ChefHat, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notifications] = useState([
    { id: 1, title: "환영합니다!", description: "이제 AdGen.ai에서 멋진 광고를 만들어 보세요. AI 엔진이 첫 번째 광고를 기다리고 있습니다.", time: "방금 전", date: "2026.03.31", icon: <Sparkles className="w-4 h-4 text-primary" />, category: "시스템", unread: true },
    { id: 2, title: "AI 엔진 업데이트 v2.1", description: "새로운 AI 스타일 5종이 추가되었습니다. 지금 에디터에서 확인해보세요.", time: "2시간 전", date: "2026.03.31", icon: <Info className="w-4 h-4 text-primary" />, category: "업데이트", unread: true },
    { id: 3, title: "광고 저장 완료", description: "광고 이미지 저장이 완료되었습니다. 에셋 보관함에서 다운로드 받으실 수 있습니다.", time: "어제", date: "2026.03.30", icon: <CheckCircle2 className="w-4 h-4 text-primary" />, category: "작업", unread: false },
    { id: 4, title: "로그인 보안 안내", description: "새로운 기기에서 로그인 시도가 감지되었습니다. 본인의 활동이라면 무시하셔도 좋습니다.", time: "3일 전", date: "2026.03.28", icon: <ShieldCheckIcon className="w-4 h-4 text-primary" />, category: "보안", unread: false },
  ]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filtered = notifications.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.description.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 animate-in fade-in duration-700 bg-white/50">
        <div className="w-20 h-20 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center justify-center text-primary animate-pulse shadow-xl shadow-primary/5">
           <ChefHat className="w-10 h-10" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[13px] font-bold text-primary/60 tracking-widest uppercase">로딩 중...</p>
        </div>
        <p className="text-on-surface/40 text-[11px] font-bold tracking-tight bg-surface-container-lowest px-4 py-1.5 rounded-full border border-surface-container-highest/60 shadow-sm">AI가 새로운 알림을 확인 중입니다...</p>
      </div>

    );
  }

  return (
    <div className="p-4 md:p-12 mb-2 max-w-[1600px] mx-auto w-full flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div 
        className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-8 slide-in-from-left-8 duration-1000 ease-out"
        style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
      >
        <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">알림</h1>
        <p className="text-[14px] font-medium text-on-surface/60">새로운 소식과 작업 업데이트를 한눈에 확인하세요.</p>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="알림 검색..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-white border-slate-200 rounded-xl text-[13px] focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filtered.length === 0 ? (
             <div className="p-20 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
               <p className="text-slate-400 text-[13px] font-medium">검색 결과가 없거나 알림이 비어 있습니다.</p>
             </div>
          ) : (
            filtered.map((notification) => (
              <Card 
                key={notification.id} 
                className={cn(
                  "p-5 border-slate-100 hover:border-primary/20 hover:shadow-md transition-all group cursor-pointer overflow-hidden relative rounded-2xl bg-white shadow-sm",
                  notification.unread && "bg-primary/[0.01] border-primary/10"
                )}
              >
                {notification.unread && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                )}
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                     {notification.icon}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[15px] text-slate-800">{notification.title}</h4>
                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-slate-50 text-slate-400 border-slate-200 uppercase tracking-wider">{notification.category}</Badge>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">{notification.time}</span>
                    </div>
                    <p className="text-[13px] text-slate-500 leading-relaxed font-medium">
                      {notification.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300 font-bold tracking-tight">{notification.date}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
