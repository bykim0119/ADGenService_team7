"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Image as ImageIcon,
  Loader2,
  RefreshCcw,
  Sparkles,
  Download,
  ChevronDown,
  Copy,
  Plus,
  Minus,
} from "lucide-react";
import { Canvas, Textbox, FabricImage, Shadow, filters } from "fabric";
import { useForm } from "react-hook-form";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 (인스타 피드)', ratio: 1 / 1, class: 'aspect-square' },
  { id: '9:16', name: '9:16 (스토리/릴스)', ratio: 9 / 16, class: 'aspect-[9/16]' },
  { id: '16:9', name: '16:9 (와이드 광고)', ratio: 16 / 9, class: 'aspect-video' },
  { id: '21:9', name: '21:9 (시네마틱)', ratio: 21 / 9, class: 'aspect-[21/9]' }
];

const INITIAL_PREVIEW_IMG = "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=1080&h=1080";

const CATEGORIES = [
  { id: 'food', label: '음식/외식' },
  { id: 'it', label: 'IT/앱' },
  { id: 'fashion', label: '패션/의류' },
  { id: 'beauty', label: '뷰티/화장품' },
  { id: 'other', label: '기타' },
];

const THEMES = [
  { id: 'cartoon', label: '카툰' },
  { id: 'realistic', label: '실사' },
  { id: 'minimal', label: '미니멀' },
];

const TAG_POOL = ["#브랜드광고", "#신제품출시", "#여름시즌", "#트렌드", "#감성마케팅", "#SNS광고", "#디지털마케팅", "#특별이벤트", "#프리미엄", "#한정판", "#오늘의추천", "#AI광고", "#비주얼마케팅"];

const LUXURY_PALETTE = [
  { name: '퓨어 화이트', color: '#FFFFFF' },
  { name: '딥 블랙', color: '#121212' },
  { name: '로즈 레드', color: '#BE123C' },
  { name: '번트 오렌지', color: '#C2410C' },
  { name: '앰버 골드', color: '#B45309' },
  { name: '포레스트 그린', color: '#065F46' },
  { name: '로얄 블루', color: '#1E40AF' },
  { name: '딥 인디고', color: '#3730A3' },
  { name: '다크 바이올렛', color: '#6B21A8' },
  { name: '소프트 베이지', color: '#D6D3D1' }
];

export default function EditorPage() {
  const router = useRouter();
  const { } = useForm({ defaultValues: { menuName: "" } });

  const [aiCopies, setAiCopies] = useState<string[]>([]);
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [platformTexts, setPlatformTexts] = useState<Record<number, any>>({});
  const [previewImage, setPreviewImage] = useState(INITIAL_PREVIEW_IMG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isCooking, setIsCooking] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [recommendedTags, setRecommendedTags] = useState<string[]>([]);
  const [activeRatioIdx, setActiveRatioIdx] = useState(0);
  const [restaurantName, setRestaurantName] = useState("");

  const [categoryKey, setCategoryKey] = useState('food');
  const [themeKey, setThemeKey] = useState('realistic');
  const [adUserInput, setAdUserInput] = useState('');
  const [ipAdapterWeight, setIpAdapterWeight] = useState(0.7);
  const [hasProductImage, setHasProductImage] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [adHistory, setAdHistory] = useState<Array<{user_input: string; copy: string; message: string}>>([]);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const fabricCanvasElRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adProductFileRef = useRef<File | null>(null);
  const activeRatioIdxRef = useRef(0);

  useEffect(() => { activeRatioIdxRef.current = activeRatioIdx; }, [activeRatioIdx]);

  const syncCanvasToState = () => {
    const canvas = canvasRef.current;
    if (!canvas || (canvas as any)._isUpdatingInternally) return;

    const objects = canvas.getObjects();
    const phraseObj = objects.find(o => (o as any).data?.id === 'phrase') as any;
    const brandObj = objects.find(o => (o as any).data?.id === 'brand') as any;
    const hashObj = objects.find(o => (o as any).data?.id === 'hash') as any;

    if (!phraseObj && !brandObj && !hashObj) return;

    setPlatformTexts(prev => {
      const currentIdx = activeRatioIdxRef.current;
      const current = prev[currentIdx] || {};
      const updates: any = {};
      if (phraseObj) updates.text = phraseObj.text;
      if (brandObj) updates.brand = brandObj.text;
      if (hashObj) updates.hashtags = hashObj.text;
      if (brandObj) updates.fontSize = brandObj.fontSize;

      if (
        current.text === updates.text &&
        current.brand === updates.brand &&
        current.hashtags === updates.hashtags &&
        current.fontSize === updates.fontSize
      ) return prev;

      return { ...prev, [currentIdx]: { ...(prev[currentIdx] || {}), ...updates, textAlign: 'center', isManualEdit: true } };
    });
  };

  const handleRatioChange = (idx: number) => {
    syncCanvasToState();
    setActiveRatioIdx(idx);
  };

  const handleRefreshTags = async () => {
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: adUserInput || "광고", category_key: categoryKey }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tags && data.tags.length > 0) {
          setRecommendedTags(data.tags);
          return;
        }
      }
    } catch {}
    const shuffled = [...TAG_POOL].sort(() => 0.5 - Math.random());
    setRecommendedTags(shuffled.slice(0, 6));
  };

  const updateCanvasBackground = async (overrideData?: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (canvas as any)._isUpdatingInternally = true;

    const imgUrl = generatedImage || previewImage;
    const ratio = ASPECT_RATIOS[activeRatioIdx];
    const containerWidth = 460;
    let targetHeight = containerWidth;
    if (ratio.id === '9:16') targetHeight = containerWidth * (16 / 9);
    if (ratio.id === '16:9') targetHeight = containerWidth * (9 / 16);
    if (ratio.id === '21:9') targetHeight = containerWidth * (9 / 21);

    const needsBgUpdate = !canvas.backgroundImage ||
      (canvas.backgroundImage as FabricImage).getSrc() !== imgUrl ||
      canvas.width !== containerWidth ||
      canvas.height !== targetHeight;

    if (needsBgUpdate) {
      const img = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' });
      canvas.setDimensions({ width: containerWidth, height: targetHeight });
      const scale = Math.max(containerWidth / img.width!, targetHeight / img.height!);
      img.set({
        scaleX: scale, scaleY: scale,
        left: containerWidth / 2, top: targetHeight / 2,
        originX: 'center', originY: 'center',
        selectable: false, evented: false
      });
      img.filters = [];
      canvas.backgroundImage = img;
      canvas.requestRenderAll();
    }

    canvas.getObjects().forEach(obj => { if ((obj as any).data?.isTextLayer) canvas.remove(obj); });

    const stylingDefaults = {
      fontFamily: 'Jua', fill: '#FFFFFF', stroke: '#1A1A1A', strokeWidth: 5,
      paintFirst: 'stroke' as const, textAlign: 'center' as const, originX: 'center' as const, left: containerWidth / 2,
    };
    const canvasState = platformTexts[activeRatioIdx] || {};
    const currentData = {
      ...stylingDefaults, text: canvasState.text || "", brand: canvasState.brand || "",
      hashtags: canvasState.hashtags || "",
      fontSize: canvasState.fontSize || (ASPECT_RATIOS[activeRatioIdx].id === '9:16' ? 42 : 36),
      ...canvasState, ...(overrideData || {})
    };

    const modernControlProps = {
      borderColor: '#FFFFFF', cornerColor: '#FFFFFF', cornerSize: 8,
      transparentCorners: false, padding: 10, hasRotatingPoint: false,
      selectable: true, evented: true, data: { isTextLayer: true }
    };

    const baseFontSize = currentData.fontSize || 36;
    const shadowEffect = new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 2, offsetY: 2 });
    const rawFont = currentData.fontFamily || 'Jua';
    const fontToUse = (typeof rawFont === 'string' && rawFont.includes(' ') && !rawFont.includes("'")) ? `'${rawFont}'` : rawFont;

    try { await document.fonts.load(`1em ${fontToUse}`); } catch (e) { console.warn("Font load failed:", fontToUse); }

    const commonStyles = {
      fontFamily: fontToUse || 'sans-serif', fill: currentData.fill || '#FFFFFF',
      stroke: currentData.stroke || '#1A1A1A', strokeWidth: 4, paintFirst: 'stroke' as const,
      textAlign: 'center' as const, originX: 'center' as const, originY: 'bottom' as const,
      left: 230, lineHeight: 1.3, shadow: shadowEffect, objectCaching: false, centeredScaling: true
    };

    const bottomBase = targetHeight * 0.92;
    const hashTop = bottomBase;
    const brandTop = hashTop - (baseFontSize * 0.8);
    const phraseTop = brandTop - (baseFontSize * 1.5);

    const textLayers: any[] = [];
    if (currentData.text) textLayers.push(new Textbox(currentData.text.trim(), { ...commonStyles, ...modernControlProps, data: { ...modernControlProps.data, id: 'phrase' }, top: phraseTop, fontSize: baseFontSize * 0.5, width: 440, textAlign: 'center' }));
    if (currentData.brand) textLayers.push(new Textbox(currentData.brand.trim(), { ...commonStyles, ...modernControlProps, data: { ...modernControlProps.data, id: 'brand' }, top: brandTop, fontSize: baseFontSize, fontWeight: 'bold', strokeWidth: 6, width: 440, textAlign: 'center' }));
    if (currentData.hashtags) textLayers.push(new Textbox(currentData.hashtags.trim(), { ...commonStyles, ...modernControlProps, data: { ...modernControlProps.data, id: 'hash' }, top: hashTop, fontSize: baseFontSize * 0.45, width: 440, textAlign: 'center' }));

    textLayers.forEach(obj => {
      canvas.add(obj);
      obj.set({ textAlign: 'center', originX: 'center', left: 230 });
      if (obj instanceof Textbox) obj.set({ width: 440 });
      (canvas as any).centerObjectH(obj);
      obj.setCoords();
    });

    canvas.requestRenderAll();
    setTimeout(() => {
      canvas.getObjects().forEach(obj => {
        if ((obj as any).data?.isTextLayer) {
          obj.set({ textAlign: 'center', originX: 'center', left: 230 });
          if (obj instanceof Textbox) obj.set({ width: 440 });
          (canvas as any).centerObjectH(obj);
          obj.setCoords();
        }
      });
      canvas.requestRenderAll();
    }, 150);
    (canvas as any)._isUpdatingInternally = false;
  };

  const addTextToCanvas = (combinedText: string) => {
    const hashtagRegex = /#[^\s#]+/g;
    const hashes = (combinedText.match(hashtagRegex) || []).join(' ');
    const mainTextOnly = combinedText.replace(hashtagRegex, '').replace(/[\[\]【】]/g, '').trim();
    setPlatformTexts(prev => ({
      ...prev,
      [activeRatioIdx]: { ...(prev[activeRatioIdx] || {}), text: mainTextOnly, brand: restaurantName, hashtags: hashes, isManualEdit: true }
    }));
  };

  const updateSelectedTextStyle = (props: any, relative = false) => {
    syncCanvasToState();
    setPlatformTexts(prev => {
      const current = prev[activeRatioIdx] || {};
      const nextFontSize = relative && props.fontSize ? (current.fontSize || 40) + props.fontSize : (props.fontSize || current.fontSize);
      return { ...prev, [activeRatioIdx]: { ...current, ...props, fontSize: nextFontSize, textAlign: 'center', isManualEdit: true } };
    });
  };

  const handleGenerateCopy = async () => {
    if (!adUserInput.trim()) { toast.error("광고 설명을 입력해주세요."); return; }
    setIsGeneratingCopy(true);
    try {
      const res = await fetch("/api/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: adUserInput, category_key: categoryKey, history: adHistory })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "문구 생성 실패");
      const copies = Array.isArray(data.copies) ? data.copies : [data.copy || ""];
      setAiCopies(copies);
      setAdHistory(prev => [...prev, { user_input: adUserInput, copy: copies[0] || "", message: data.message || "" }]);
      toast.success("AI 추천 문구가 생성되었습니다.");
    } catch (e) {
      console.error("Copy Error:", e);
      setAiCopies([
        `✨ 최고의 순간을 완성하는 ${adUserInput}\n#브랜드광고 #프리미엄 #감성마케팅`,
        `🚀 지금 바로 경험하세요, [${adUserInput}]\n#신제품 #트렌드 #SNS광고`,
      ]);
      toast.success("AI 추천 문구가 생성되었습니다.");
    } finally { setIsGeneratingCopy(false); }
  };

  const pollJobResult = (jobId: string, onDone: (result: Record<string, any>) => void) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setGenProgress(0);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();
        if (typeof data.progress === "number") setGenProgress(data.progress);
        if (data.status === "done" && data.image) {
          clearInterval(pollingRef.current!);
          setGenProgress(100);
          onDone(data);
        } else if (data.status === "failed_input") {
          clearInterval(pollingRef.current!);
          toast.error("입력 이미지를 확인해주세요: " + (data.detail || "이미지 형식이 올바르지 않습니다"));
          setIsCooking(false);
        } else if (data.status === "failed_system") {
          clearInterval(pollingRef.current!);
          toast.error("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
          setIsCooking(false);
        } else if (data.status === "error") {
          clearInterval(pollingRef.current!);
          toast.error("이미지 생성 실패: " + (data.detail || "알 수 없는 오류"));
          setIsCooking(false);
        }
      } catch {
        clearInterval(pollingRef.current!);
        toast.error("상태 확인 중 오류 발생");
        setIsCooking(false);
      }
    }, 2000);
  };

  const handleGenerateAd = async () => {
    if (!adUserInput.trim()) { toast.error("광고 설명을 입력해주세요."); return; }
    setIsCooking(true);
    try {
      const formData = new FormData();
      formData.append("user_input", adUserInput);
      formData.append("category_key", categoryKey);
      formData.append("theme_key", themeKey);
      formData.append("history", JSON.stringify(adHistory));
      if (adProductFileRef.current) {
        formData.append("product_image", adProductFileRef.current);
        formData.append("ip_adapter_weight", String(ipAdapterWeight));
      }

      const response = await fetch("/api/generate", { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok || !data.job_id) {
        toast.error(data.detail || data.error || "광고 생성 요청 실패");
        setIsCooking(false);
        return;
      }

      const currentInput = adUserInput;
      toast.info("AI 이미지 생성 중... 약 30~60초 소요됩니다.");
      pollJobResult(data.job_id, (result) => {
        setGeneratedImage(`data:image/png;base64,${result.image}`);
        if (result.copy) {
          setAiCopies([result.copy]);
          addTextToCanvas(result.copy);
          setAdHistory(prev => [...prev, { user_input: currentInput, copy: result.copy, message: "" }]);
        }
        toast.success("AI 이미지 생성 완료!");
        setIsCooking(false);
      });
    } catch (e) {
      console.error("Ad Generate Error:", e);
      toast.error("이미지 서버 통신 실패");
      setIsCooking(false);
    }
  };

  const handleFinalExport = async () => {
    if (!canvasRef.current || !generatedImage) return;
    syncCanvasToState();
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: campaign } = await supabase.from('campaigns').insert({
        user_id: user.id,
        menu_name: adUserInput || "광고",
        category_key: categoryKey,
        selected_copy: aiCopies[0] || "",
        feature_type: 'ad_generate',
      }).select().single();

      if (campaign) {
        for (let i = 0; i < ASPECT_RATIOS.length; i++) {
          const ratio = ASPECT_RATIOS[i];
          await new Promise<void>((resolve) => {
            setActiveRatioIdx(i);
            setTimeout(async () => {
              const url = canvasRef.current!.toDataURL({ format: 'png', quality: 0.9, multiplier: 2 });
              await supabase.from('assets').insert({
                user_id: user.id,
                campaign_id: campaign.id,
                generated_image_url: url,
                platform: ratio.name,
                ad_copy: aiCopies[0] || "",
              });
              resolve();
            }, 300);
          });
        }
        toast.success("모든 사이즈의 광고가 에셋 라이브러리에 저장되었습니다.");
        router.push("/assets");
      }
    } catch (e) {
      console.error(e);
      toast.error("저장 중 에러가 발생했습니다.");
    } finally { setIsExporting(false); }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setRestaurantName(user.user_metadata?.restaurant_name || "");
      handleRefreshTags();
      setIsLoadingUser(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!isLoadingUser && fabricCanvasElRef.current && !canvasRef.current) {
      const fc = new Canvas(fabricCanvasElRef.current, { width: 460, height: 460, backgroundColor: '#ffffff', preserveObjectStacking: true });
      canvasRef.current = fc;
      fc.on('object:modified', syncCanvasToState);
      fc.on('selection:created', syncCanvasToState);
      fc.on('selection:updated', syncCanvasToState);
      const loadFonts = async () => {
        try {
          await Promise.all([
            document.fonts.load('1em "Jua"'), document.fonts.load('1em "Black Han Sans"'),
            document.fonts.load('1em "Hahmlet"'), document.fonts.load('1em "Do Hyeon"')
          ]);
          updateCanvasBackground();
        } catch { updateCanvasBackground(); }
      };
      loadFonts();
    }
  }, [isLoadingUser]);

  useEffect(() => {
    if (canvasRef.current && !isLoadingUser) updateCanvasBackground();
  }, [activeRatioIdx, generatedImage, previewImage, platformTexts]);

  if (isLoadingUser) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center py-10 px-6 font-sans text-slate-900 animate-in fade-in duration-700 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[60%] bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[50%] bg-blue-50/30 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[1700px] flex flex-col gap-4 mb-10 px-4 animate-in fade-in slide-in-from-top-8 duration-1000 ease-out relative z-10">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AI 이미지 생성</h1>
      </div>

      <div className="w-full max-w-[1700px] grid grid-cols-12 gap-8 px-4 pb-12">
        {/* 좌측 설정 패널 */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-6">
          <Card onClick={() => fileInputRef.current?.click()} className="p-6 border-slate-100 shadow-sm rounded-2xl bg-white border-dashed border-2 hover:border-primary/30 transition-all relative overflow-hidden group cursor-pointer active:scale-[0.98]">
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                adProductFileRef.current = file;
                setHasProductImage(true);
                const r = new FileReader();
                r.onload = (ev) => { setPreviewImage(ev.target?.result as string); setGeneratedImage(null); };
                r.readAsDataURL(file);
              }
            }} />
            <div className="flex flex-col items-center justify-center py-5 gap-2 pointer-events-none">
              <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary/40 group-hover:text-primary duration-500 shadow-inner"><UploadCloud className="w-6 h-6" /></div>
              <p className="text-[14px] text-slate-700 font-bold">제품 이미지 올리기 (선택)</p>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-none shadow-sm bg-white/70 backdrop-blur-sm">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4 text-primary/60">광고 정보</h2>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] ml-1">업종</label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c) => (
                    <button key={c.id} onClick={() => setCategoryKey(c.id)} className={cn("py-2 px-3 rounded-lg text-[11px] font-bold border transition-all", categoryKey === c.id ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-100 hover:border-primary/30")}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] ml-1">테마</label>
                <div className="flex gap-2">
                  {THEMES.map((t) => (
                    <button key={t.id} onClick={() => setThemeKey(t.id)} className={cn("flex-1 py-2 rounded-lg text-[11px] font-bold border transition-all", themeKey === t.id ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-100 hover:border-primary/30")}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em] ml-1">광고 설명</label>
                <Textarea value={adUserInput} onChange={(e) => setAdUserInput(e.target.value)} placeholder="예: 여름 시즌 신제품, 청량하고 시원한 느낌" className="bg-white border-slate-200 min-h-[90px] rounded-lg text-[13px] font-medium" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl border-none shadow-sm bg-white/70 backdrop-blur-sm">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4 text-primary/60">생성</h2>
            <p className="text-[11px] text-slate-400 mb-4">제품 이미지를 업로드하면 IP-Adapter로 스타일이 반영됩니다.</p>
            {hasProductImage && (
              <div className="mb-4 space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-primary/40 uppercase tracking-[0.2em]">이미지 반영 강도</label>
                  <span className="text-[11px] font-bold text-primary">{ipAdapterWeight.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={ipAdapterWeight}
                  onChange={(e) => setIpAdapterWeight(parseFloat(e.target.value))}
                  className="w-full h-1.5 accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-300 font-bold mt-0.5">
                  <span>프롬프트 위주</span>
                  <span>이미지 위주</span>
                </div>
              </div>
            )}
            <Button onClick={handleGenerateCopy} disabled={isGeneratingCopy} className="w-full h-11 mb-3 rounded-lg bg-slate-900 text-white font-bold text-[13px] shadow-lg shadow-black/10 hover:bg-slate-800 active:scale-[0.98] transition-all overflow-hidden relative group">
              <span className="relative z-10 flex items-center justify-center gap-2">{isGeneratingCopy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} 광고 문구 생성</span>
            </Button>
            <Button onClick={handleGenerateAd} disabled={isCooking} className="w-full h-11 rounded-lg bg-primary text-white font-bold text-[13px] shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-[0.98] transition-all overflow-hidden relative group border-0">
              <span className="relative z-10 flex items-center justify-center gap-2">{isCooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} 광고 이미지 생성</span>
            </Button>
          </Card>
        </aside>

        {/* 중앙 캔버스 */}
        <main className="col-span-12 xl:col-span-6 flex flex-col gap-8">
          <div className="flex flex-col gap-6 w-full">
            <div className="flex items-center justify-between px-3">
              <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">실시간 미리보기</h3>
              <div className="bg-white p-1 rounded-full shadow-sm flex gap-1 border border-slate-100">
                {ASPECT_RATIOS.map((r, i) => (
                  <button key={r.id} onClick={() => handleRatioChange(i)} className={cn("px-4 py-1.5 text-[11px] font-bold rounded-full transition-all", activeRatioIdx === i ? "bg-slate-100 text-primary border border-slate-200/50 scale-105 shadow-sm" : "text-slate-400 hover:bg-slate-50")}>{r.id}</button>
                ))}
              </div>
            </div>
            <div className="flex justify-center w-full">
              <div className={cn("bg-white rounded-[40px] shadow-2xl overflow-hidden border-8 border-white relative transition-all duration-300", ASPECT_RATIOS[activeRatioIdx].class)} style={{ width: '100%', maxWidth: '460px' }}>
                <div className="w-full h-full flex items-center justify-center overflow-hidden bg-slate-50"><canvas ref={fabricCanvasElRef} /></div>
                {isCooking && (
                  <div className="absolute inset-0 z-[100] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500 p-10 text-center gap-5 rounded-[32px]">
                    <div className="w-20 h-20 bg-primary/5 rounded-[32px] flex items-center justify-center text-primary shadow-inner border border-primary/5">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                    <div className="flex flex-col items-center gap-2 w-full max-w-[200px]">
                      <div className="flex justify-between w-full">
                        <p className="text-[11px] font-bold text-primary/60 tracking-widest uppercase">
                          {genProgress < 5 ? "준비 중" : genProgress < 15 ? "모델 로딩" : genProgress < 91 ? "이미지 생성" : "후처리 중"}
                        </p>
                        <p className="text-[11px] font-bold text-primary">{genProgress}%</p>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${genProgress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-slate-400 text-[11px] font-bold tracking-tight bg-slate-50 px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                      {genProgress < 15 ? "모델과 설정을 불러오는 중입니다" : genProgress < 91 ? `샘플링 진행 중... (${genProgress}%)` : "이미지를 마무리하는 중입니다"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Card className="p-7 rounded-[32px] border-none shadow-sm bg-white flex flex-col gap-8 font-bold relative overflow-hidden">
            <div className="flex flex-col gap-5 z-10">
              <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary/60 leading-none">글자 스타일</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 h-11">
                  <Button variant="ghost" size="icon" className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-primary active:scale-[0.85] transition-all" onClick={() => updateSelectedTextStyle({ fontSize: -2 }, true)}><Minus className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 hover:text-primary active:scale-[0.85] transition-all" onClick={() => updateSelectedTextStyle({ fontSize: 2 }, true)}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="relative flex-1 max-w-[280px]">
                  <select value={platformTexts[activeRatioIdx]?.fontFamily || "Jua"} className="appearance-none bg-slate-50 border border-slate-100 h-11 text-[13px] font-bold px-5 pr-12 rounded-2xl outline-none w-full cursor-pointer" onChange={(e) => updateSelectedTextStyle({ fontFamily: e.target.value })}>
                    <option value="Jua">주아체 (Trend)</option>
                    <option value="Black Han Sans">블랙 한산스</option>
                    <option value="Hahmlet">함렛 (Elite)</option>
                    <option value="Do Hyeon">도현체</option>
                    <option value="Nanum Myeongjo">나눔명조</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-10 z-10">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1"><div className="w-1 h-3 bg-primary/20 rounded-full" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">메인 색상</span></div>
                <div className="flex flex-wrap gap-2.5">{LUXURY_PALETTE.map(p => (<button key={p.color} onClick={() => updateSelectedTextStyle({ fill: p.color })} className={cn("w-8 h-8 rounded-full border shadow-sm hover:scale-110 active:scale-95 transition-all", p.color === '#FFFFFF' ? "border-slate-200" : "border-slate-50/10")} style={{ backgroundColor: p.color }} title={p.name} />))}</div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1"><div className="w-1 h-3 bg-primary/20 rounded-full" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">테두리 색상</span></div>
                <div className="flex flex-wrap gap-2.5">{LUXURY_PALETTE.map(p => (<button key={'s' + p.color} onClick={() => updateSelectedTextStyle({ stroke: p.color, strokeWidth: 8 })} className={cn("w-8 h-8 rounded-full border-2 shadow-sm hover:scale-110 active:scale-95 transition-all", p.color === '#FFFFFF' ? "border-slate-200" : "border-slate-50/10")} style={{ borderColor: p.color, backgroundColor: 'transparent' }} title={p.name} />))}</div>
              </div>
            </div>
          </Card>
        </main>

        {/* 우측 카피 패널 */}
        <aside className="col-span-12 xl:col-span-3">
          <Card className="p-6 rounded-2xl border-none shadow-sm bg-white flex flex-col relative overflow-hidden font-bold">
            <h2 className="text-[11px] font-bold tracking-[0.2em] uppercase mb-4 text-primary/60 pt-1">AI 대화 히스토리</h2>

            {adHistory.length > 0 && (
              <div className="flex flex-col gap-3 mb-5 max-h-[200px] overflow-y-auto pr-1">
                {adHistory.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold text-primary/50 uppercase tracking-widest">요청 {i + 1}</span>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{item.user_input}</p>
                    {item.message && (
                      <div className="mt-1 pt-1.5 border-t border-slate-100/70">
                        <p className="text-[10px] text-primary/60 font-normal leading-relaxed">{item.message}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-5 overflow-y-auto max-h-[600px] pr-1 z-10">
              {aiCopies.map((c, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100/50 hover:border-primary/10 transition-all flex flex-col gap-4">
                  <Textarea
                    value={c}
                    onChange={(e) => { const n = [...aiCopies]; n[i] = e.target.value; setAiCopies(n); }}
                    className="bg-transparent border-none p-0 focus-visible:ring-0 text-[12px] text-slate-600 leading-relaxed font-sans min-h-[80px] resize-none"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="outline" onClick={() => addTextToCanvas(c)} className="flex-1 h-10 rounded-lg border-slate-200 text-slate-600 text-[11px] font-bold hover:bg-slate-50 hover:text-primary active:scale-[0.98] transition-all">이미지에 적용</Button>
                    <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(c); toast.success("카피 복사 완료."); }} className="w-10 h-10 rounded-lg border-slate-200 text-slate-400 hover:text-primary active:scale-[0.98] transition-all"><Copy className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-6 mt-6 pt-6 border-t border-slate-50 z-10">
              <div className="flex items-center justify-between font-sans">
                <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">추천 태그</h2>
                <Button variant="ghost" size="icon" onClick={handleRefreshTags} className="w-8 h-8 text-slate-300 hover:text-primary"><RefreshCcw className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recommendedTags.map(t => (
                  <Badge key={t} variant="outline" onClick={() => {
                    syncCanvasToState();
                    const cur = platformTexts[activeRatioIdx]?.hashtags || "";
                    const next = cur.includes(t) ? cur : (cur + " " + t).trim();
                    setPlatformTexts(prev => ({ ...prev, [activeRatioIdx]: { ...(prev[activeRatioIdx] || {}), hashtags: next, isManualEdit: true } }));
                  }} className="text-[10px] py-1 border-slate-100 text-slate-400 font-bold hover:bg-slate-50 cursor-pointer">{t}</Badge>
                ))}
              </div>
              <Button onClick={handleFinalExport} disabled={isExporting || !generatedImage} className="w-full h-11 mt-6 rounded-lg bg-primary text-white font-bold text-[13px] shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all relative overflow-hidden group">
                <span className="relative z-10 flex items-center justify-center gap-2">{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 광고 저장하기</span>
                <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
