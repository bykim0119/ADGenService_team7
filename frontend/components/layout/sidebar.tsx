"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Utensils, Home, Megaphone, FolderOpen, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function Sidebar() {
  const pathname = usePathname();
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserData({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Chef",
          email: user.email || ""
        });
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { href: "/", icon: Home, label: "홈" },
    { href: "/editor", icon: Megaphone, label: "AI 이미지 생성" },
    { href: "/assets", icon: FolderOpen, label: "에셋 라이브러리" },
    { href: "/settings", icon: Settings, label: "설정" }
  ];

  return (
    <aside className="flex flex-col py-8 px-4 h-screen w-64 bg-white border-r border-slate-100 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.05)] tracking-tight z-20 shrink-0 relative">
      <div className="mb-10 px-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 rounded-[10px] flex items-center justify-center text-primary shadow-sm">
          <Utensils className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">AdGen.ai</h1>
        </div>
      </div>

      <div className="mb-8 flex flex-col gap-2 px-1">
        <Link href="/editor" className="block">
          <Button className="w-full h-11 rounded-lg font-bold text-[13px] text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-[0.98] transition-all overflow-hidden relative group border-0">
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Megaphone className="w-4 h-4" />
              AI 이미지 생성
            </span>
            <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
          </Button>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[13px] font-medium cursor-pointer group",
                  isActive 
                    ? "text-primary bg-primary/[0.04] font-semibold" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <item.icon className={cn("w-4 h-4 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100 px-1">
        <div className="flex items-center gap-3 px-2 p-2 rounded-xl">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shrink-0 group-hover:shadow-sm transition-all bg-slate-100 flex items-center justify-center">
            {userData?.name ? (
              <span className="text-primary font-bold text-[13px]">{userData.name[0]}</span>
            ) : (
              <img alt="Profile" className="w-full h-full object-cover opacity-0" src="" />
            )}
          </div>
              <div className="flex-1 mr-4 min-w-0">
                <span className="text-[13px] font-semibold text-slate-700 truncate">{userData?.name || "로딩 중..."}</span>
                <span className="text-[10px] text-primary/70 truncate mt-0.5 font-bold uppercase tracking-tight">{userData?.email || "사용자"}</span>
              </div>
        </div>
      </div>
    </aside>
  );
}
