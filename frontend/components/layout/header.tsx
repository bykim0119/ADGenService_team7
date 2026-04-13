"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, User, UserCircle, Download, FileDown, LogOut,
  CheckCircle2, Info, Sparkles 
} from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isEditor = pathname.startsWith("/editor");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "환영합니다!", description: "이제 AdGen.ai에서 멋진 광고를 만들어 보세요.", time: "방금 전", icon: <Sparkles className="w-3.5 h-3.5 text-primary" />, unread: true },
    { id: 2, title: "AI 엔진 업데이트", description: "새로운 AI 스타일 5종이 추가되었습니다.", time: "2시간 전", icon: <Info className="w-3.5 h-3.5 text-blue-500" />, unread: true },
    { id: 3, title: "저장 완료", description: "광고 이미지가 에셋 라이브러리에 저장되었습니다.", time: "어제", icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />, unread: false },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("로그아웃 실패");
      return;
    }
    router.push("/login");
  };

  if (pathname === '/export') {
    return (
      <header className="w-full h-16 sticky top-0 z-50 flex justify-between items-center px-8 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <span className="text-[17px] font-semibold text-slate-800">내보내기 결과</span>
          <span className="bg-primary/10 text-primary text-[10px] font-semibold tracking-widest px-2 py-0.5 rounded-full">READY</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-primary hover:bg-primary/5 px-4 py-2 rounded-lg font-semibold hidden sm:flex items-center gap-2 text-[13px] transition-colors">
            <Download className="w-4 h-4" /> 모두 다운로드
          </button>
          <button className="bg-slate-900 hover:bg-slate-800 text-white text-[13px] px-5 py-2 font-medium rounded-full flex items-center transition-colors shadow-sm">
            <FileDown className="w-4 h-4 mr-2" /> 전체 다운로드 ZIP
          </button>
          <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
          {userEmail && <span className="text-[11px] font-semibold text-slate-500">{userEmail.split('@')[0]}</span>}
          
          <Popover>
            <PopoverTrigger asChild>
              <div className="relative group cursor-pointer">
                <Bell className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4 shadow-2xl border-slate-100 rounded-xl" align="end">
              <NotificationList notifications={notifications} setNotifications={setNotifications} />
            </PopoverContent>
          </Popover>

          <span title="로그아웃"><UserCircle onClick={handleLogout} className="w-5 h-5 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" /></span>
        </div>
      </header>
    );
  }

  let title = "AdGen.ai 대시보드";
  if (pathname === '/assets') title = "에셋 라이브러리";
  if (pathname === '/settings') title = "설정";

  return (
    <header className="w-full h-14 sticky top-0 z-10 flex justify-between items-center px-8 bg-white/70 backdrop-blur-xl border-b border-surface-container-highest/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] shrink-0">
      <div className="flex items-center gap-4">
        <h2 className="text-[14px] font-semibold text-on-surface tracking-tight">
          {isEditor ? "AI 광고 생성" : title}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        {userEmail && (
          <div className="flex items-center px-3 py-1 bg-slate-50 rounded-full border border-slate-100">
             <span className="text-[11px] font-bold text-slate-500 tracking-wide">{userEmail}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-full w-8 h-8 relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 shadow-2xl border-slate-100 rounded-xl" align="end">
               <NotificationList notifications={notifications} setNotifications={setNotifications} />
            </PopoverContent>
          </Popover>
          <Button onClick={handleLogout} variant="ghost" size="icon" className="text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full w-8 h-8 transition-colors" title="로그아웃">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function NotificationList({ notifications, setNotifications }: any) {
  return (
    <div className="flex flex-col">
      <div className="p-4 border-b border-slate-50 flex items-center justify-between">
        <h4 className="text-[13px] font-bold text-slate-800">알림</h4>
        <button 
          onClick={() => setNotifications(notifications.map((n: any) => ({ ...n, unread: false })))}
          className="text-[11px] font-semibold text-primary hover:underline"
        >
          모두 읽음
        </button>
      </div>
      <ScrollArea className="h-[300px]">
        {notifications.map((notification: any) => (
          <div 
            key={notification.id} 
            className={cn(
              "p-4 border-b border-slate-50/50 flex gap-3 hover:bg-slate-50/50 transition-colors cursor-default",
              notification.unread && "bg-primary/[0.02]"
            )}
          >
            <div className="mt-0.5 flex-shrink-0 w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
              {notification.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <h5 className="text-[12px] font-bold text-slate-800">{notification.title}</h5>
                <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">{notification.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-[1.6] line-clamp-2">
                {notification.description}
              </p>
            </div>
          </div>
        ))}
      </ScrollArea>
      <div className="p-3 text-center border-t border-slate-50">
        <Link href="/notifications">
          <button className="text-[11px] font-bold text-slate-400 hover:text-primary transition-colors">
            모든 알림 보기
          </button>
        </Link>
      </div>
    </div>
  );
}
