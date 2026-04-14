"use client";

import React, { useEffect, useState } from "react";
import { User, Store, Mail, Lock, Shield, CreditCard, LogOut, Loader2, Save, Camera, Bell, CheckCircle2, MapPin, ChefHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    restaurantName: "",
    location: "",
    role: ""
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const metadata = user.user_metadata || {};
        setProfile({
          name: metadata.full_name || user.email?.split('@')[0] || "",
          email: user.email || "",
          restaurantName: metadata.restaurant_name || "",
          location: metadata.location || "",
          role: metadata.role || ""
        });
        if (metadata.avatar_url) {
          setAvatar(metadata.avatar_url);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target?.result as string);
        toast.info("새 프로필 사진이 임시 적용되었습니다. (업로드 기능 준비 중)");
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user: updatedUser }, error } = await supabase.auth.updateUser({
        data: { 
          full_name: profile.name,
          restaurant_name: profile.restaurantName,
          role: profile.role,
          location: profile.location,
          avatar_url: avatar
        }
      });

      if (error) throw error;
      
      if (updatedUser) {
        setUser(updatedUser);
      }
      
      toast.success("프로필 설정이 성공적으로 저장되었습니다.");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`저장 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("로그아웃 중 오류가 발생했습니다.");
    else window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] gap-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center justify-center text-primary animate-pulse shadow-xl shadow-primary/5">
           <ChefHat className="w-10 h-10" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <p className="text-[13px] font-bold text-primary/60 tracking-widest uppercase">데이터 로딩 중...</p>
        </div>
        <p className="text-on-surface/40 text-[11px] font-bold tracking-tight bg-surface-container-lowest px-4 py-1.5 rounded-full border border-surface-container-highest/60 shadow-sm">AI가 설정 정보를 가져오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-12 mb-2 max-w-[1600px] mx-auto w-full flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-2 duration-700">





      <div 
        className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-8 slide-in-from-left-8 duration-1000 ease-out"
        style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
      >
        <h1 className="text-xl md:text-2xl font-bold text-on-surface tracking-tight">설정</h1>

        <p className="text-[14px] font-medium text-on-surface/60">계정 및 브랜드 아이덴티티를 최신으로 유지하세요.</p>
      </div>

      <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8">

        {/* Section: Profile Info */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-surface-container-highest/40">
               <User className="w-4 h-4 text-on-surface/40" />
            </div>
            <h3 className="text-[11px] font-bold text-on-surface/40 tracking-[0.2em] uppercase">개인 프로필 정보</h3>
          </div>
          
          <Card className="p-0 border-slate-100 overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] rounded-2xl">
            <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer" onClick={triggerFileInput}>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-xl ring-1 ring-slate-100 overflow-hidden transition-transform group-hover:scale-105">
                    {avatar ? (
                      <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold">{profile.name[0]?.toUpperCase() || "C"}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-xl border-4 border-white flex items-center justify-center shadow-lg text-white transition-opacity group-hover:scale-110">
                    <Camera className="w-3 h-3" />
                  </div>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-lg font-bold text-slate-800 tracking-tight">{profile.name}</h4>
                  <div className="flex items-center gap-2">
                  </div>
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
              <Button 
                variant="outline" 
                className="rounded-lg h-11 px-5 text-[12px] font-bold border-primary/5 bg-slate-50/50 hover:bg-primary/5 hover:border-primary/10 shadow-sm transition-all active:scale-[0.98] text-slate-600"
                onClick={triggerFileInput}
              >
                이미지 업데이트
              </Button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">이름</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="pl-11 h-12 bg-white border-slate-200 rounded-lg text-[13px] focus-visible:ring-primary/10 transition-all font-medium shadow-sm hover:border-slate-300" />
                  </div>
                </div>
                <div className="space-y-2 opacity-70">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">이메일 주소</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input disabled value={profile.email} className="pl-11 h-12 bg-slate-50/50 border-slate-200 rounded-lg text-[13px] font-medium opacity-60 shadow-none cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Section: Brand & Restaurant */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
               <Store className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase">브랜드 아이덴티티</h3>
          </div>
          
          <Card className="p-8 border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] rounded-2xl space-y-7 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">브랜드/상호명</label>
                <Input value={profile.restaurantName} onChange={e => setProfile({...profile, restaurantName: e.target.value})} className="h-12 bg-white border-slate-200 rounded-lg text-[13px] focus-visible:ring-primary/10 transition-all font-medium shadow-sm hover:border-slate-300" placeholder="예: My Brand Studio" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">직함</label>
                <Input value={profile.role} onChange={e => setProfile({...profile, role: e.target.value})} className="h-12 bg-white border-slate-200 rounded-lg text-[13px] focus-visible:ring-primary/10 transition-all font-medium shadow-sm hover:border-slate-300" placeholder="예: 마케터 / 대표" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">레스토랑 위치</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                <Input value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} className="pl-11 h-12 bg-white border-slate-200 rounded-lg text-[13px] focus-visible:ring-primary/10 transition-all font-medium shadow-sm hover:border-slate-300" placeholder="예: Seoul, Gangnam" />
              </div>
            </div>
          </Card>
        </section>

        {/* Actions Container */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 pb-4">

          <Button 
             variant="outline" 
             className="w-full sm:w-auto border-primary/5 bg-slate-50/50 text-slate-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all rounded-lg h-12 px-8 font-bold text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] shadow-sm"
             onClick={handleLogout}
           >
             <LogOut className="w-4 h-4" />
             로그아웃
           </Button>

           <Button 
             onClick={handleSave} 
             disabled={saving}
             className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-lg h-12 px-12 font-bold text-[14px] shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border-0 relative overflow-hidden group"
           >
             <span className="relative z-10 flex items-center justify-center gap-2">
               {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
               설정 저장하기
             </span>
             {!saving && (
               <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
             )}
             {saving && (
               <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full animate-in slide-in-from-left-full duration-[800ms] ease-out" />
             )}
           </Button>
        </div>

        <div className="p-5 bg-surface-container-lowest rounded-2xl border border-dashed border-surface-container-highest/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Shield className="w-4 h-4 text-on-surface/20" />
             <p className="text-[11px] text-on-surface/40 leading-relaxed font-bold uppercase tracking-wider">계정 데이터 보호 정책</p>
          </div>
          <p className="text-[11px] text-on-surface/20 font-medium">데이터 보호 정책 준수 중</p>
        </div>
      </div>
    </div>
  );
}
