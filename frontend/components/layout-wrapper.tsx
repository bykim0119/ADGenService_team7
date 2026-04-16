"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./layout/sidebar";
import { Header } from "./layout/header";
import { supabase } from "@/lib/supabase";
import { ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";


export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const [loading, setLoading] = useState(!isAuthPage);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }
    
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && !isAuthPage) {
        router.replace("/login");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, isAuthPage]);

  // 로그인/회원가입 페이지일 때 좌측 공통 메뉴(Sidebar/Header) 숨김
  if (isAuthPage) {
    return <main className="flex-1 flex w-full min-h-screen bg-white relative overflow-hidden">{children}</main>;
  }

  // 로그인 검증 전 상태일 때 로딩 띄우기 (깜빡임 방지)
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 gap-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-white rounded-[32px] border border-slate-100 flex items-center justify-center text-primary animate-bounce shadow-xl shadow-primary/5">
           <ChefHat className="w-10 h-10" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[13px] font-bold text-primary/60 tracking-widest uppercase">Chef AI Preparing Dashboard...</p>
          <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
            <div className="absolute inset-0 bg-primary w-2/3 rounded-full animate-in slide-in-from-left-full duration-[2500ms] ease-out-expo transition-all shadow-[0_0_8px_rgba(58,96,87,0.3)]" />
          </div>
        </div>
      </div>
    );
  }

  // 로그인 된 유저의 정상 화면 구성
  return (
    <div className="flex h-screen h-[100dvh] w-full relative overflow-hidden">

      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-full">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[30] animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <div className={cn(
        "lg:hidden fixed inset-y-0 left-0 z-[40] transition-transform duration-300 ease-out-expo shadow-2xl",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      <main className="flex-1 flex flex-col min-w-0 bg-surface relative overflow-hidden">
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
}
