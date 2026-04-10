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
  Megaphone,
  ChefHat,
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
  { id: '1:1', name: '인스타 피드', ratio: 1 / 1, class: 'aspect-square' },
  { id: '9:16', name: '인스타 스토리', ratio: 9 / 16, class: 'aspect-[9/16]' },
  { id: '16:9', name: '유튜브 썸네일', ratio: 16 / 9, class: 'aspect-video' },
  { id: '21:9', name: '배너 광고', ratio: 21 / 9, class: 'aspect-[21/9]' }
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

/* ──────────────────────────── Section Heading Component ──────────────────────────── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold tracking-[0.05em] uppercase text-on-surface/50 mb-3">
      {children}
    </h2>
  );
}

/* ──────────────────────────── Label Component ──────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-bold text-on-surface/80 tracking-tight block mb-1.5">
      {children}
    </label>
  );
}

/* ──────────────────────────── Unified Button Component ──────────────────────────── */
function UnifiedButton({ 
  children, 
  onClick, 
  disabled, 
  variant = "primary", 
  className,
  icon: Icon
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  variant?: "primary" | "outline";
  className?: string;
  icon?: any;
}) {
  if (variant === "outline") {
    return (
      <Button
        onClick={onClick}
        disabled={disabled}
        variant="outline"
        className={cn(
          "w-full h-11 rounded-lg border-surface-container-highest/70 text-on-surface/80 font-bold text-[13px] hover:bg-surface-container-high transition-all active:scale-[0.98] shadow-sm",
          className
        )}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className={cn("w-4 h-4", Icon === Loader2 && "animate-spin")} />}
          {children}
        </span>
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full h-11 rounded-lg font-bold text-[13px] text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/10 active:scale-[0.98] transition-all overflow-hidden relative group border-0",
        className
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {Icon && <Icon className={cn("w-4 h-4", Icon === Loader2 && "animate-spin")} />}
        {children}
      </span>
      <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
    </Button>
  );
}

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
  const [isRefreshingTags, setIsRefreshingTags] = useState(false);
  const [activeRatioIdx, setActiveRatioIdx] = useState(0);
  const [restaurantName, setRestaurantName] = useState("");

  const [categoryKey, setCategoryKey] = useState('food');
  const [themeKey, setThemeKey] = useState('realistic');
  const [adUserInput, setAdUserInput] = useState('');
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
      
      if (phraseObj) {
        updates.text = phraseObj.text;
        updates.phrasePos = { top: phraseObj.top, left: phraseObj.left };
      }
      if (brandObj) {
        updates.brand = brandObj.text;
        updates.fontSize = brandObj.fontSize;
        updates.brandPos = { top: brandObj.top, left: brandObj.left };
      }
      if (hashObj) {
        updates.hashtags = hashObj.text;
        updates.hashPos = { top: hashObj.top, left: hashObj.left };
      }

      return { ...prev, [currentIdx]: { ...current, ...updates, isManualEdit: true } };
    });
  };

  const handleRatioChange = (idx: number) => {
    syncCanvasToState();
    setActiveRatioIdx(idx);
  };

  const handleRefreshTags = async () => {
    setIsRefreshingTags(true);
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
    } catch (e) {
      console.error("Refresh Tags Error:", e);
    } finally {
      const shuffled = [...TAG_POOL].sort(() => 0.5 - Math.random());
      setRecommendedTags(shuffled.slice(0, 6));
      setTimeout(() => setIsRefreshingTags(false), 500);
    }
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
    if (currentData.text) {
      const pos = currentData.phrasePos || { top: phraseTop, left: 230 };
      textLayers.push(new Textbox(currentData.text.trim(), { ...commonStyles, ...modernControlProps, data: { ...modernControlProps.data, id: 'phrase' }, top: pos.top, left: pos.left, fontSize: baseFontSize * 0.5, width: 440, textAlign: 'center' }));
    }
    if (currentData.brand) {
      const pos = currentData.brandPos || { top: brandTop, left: 230 };
      textLayers.push(new Textbox(currentData.brand.trim(), { ...commonStyles, ...modernControlProps, data: { ...modernControlProps.data, id: 'brand' }, top: pos.top, left: pos.left, fontSize: baseFontSize, fontWeight: 'bold', strokeWidth: 6, width: 440, textAlign: 'center' }));
    }
    if (currentData.hashtags) {
      const pos = currentData.hashPos || { top: hashTop, left: 230 };
      textLayers.push(new Textbox(currentData.hashtags.trim(), { ...commonStyles, ...modernControlProps, data: { ...modernControlProps.data, id: 'hash' }, top: pos.top, left: pos.left, fontSize: baseFontSize * 0.45, width: 440, textAlign: 'center' }));
    }

    textLayers.forEach(obj => {
      canvas.add(obj);
      obj.setCoords();
    });

    canvas.requestRenderAll();
    setTimeout(() => {
      canvas.getObjects().forEach(obj => {
        if ((obj as any).data?.isTextLayer) {
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

    // 텍스트 길이에 따른 유동적인 폰트 사이즈 계산 (잘림 방지 및 미학적 최적화)
    let optimizedFontSize = 44;
    const textLength = mainTextOnly.length;
    if (textLength > 15) optimizedFontSize = 38;
    if (textLength > 25) optimizedFontSize = 32;
    if (textLength > 40) optimizedFontSize = 26;
    if (textLength > 60) optimizedFontSize = 20;

    setPlatformTexts(prev => {
      const next = { ...prev };
      ASPECT_RATIOS.forEach((_, idx) => {
        // 각 사이즈별로 텍스트와 최적화된 폰트 사이즈 적용
        next[idx] = { 
          ...(next[idx] || {}), 
          text: mainTextOnly, 
          brand: restaurantName, 
          hashtags: hashes, 
          fontSize: optimizedFontSize, 
          isManualEdit: true 
        };
      });
      return next;
    });
    toast.success("4종 모든 사이즈에 문구가 최적으로 적용되었습니다.");
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
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();
        if (data.status === "done" && data.image) {
          clearInterval(pollingRef.current!);
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
      if (adProductFileRef.current) formData.append("product_image", adProductFileRef.current);

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
    <div className="p-8 md:p-12 mb-20 max-w-[1600px] mx-auto w-full flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* ──────── Page Title ──────── */}
      <div 
        className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-8 slide-in-from-left-8 duration-1000 ease-out"
        style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
      >
        <h1 className="text-3xl font-bold text-on-surface tracking-tight font-headline !border-0">AI 광고 생성</h1>
        <p className="text-[14px] font-medium text-on-surface/60 leading-relaxed !border-0">
          제품 사진을 업로드하고, AI 광고 디자인이 완성하는 고품질 광고 이미지를 만들어보세요.
        </p>
      </div>

      {/* ──────── 3-Column Grid ──────── */}
      <div className="w-full max-w-[1600px] grid grid-cols-12 gap-8 px-2 pb-16 items-start">

        {/* ════════════════════════ LEFT PANEL ════════════════════════ */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-10">
          {/* 이미지 업로드 */}
          <Card
            onClick={() => fileInputRef.current?.click()}
            className="p-6 rounded-xl bg-white border border-surface-container-highest/60 border-dashed hover:border-primary transition-all duration-300 cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md group"
          >
            <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                adProductFileRef.current = file;
                const r = new FileReader();
                r.onload = (ev) => { setPreviewImage(ev.target?.result as string); setGeneratedImage(null); };
                r.readAsDataURL(file);
              }
            }} />
            <div className="flex flex-col items-center justify-center py-4 gap-3">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center text-on-surface/40 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-bold text-on-surface">제품 이미지 업로드 (선택)</p>
                <p className="text-[11px] font-medium text-on-surface/50 mt-1">추천: JPG, PNG (최대 10MB)</p>
              </div>
            </div>
          </Card>

          {/* 광고 정보 */}
          <Card className="p-6 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
            <SectionHeading>광고 기본 정보</SectionHeading>
            <div className="flex flex-col gap-8 mt-1">
              {/* 업종 */}
              <div className="space-y-2.5">
                <FieldLabel>업종 카테고리</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setCategoryKey(c.id)}
                      className={cn(
                        "py-2.5 px-3 rounded-lg text-[11px] font-bold border transition-all duration-200 whitespace-nowrap",
                        idx === 4 && "col-span-2",
                        categoryKey === c.id
                          ? "bg-primary/5 border-primary text-primary shadow-sm"
                          : "bg-surface-container-lowest border-surface-container-highest/60 text-on-surface/60 hover:bg-primary/5 hover:border-primary/30"
                      )}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 테마 */}
              <div className="space-y-2.5">
                <FieldLabel>디자인 테마</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setThemeKey(t.id)}
                      className={cn(
                        "py-2 rounded-lg text-[11px] font-bold border transition-all duration-200 whitespace-nowrap",
                        themeKey === t.id
                          ? "bg-primary/5 border-primary text-primary shadow-sm"
                          : "bg-surface-container-lowest border-surface-container-highest/60 text-on-surface/60 hover:bg-primary/5 hover:border-primary/30"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 광고 설명 */}
              <div className="space-y-2">
                <FieldLabel>상세 광고 컨셉</FieldLabel>
                <Textarea
                  value={adUserInput}
                  onChange={(e) => setAdUserInput(e.target.value)}
                  placeholder="추천: 여름 시즌 신제품, 시원한 바다 배경"
                  className="bg-surface-container-lowest border-surface-container-highest/60 min-h-[100px] rounded-lg text-[13px] leading-relaxed placeholder:text-on-surface/30 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 transition-all px-4 py-3"
                />
                <p className="text-[11px] font-medium text-on-surface/40 mt-1.5 px-0.5">
                  AI가 입력을 분석하여 컨셉에 맞는 배경을 자동 생성합니다.
                </p>
              </div>
            </div>
          </Card>
        </aside>

        {/* ════════════════════════ CENTER – CANVAS ════════════════════════ */}
        <main className="col-span-12 xl:col-span-6 flex flex-col gap-6">
          {/* Preview Header */}
          <div className="flex flex-col gap-6 w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-2 px-1">
              <div>
                <h3 className="text-[11px] font-bold text-on-surface/50 uppercase tracking-wider">디자인 미리보기</h3>
              </div>
              <div className="bg-white p-1 rounded-lg flex gap-1 border border-surface-container-highest/60 shadow-sm min-w-max">
                {ASPECT_RATIOS.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => handleRatioChange(i)}
                    className={cn(
                      "px-4 py-2 text-[11px] font-bold rounded-lg transition-all duration-300 whitespace-nowrap border border-transparent",
                      activeRatioIdx === i
                        ? "bg-primary/5 border-primary text-primary shadow-sm"
                        : "text-on-surface/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                    )}
                  >
                    {r.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Canvas Frame */}
            <div className="flex justify-center w-full">
              <div
                className={cn(
                  "bg-white rounded-[24px] shadow-2xl overflow-hidden border border-surface-container-highest/60 relative transition-all duration-500",
                  ASPECT_RATIOS[activeRatioIdx].class
                )}
                style={{ width: '100%', maxWidth: '460px' }}
              >
                <div className="w-full h-full flex items-center justify-center overflow-hidden bg-surface-container-low">
                  <canvas ref={fabricCanvasElRef} />
                </div>
                {isCooking && (
                  <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-10 text-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-primary/5 rounded-[32px] border border-primary/10 flex items-center justify-center text-primary animate-pulse shadow-xl shadow-primary/5">
                      <ChefHat className="w-10 h-10" />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[17px] font-bold text-on-surface tracking-tight">AI 광고 생성 중</p>
                       <p className="text-[13px] font-medium text-on-surface/50 max-w-[240px] leading-relaxed mx-auto">
                         브랜드 컨셉과 어울리는 배경 소품을 배치하고 있습니다.
                       </p>
                    </div>
                    <div className="bg-surface-container-lowest px-6 py-2.5 rounded-full border border-surface-container-highest/70 shadow-sm mt-2 flex items-center justify-center">
                       <span className="text-[12px] font-bold text-primary tracking-wide">약 40초 정도 소요됩니다.</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ──── Text Style Controls ──── */}
          <Card className="p-6 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm mt-2">
            <SectionHeading>텍스트 스타일링</SectionHeading>

            {/* Size + Font */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-lg border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                  onClick={() => updateSelectedTextStyle({ fontSize: -2 }, true)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-lg border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                  onClick={() => updateSelectedTextStyle({ fontSize: 2 }, true)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative flex-1">
                <select
                  value={platformTexts[activeRatioIdx]?.fontFamily || "Jua"}
                  className="appearance-none bg-surface-container-lowest border border-surface-container-highest/70 h-10 text-[13px] font-bold px-4 pr-10 rounded-lg outline-none w-full cursor-pointer text-on-surface group-hover:border-primary transition-all shadow-sm"
                  onChange={(e) => updateSelectedTextStyle({ fontFamily: e.target.value })}
                >
                  <option value="Jua">주아체</option>
                  <option value="Black Han Sans">블랙 한산스</option>
                  <option value="Hahmlet">함렛</option>
                  <option value="Do Hyeon">도현체</option>
                  <option value="Nanum Myeongjo">나눔명조</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface/30 pointer-events-none" />
              </div>
            </div>

            {/* Color Palettes */}
            <div className="grid grid-cols-2 gap-10">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3 bg-primary rounded-full" />
                  <span className="text-[11px] font-bold text-on-surface/60 uppercase">글자 색상</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {LUXURY_PALETTE.map(p => (
                    <button
                      key={p.color}
                      onClick={() => updateSelectedTextStyle({ fill: p.color })}
                      className={cn(
                        "w-7 h-7 rounded-full border hover:scale-110 active:scale-90 transition-all shadow-sm",
                        p.color === '#FFFFFF' ? "border-surface-container-highest/70" : "border-white"
                      )}
                      style={{ backgroundColor: p.color }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-3 bg-secondary rounded-full" />
                  <span className="text-[11px] font-bold text-on-surface/60 uppercase">테두리 색상</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {LUXURY_PALETTE.map(p => (
                    <button
                      key={'s' + p.color}
                      onClick={() => updateSelectedTextStyle({ stroke: p.color, strokeWidth: 8 })}
                      className={cn(
                        "w-7 h-7 rounded-full border hover:scale-110 active:scale-90 transition-all shadow-sm",
                        p.color === '#FFFFFF' ? "border-surface-container-highest/70" : "border-white"
                      )}
                      style={{ borderColor: p.color, backgroundColor: 'transparent' }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </main>

        {/* ════════════════════════ RIGHT PANEL ════════════════════════ */}
        <aside className="col-span-12 xl:col-span-3 flex flex-col gap-10">
          {/* 생성 도구 버튼 모음 */}
          <Card className="p-7 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
             <SectionHeading>디자인 생성 도구</SectionHeading>
             <div className="flex flex-col gap-4 mt-1.5">
                <UnifiedButton
                  onClick={handleGenerateCopy}
                  disabled={isGeneratingCopy}
                  variant="outline"
                  icon={isGeneratingCopy ? Loader2 : Sparkles}
                  className={cn(isGeneratingCopy && "animate-pulse")}
                >
                  광고 카피 추천 받기
                </UnifiedButton>
                <UnifiedButton
                  onClick={handleGenerateAd}
                  disabled={isCooking}
                  icon={isCooking ? Loader2 : Megaphone}
                >
                  AI 광고 디자인 생성
                </UnifiedButton>
             </div>
             <p className="text-[11px] font-medium text-on-surface/50 mt-5 leading-relaxed px-0.5">
               AI가 컨셉에 가장 어울리는 카피와 이미지를 제안합니다. 마음에 드는 카피를 선택하여 디자인에 적용해 보세요.
             </p>
          </Card>

          {/* 추천 카피 리스트 */}
          <Card className="p-7 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm flex flex-col">
            <SectionHeading>카피 추천 결과</SectionHeading>

            <div className="flex flex-col gap-4 mt-1 overflow-y-auto max-h-[500px] pr-1 styled-scrollbar">
              {aiCopies.length === 0 && !isGeneratingCopy && (
                <div className="py-12 text-center bg-surface-container-lowest/50 rounded-lg border border-dashed border-surface-container-highest/60">
                   <p className="text-[11px] font-medium text-on-surface/30">생성된 카피가 없습니다.</p>
                </div>
              )}
              {aiCopies.map((c, i) => (
                <div key={i} className="p-4 rounded-lg bg-surface-container-lowest border border-surface-container-highest/50 hover:border-primary/30 transition-all duration-300 flex flex-col gap-4 group">
                  <Textarea
                    value={c}
                    onChange={(e) => { const n = [...aiCopies]; n[i] = e.target.value; setAiCopies(n); }}
                    className="bg-transparent border-none p-0 focus-visible:ring-0 text-[12px] font-bold text-on-surface/80 leading-relaxed min-h-[80px] resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => addTextToCanvas(c)}
                      className="flex-1 h-8 rounded-lg border-surface-container-highest/70 text-on-surface/60 text-[10px] font-bold hover:bg-primary/5 hover:text-primary hover:border-primary/30 active:scale-[0.96] transition-all duration-200"
                    >
                      이미지에 적용
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => { navigator.clipboard.writeText(c); toast.success("카피가 복사되었습니다."); }}
                      className="w-8 h-8 rounded-lg border-surface-container-highest/70 text-on-surface/50 hover:text-primary active:scale-[0.96] transition-all"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 추천 태그 + 저장 */}
          <Card className="p-7 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-[10px] font-bold text-on-surface/50 uppercase tracking-[0.05em]">추천 해시태그</h2>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={handleRefreshTags} 
                 disabled={isRefreshingTags}
                 className="w-8 h-8 text-on-surface/30 hover:text-primary hover:bg-primary/5 rounded-full transition-all"
               >
                 <RefreshCcw className={cn("w-3.5 h-3.5", isRefreshingTags && "animate-spin text-primary")} />
               </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-7 mt-1">
              {recommendedTags.map(t => (
                <Badge
                  key={t}
                  variant="outline"
                  onClick={() => {
                    syncCanvasToState();
                    const cur = platformTexts[activeRatioIdx]?.hashtags || "";
                    const next = cur.includes(t) ? cur : (cur + " " + t).trim();
                    setPlatformTexts(prev => ({ ...prev, [activeRatioIdx]: { ...(prev[activeRatioIdx] || {}), hashtags: next, isManualEdit: true } }));
                  }}
                  className="text-[10px] py-1 px-2.5 border-surface-container-highest/70 text-on-surface/60 font-bold hover:bg-primary/5 hover:text-primary hover:border-primary/30 cursor-pointer transition-all rounded-full"
                >
                  {t}
                </Badge>
              ))}
            </div>
            <UnifiedButton
              onClick={handleFinalExport}
              disabled={isExporting || !generatedImage}
              icon={isExporting ? Loader2 : Download}
              className="shadow-primary/20"
            >
              에셋 라이브러리에 저장
            </UnifiedButton>
          </Card>
        </aside>
      </div>
    </div>
  );
}