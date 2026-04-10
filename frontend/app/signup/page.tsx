"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, ChefHat, AtSign, KeyRound, UserRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const SignUpSchema = z.object({
  name: z.string().min(2, "이름을 2글자 이상 입력해 주세요."),
  email: z.string().email("정확한 이메일 주소를 입력해 주세요."),
  password: z.string().min(6, "비밀번호는 최소 6자리 이상이어야 합니다."),
  confirmPassword: z.string().min(6, "비밀번호 확인을 입력해 주세요.")
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof SignUpSchema>;

export default function SignUpPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormValues>({
    resolver: zodResolver(SignUpSchema)
  });

  const onSignUp = async (data: SignUpFormValues) => {
    setLoading(true);
    const { error, data: signUpData } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.name,
        }
      }
    });
    
    if (error) {
       toast.error(error.message);
       setLoading(false);
    } else if (signUpData?.user?.identities?.length === 0) {
       toast.warning("이미 가입된 이메일입니다.");
       setLoading(false);
    } else {
       toast.success("회원가입이 완료되었습니다! 로그인해 주세요.");
       router.push("/login");
    }
  };

  return (
    <div className="flex w-full min-h-[100dvh] bg-white overflow-hidden">
      {/* 좌측 이미지 영역 (60%) */}
      <div className="hidden md:flex md:w-[50%] lg:w-[58%] shrink-0 relative bg-slate-900 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover" alt="Premium Coffee Layout" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pt-40" />
        <div className="absolute inset-x-0 bottom-0 p-16 z-20">

           <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-5 tracking-tight drop-shadow-2xl">당신의 브랜드에<br/>예술적 가치를 더하세요</h2>
          <p className="text-white/60 font-medium text-sm leading-relaxed max-w-sm drop-shadow-md">AdGen.ai와 함께 세련된 광고 비주얼을<br/>단 몇 초 만에 완성해 보세요.</p>
          
          <div className="mt-10 space-y-4">
            <div className="flex items-center gap-3 text-white group">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/10 transition-transform group-hover:scale-110 border border-white/20">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold tracking-tight text-white/90">제한 없는 AI 광고 이미지 생성</span>
            </div>
            <div className="flex items-center gap-3 text-white group">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg shadow-black/10 transition-transform group-hover:scale-110 border border-white/20">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-bold tracking-tight text-white/90">고해상도 에셋 무제한 다운로드</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 우측 폼 영역 (42%) */}
      <div className="flex-1 lg:w-[42%] flex flex-col justify-center items-center px-6 sm:px-12 relative bg-white">
        <Link href="/login" className="absolute top-10 left-10 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-primary/40 hover:text-primary hover:bg-white hover:border-primary/20 transition-all shadow-sm group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        </Link>

        <div className="w-full max-w-[360px] space-y-10 animate-in fade-in slide-in-from-right-8 duration-1000">
          <div className="flex flex-col items-center text-center space-y-3 animate-in fade-in duration-1000 ease-in-out">
            <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center mb-1 border border-primary/10 shadow-sm">
               <ChefHat className="w-6 h-6 text-primary drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">계정 만들기</h1>
            <p className="text-slate-400 text-sm font-medium">정보를 입력하고 특별한 혜택을 누리세요.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit(onSignUp)}>
            <div className="space-y-4">
              <div className="space-y-1.5 relative px-1">
                <label className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] ml-1">이름</label>
                <div className="relative">
                   <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within/input:text-primary transition-colors" />
                  <Input {...register("name")} className={cn("pl-11 bg-white border-slate-200 h-12 rounded-lg text-[13px] focus-visible:ring-primary focus-visible:bg-white transition-all shadow-sm hover:border-slate-300", errors.name && "border-red-400 ring-red-400")} placeholder="홍길동" />
                </div>
                {errors.name && <p className="text-[10px] text-red-500 font-bold ml-1.5 mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5 relative px-1">
                <label className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] ml-1">이메일</label>
                <div className="relative">
                   <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40 group-focus-within/input:text-primary transition-colors" />
                  <Input {...register("email")} className={cn("pl-11 bg-white border-slate-200 h-12 rounded-lg text-[13px] focus-visible:ring-primary focus-visible:bg-white transition-all shadow-sm hover:border-slate-300", errors.email && "border-red-400 ring-red-400")} placeholder="example@email.com" />
                </div>
                {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1.5 mt-1">{errors.email.message}</p>}
              </div>

              <div className="flex gap-4">
                <div className="space-y-1.5 relative flex-1">
                  <label className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] ml-1">비밀번호</label>
                  <Input type="password" {...register("password")} className={cn("bg-white border-slate-200 h-12 rounded-lg text-[13px] focus-visible:ring-primary focus-visible:bg-white transition-all shadow-sm px-5 hover:border-slate-300", errors.password && "border-red-400 ring-red-400")} placeholder="••••••••" />
                </div>
                <div className="space-y-1.5 relative flex-1">
                  <label className="text-[10px] font-bold text-primary/60 uppercase tracking-[0.2em] ml-1">비밀번호 확인</label>
                  <Input type="password" {...register("confirmPassword")} className={cn("bg-white border-slate-200 h-12 rounded-lg text-[13px] focus-visible:ring-primary focus-visible:bg-white transition-all shadow-sm px-5 hover:border-slate-300", errors.confirmPassword && "border-red-400 ring-red-400")} placeholder="••••••••" />
                </div>
              </div>
              {(errors.password || errors.confirmPassword) && (
                <p className="text-[10px] text-red-500 font-bold ml-1.5 mt-1">{errors.password?.message || errors.confirmPassword?.message}</p>
              )}
            </div>

            <div className="pt-2 space-y-4">
              <Button disabled={loading} type="submit" className="w-full h-12 rounded-lg font-bold text-[14px] text-white bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all overflow-hidden relative group">
                <span className="relative z-10 flex items-center justify-center gap-2">
                   {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "회원가입"}
                </span>
                {!loading && (
                   <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
                )}
              </Button>
              <p className="text-center text-[10px] text-slate-400 font-medium px-4 leading-relaxed">
                가입 시 AdGen.ai의 <span className="text-primary font-bold underline cursor-pointer">이용약관</span> 및 <span className="text-primary font-bold underline cursor-pointer">개인정보처리방침</span>에 동의하게 됩니다.
              </p>
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
