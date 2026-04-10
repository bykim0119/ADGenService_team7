"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ChefHat, AtSign, KeyRound, Lock, UserRound } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const LoginSchema = z.object({
  email: z.string().email("정확한 이메일 주소를 입력해 주세요."),
  password: z.string().min(6, "비밀번호는 최소 6자리 이상이어야 합니다.")
});
type LoginFormValues = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const router = useRouter();

  const bgImages = [
    "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585032226651-759b368d7246?q=80&w=1600&auto=format&fit=crop"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % bgImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [bgImages.length]);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema)
  });

  const onLogin = async (data: LoginFormValues) => {
    setLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("이메일이나 비밀번호가 일치하지 않습니다.");
      } else {
        toast.error(error.message);
      }
      setLoading(false);
    } else {
      const userName = authData.user?.user_metadata?.full_name || authData.user?.user_metadata?.name || "";
      toast.success(`환영합니다! ${userName ? userName + ' ' : ''}님.`);
      router.push("/");
    }
  };

  const onSignUp = async (data: LoginFormValues) => {
    setLoading(true);
    const { error, data: signUpData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    
    if (error) {
       toast.error(error.message);
    } else if (signUpData?.user?.identities?.length === 0) {
       toast.warning("이미 가입된 이메일입니다.");
    } else {
       toast.success("등록되었습니다! 바로 로그인하실 수 있습니다.");
    }
    setLoading(false);
  };

  return (
    <div className="flex w-full h-screen bg-[#fcfdfc] overflow-hidden">
      {/* 화면 분할 6:4 비율 - 좌측 대형 이미지 포스터 영역 (60%) */}
      <div className="hidden md:flex md:w-[50%] lg:w-[58%] shrink-0 relative bg-slate-900 overflow-hidden">
        {bgImages.map((src, idx) => (
          <img 
            key={src} 
            src={src} 
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
              idx === currentBgIndex ? "opacity-100" : "opacity-0"
            )} 
            alt={`Restaurant Background ${idx + 1}`} 
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-40" />
        <div className="absolute inset-x-0 bottom-0 p-16 z-20">

          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-5 tracking-tight drop-shadow-2xl">감각적인 광고 디자인,<br/>AI와 함께 설계하다</h2>
          <p className="text-white/60 font-medium text-sm leading-relaxed max-w-sm drop-shadow-md">단 몇 초 만에 평범한 아이디어를<br/>세련된 광고 시안으로 완성해 보세요.</p>
        </div>
      </div>
      
      {/* 우측 로그인 폼 영역 (42%) */}
      <div className="flex-1 lg:w-[42%] flex flex-col justify-center items-center px-6 sm:px-12 bg-white">
        <div className="w-full max-w-[350px] space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 bg-primary/5 rounded-xl flex items-center justify-center mb-2 border border-primary/10 shadow-sm transition-all hover:scale-110 hover:rotate-3 relative group overflow-hidden">
               <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
               <ChefHat className="w-7 h-7 text-primary drop-shadow-sm z-10 animate-bounce-subtle" />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">AdGen.ai</h1>
            <p className="text-slate-400 text-[13px] font-medium leading-relaxed max-w-[240px]">최첨단 AI 기술로 완성하는<br/>감각적인 광고 디자인</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onLogin)}>
            <div className="space-y-4">
              <div className="space-y-1.5 px-1 group">
                <label className="text-[10px] font-bold text-primary/40 group-focus-within:text-primary transition-colors uppercase tracking-[0.2em] ml-1">이메일</label>
                <div className="relative group/input">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within/input:text-primary transition-colors" />
                  <Input {...register("email")} className={cn("pl-11 bg-white border-slate-200 h-12 rounded-lg text-[13px] focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm hover:border-slate-300", errors.email && "border-red-400 bg-red-50/30 ring-red-400")} placeholder="example@email.com" />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1.5 mt-1 animate-in slide-in-from-top-1">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5 px-1 group">
                <label className="text-[10px] font-bold text-primary/40 group-focus-within:text-primary transition-colors uppercase tracking-[0.2em] ml-1">비밀번호</label>
                <div className="relative group/input">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within/input:text-primary transition-colors" />
                  <Input type="password" {...register("password")} className={cn("pl-11 bg-white border-slate-200 h-12 rounded-lg text-[13px] focus-visible:ring-primary/20 focus-visible:bg-white transition-all shadow-sm hover:border-slate-300", errors.password && "border-red-400 bg-red-50/30 ring-red-400")} placeholder="••••••••" />
                </div>
                {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1.5 mt-1 animate-in slide-in-from-top-1">{errors.password.message}</p>}
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Button disabled={loading} type="submit" className="w-full h-12 rounded-lg font-bold text-[14px] text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all overflow-hidden relative group">
                <span className="relative z-10 flex items-center justify-center gap-2">
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "로그인"}
                </span>
                {!loading && (
                   <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                )}
              </Button>
              <div className="flex items-center gap-4 py-2 opacity-80">
                <div className="h-[1px] flex-1 bg-slate-100" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">계정이 없으신가요?</span>
                <div className="h-[1px] flex-1 bg-slate-100" />
              </div>
              <Link href="/signup" className="w-full">
                <Button disabled={loading} type="button" variant="outline" className="w-full h-12 rounded-lg font-bold text-[13px] text-primary border-primary/5 bg-slate-50/50 hover:bg-primary/5 hover:border-primary/10 shadow-sm transition-all active:scale-[0.98]">
                  회원가입
                </Button>
              </Link>
            </div>
          </form>
          
          <div className="text-center pt-2">
             <p className="text-[10px] font-bold text-slate-300 tracking-[0.1em]">© 2026 AdGen.ai. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
