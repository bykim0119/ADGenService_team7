"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Loader2,
  Download,
  ChevronDown,
  Copy,
  Plus,
  Minus,
  Megaphone,
  ChefHat,
} from "lucide-react";
import { Canvas, Textbox, FabricImage, Shadow } from "fabric";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/* ─── 상수 ─── */
const ASPECT_RATIOS = [
  { id: '1:1',  name: '인스타 피드',   ratio: 1/1,    class: 'aspect-square' },
  { id: '9:16', name: '인스타 스토리', ratio: 9/16,   class: 'aspect-[9/16]' },
  { id: '16:9', name: '유튜브 썸네일', ratio: 16/9,   class: 'aspect-video' },
  { id: '21:9', name: '배너 광고',     ratio: 21/9,   class: 'aspect-[21/9]' },
];

const INITIAL_PREVIEW_IMG =
  "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=1080&h=1080";

const CATEGORIES = [
  { id: 'food',    label: '음식/외식' },
  { id: 'it',      label: 'IT/앱' },
  { id: 'fashion', label: '패션/의류' },
  { id: 'beauty',  label: '뷰티/화장품' },
  { id: 'other',   label: '기타' },
];

const THEMES = [
  { id: 'cartoon',   label: '카툰' },
  { id: 'realistic', label: '실사' },
  { id: 'minimal',   label: '미니멀' },
];

const LUXURY_PALETTE = [
  { name: '퓨어 화이트',   color: '#FFFFFF' },
  { name: '딥 블랙',       color: '#121212' },
  { name: '로즈 레드',     color: '#BE123C' },
  { name: '번트 오렌지',   color: '#C2410C' },
  { name: '앰버 골드',     color: '#B45309' },
  { name: '포레스트 그린', color: '#065F46' },
  { name: '로얄 블루',     color: '#1E40AF' },
  { name: '딥 인디고',     color: '#3730A3' },
  { name: '다크 바이올렛', color: '#6B21A8' },
  { name: '소프트 베이지', color: '#D6D3D1' },
];

/* ─── 타입 ─── */
type GenResult = {
  id: string;
  copy: string;
  tags: string[];
  image: string;
  userInput: string;
};

/* ─── 헬퍼 컴포넌트 ─── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold tracking-[0.05em] uppercase text-on-surface/50 mb-2">
      {children}
    </h2>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-bold text-on-surface/70 tracking-tight block mb-1">
      {children}
    </label>
  );
}

/* ─── 메인 컴포넌트 ─── */
export default function EditorPage() {
  const router = useRouter();

  /* 생성 히스토리 */
  const [genHistory, setGenHistory]     = useState<GenResult[]>([]);
  const [isCooking, setIsCooking]       = useState(false);
  const [genProgress, setGenProgress]   = useState(0);
  const [adUserInput, setAdUserInput]   = useState('');

  /* 캔버스 */
  const [platformTexts, setPlatformTexts] = useState<Record<number, any>>({});
  const [previewImage, setPreviewImage]   = useState(INITIAL_PREVIEW_IMG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isExporting, setIsExporting]     = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeRatioIdx, setActiveRatioIdx] = useState(0);
  const [restaurantName, setRestaurantName] = useState('');

  /* 설정 */
  const [categoryKey, setCategoryKey]       = useState('food');
  const [themeKey, setThemeKey]             = useState('realistic');
  const [ipAdapterWeight, setIpAdapterWeight] = useState(0.7);
  const [hasProductImage, setHasProductImage] = useState(false);

  /* Refs */
  const pollingRef        = useRef<NodeJS.Timeout | null>(null);
  const canvasRef         = useRef<Canvas | null>(null);
  const fabricCanvasElRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef      = useRef<HTMLInputElement>(null);
  const adProductFileRef  = useRef<File | null>(null);
  const activeRatioIdxRef = useRef(0);
  const adHistoryRef      = useRef<Array<{ user_input: string; copy: string; message: string }>>([]);
  const historyEndRef     = useRef<HTMLDivElement>(null);

  useEffect(() => { activeRatioIdxRef.current = activeRatioIdx; }, [activeRatioIdx]);

  /* 히스토리 자동 스크롤 */
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [genHistory]);

  /* ─── 캔버스 함수 ─── */
  const syncCanvasToState = () => {
    const canvas = canvasRef.current;
    if (!canvas || (canvas as any)._isUpdatingInternally) return;

    const objects = canvas.getObjects();
    const phraseObj = objects.find(o => (o as any).data?.id === 'phrase') as any;
    const brandObj  = objects.find(o => (o as any).data?.id === 'brand')  as any;
    const hashObj   = objects.find(o => (o as any).data?.id === 'hash')   as any;

    if (!phraseObj && !brandObj && !hashObj) return;

    setPlatformTexts(prev => {
      const idx     = activeRatioIdxRef.current;
      const current = prev[idx] || {};
      const updates: any = {};
      if (phraseObj) { updates.text      = phraseObj.text; updates.phrasePos = { top: phraseObj.top, left: phraseObj.left }; }
      if (brandObj)  { updates.brand     = brandObj.text;  updates.fontSize  = brandObj.fontSize; updates.brandPos = { top: brandObj.top, left: brandObj.left }; }
      if (hashObj)   { updates.hashtags  = hashObj.text;   updates.hashPos   = { top: hashObj.top, left: hashObj.left }; }
      return { ...prev, [idx]: { ...current, ...updates, isManualEdit: true } };
    });
  };

  const handleRatioChange = (idx: number) => {
    syncCanvasToState();
    setActiveRatioIdx(idx);
  };

  const updateCanvasBackground = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (canvas as any)._isUpdatingInternally = true;

    const imgUrl        = generatedImage || previewImage;
    const ratio         = ASPECT_RATIOS[activeRatioIdx];
    const containerWidth = 460;
    let targetHeight    = containerWidth;
    if (ratio.id === '9:16')  targetHeight = containerWidth * (16 / 9);
    if (ratio.id === '16:9')  targetHeight = containerWidth * (9  / 16);
    if (ratio.id === '21:9')  targetHeight = containerWidth * (9  / 21);

    const needsBgUpdate =
      !canvas.backgroundImage ||
      (canvas.backgroundImage as FabricImage).getSrc() !== imgUrl ||
      canvas.width  !== containerWidth ||
      canvas.height !== targetHeight;

    if (needsBgUpdate) {
      const img = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' });
      canvas.setDimensions({ width: containerWidth, height: targetHeight });
      const scale = Math.max(containerWidth / img.width!, targetHeight / img.height!);
      img.set({ scaleX: scale, scaleY: scale, left: containerWidth / 2, top: targetHeight / 2,
                originX: 'center', originY: 'center', selectable: false, evented: false });
      img.filters = [];
      canvas.backgroundImage = img;
      canvas.requestRenderAll();
    }

    canvas.getObjects().forEach(obj => { if ((obj as any).data?.isTextLayer) canvas.remove(obj); });

    const state       = platformTexts[activeRatioIdx] || {};
    const baseFontSize = state.fontSize || (ratio.id === '9:16' ? 42 : 36);
    const rawFont     = state.fontFamily || 'Jua';
    const fontToUse   = typeof rawFont === 'string' && rawFont.includes(' ') && !rawFont.includes("'")
      ? `'${rawFont}'` : rawFont;

    try { await document.fonts.load(`1em ${fontToUse}`); } catch { /* ignore */ }

    const shadowEffect     = new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 2, offsetY: 2 });
    const commonStyles     = {
      fontFamily: fontToUse || 'sans-serif', fill: state.fill || '#FFFFFF',
      stroke: state.stroke || '#1A1A1A', strokeWidth: 4, paintFirst: 'stroke' as const,
      textAlign: 'center' as const, originX: 'center' as const, originY: 'bottom' as const,
      left: containerWidth / 2, lineHeight: 1.3, shadow: shadowEffect,
      objectCaching: false, centeredScaling: true,
    };
    const controlProps = {
      borderColor: '#FFFFFF', cornerColor: '#FFFFFF', cornerSize: 8,
      transparentCorners: false, padding: 10, hasRotatingPoint: false,
      selectable: true, evented: true, data: { isTextLayer: true },
    };

    const bottomBase = targetHeight * 0.92;
    const hashTop    = bottomBase;
    const brandTop   = hashTop  - baseFontSize * 0.8;
    const phraseTop  = brandTop - baseFontSize * 1.5;

    const layers: any[] = [];
    if (state.text) {
      const pos = state.phrasePos || { top: phraseTop, left: containerWidth / 2 };
      layers.push(new Textbox(state.text.trim(), { ...commonStyles, ...controlProps,
        data: { ...controlProps.data, id: 'phrase' }, top: pos.top, left: pos.left,
        fontSize: baseFontSize * 0.5, width: containerWidth - 20 }));
    }
    if (state.brand) {
      const pos = state.brandPos || { top: brandTop, left: containerWidth / 2 };
      layers.push(new Textbox(state.brand.trim(), { ...commonStyles, ...controlProps,
        data: { ...controlProps.data, id: 'brand' }, top: pos.top, left: pos.left,
        fontSize: baseFontSize, fontWeight: 'bold', strokeWidth: 6, width: containerWidth - 20 }));
    }
    if (state.hashtags) {
      const pos = state.hashPos || { top: hashTop, left: containerWidth / 2 };
      layers.push(new Textbox(state.hashtags.trim(), { ...commonStyles, ...controlProps,
        data: { ...controlProps.data, id: 'hash' }, top: pos.top, left: pos.left,
        fontSize: baseFontSize * 0.45, width: containerWidth - 20 }));
    }

    layers.forEach(obj => { canvas.add(obj); obj.setCoords(); });
    canvas.requestRenderAll();
    setTimeout(() => {
      canvas.getObjects().forEach(obj => { if ((obj as any).data?.isTextLayer) obj.setCoords(); });
      canvas.requestRenderAll();
    }, 150);
    (canvas as any)._isUpdatingInternally = false;
  };

  const addTextToCanvas = (combinedText: string) => {
    const hashtagRegex = /#[^\s#]+/g;
    const hashes       = (combinedText.match(hashtagRegex) || []).join(' ');
    const mainText     = combinedText.replace(hashtagRegex, '').replace(/[\[\]【】]/g, '').trim();

    let fontSize = 44;
    if (mainText.length > 15) fontSize = 38;
    if (mainText.length > 25) fontSize = 32;
    if (mainText.length > 40) fontSize = 26;
    if (mainText.length > 60) fontSize = 20;

    setPlatformTexts(prev => {
      const next = { ...prev };
      ASPECT_RATIOS.forEach((_, idx) => {
        next[idx] = { ...(next[idx] || {}), text: mainText, brand: restaurantName,
                      hashtags: hashes, fontSize, isManualEdit: true };
      });
      return next;
    });
    toast.success("카피가 캔버스에 적용되었습니다.");
  };

  const applyTagsToCanvas = (tags: string[]) => {
    const hashStr = tags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
    syncCanvasToState();
    setPlatformTexts(prev => {
      const next = { ...prev };
      ASPECT_RATIOS.forEach((_, idx) => {
        next[idx] = { ...(next[idx] || {}), hashtags: hashStr, isManualEdit: true };
      });
      return next;
    });
    toast.success("해시태그가 이미지에 적용되었습니다.");
  };

  const updateSelectedTextStyle = (props: any, relative = false) => {
    syncCanvasToState();
    setPlatformTexts(prev => {
      const current = prev[activeRatioIdx] || {};
      const nextFontSize = relative && props.fontSize
        ? (current.fontSize || 40) + props.fontSize
        : (props.fontSize || current.fontSize);
      return { ...prev, [activeRatioIdx]: { ...current, ...props, fontSize: nextFontSize, textAlign: 'center', isManualEdit: true } };
    });
  };

  /* ─── 생성 함수 ─── */
  const pollJobResult = (jobId: string, onDone: (result: Record<string, any>) => void) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setGenProgress(0);
    pollingRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/api/status/${jobId}`);
        const data = await res.json();
        if (typeof data.progress === 'number') setGenProgress(data.progress);

        if (data.status === 'done' && data.image) {
          clearInterval(pollingRef.current!);
          setGenProgress(100);
          onDone(data);
        } else if (data.status === 'failed_input') {
          clearInterval(pollingRef.current!);
          toast.error('입력 이미지를 확인해주세요: ' + (data.detail || ''));
          setIsCooking(false);
        } else if (data.status === 'failed_system' || data.status === 'error') {
          clearInterval(pollingRef.current!);
          toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          setIsCooking(false);
        }
      } catch {
        clearInterval(pollingRef.current!);
        toast.error('상태 확인 중 오류 발생');
        setIsCooking(false);
      }
    }, 2000);
  };

  const handleGenerateAd = async () => {
    if (!adUserInput.trim()) { toast.error('광고 설명을 입력해주세요.'); return; }
    setIsCooking(true);
    try {
      const formData = new FormData();
      formData.append('user_input', adUserInput);
      formData.append('category_key', categoryKey);
      formData.append('theme_key', themeKey);
      formData.append('history', JSON.stringify(adHistoryRef.current));
      if (adProductFileRef.current) {
        formData.append('product_image', adProductFileRef.current);
        formData.append('ip_adapter_weight', String(ipAdapterWeight));
      }

      const response = await fetch('/api/generate', { method: 'POST', body: formData });
      const data     = await response.json();

      if (!response.ok || !data.job_id) {
        toast.error(data.detail || data.error || '광고 생성 요청 실패');
        setIsCooking(false);
        return;
      }

      const currentInput = adUserInput;
      toast.info('AI 이미지 생성 중... 약 30~60초 소요됩니다.');
      pollJobResult(data.job_id, (result) => {
        const imageDataUrl = `data:image/png;base64,${result.image}`;
        const copy: string = result.copy || '';
        const tags: string[] = result.tags || [];

        setGeneratedImage(imageDataUrl);

        if (copy) {
          addTextToCanvas(copy);
          adHistoryRef.current = [
            ...adHistoryRef.current,
            { user_input: currentInput, copy, message: result.message || '' },
          ];
        }

        const newResult: GenResult = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2),
          copy,
          tags,
          image: imageDataUrl,
          userInput: currentInput,
        };
        setGenHistory(prev => [newResult, ...prev]);

        toast.success('AI 광고 생성 완료!');
        setIsCooking(false);
      });
    } catch (e) {
      console.error('Generate Error:', e);
      toast.error('이미지 서버 통신 실패');
      setIsCooking(false);
    }
  };

  /* ─── 내보내기 ─── */
  const handleFinalExport = async () => {
    if (!canvasRef.current || !generatedImage) return;
    syncCanvasToState();
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const latestCopy = genHistory[0]?.copy || '';
      const { data: campaign } = await supabase.from('campaigns').insert({
        user_id: user.id,
        menu_name: adUserInput || '광고',
        category_key: categoryKey,
        selected_copy: latestCopy,
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
                user_id: user.id, campaign_id: campaign.id,
                generated_image_url: url, platform: ratio.name, ad_copy: latestCopy,
              });
              resolve();
            }, 300);
          });
        }
        toast.success('모든 사이즈의 광고가 에셋 라이브러리에 저장되었습니다.');
        router.push('/assets');
      }
    } catch (e) {
      console.error(e);
      toast.error('저장 중 에러가 발생했습니다.');
    } finally { setIsExporting(false); }
  };

  /* ─── Effects ─── */
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setRestaurantName(user.user_metadata?.restaurant_name || '');
      setIsLoadingUser(false);
    };
    init();
  }, [router]);

  useEffect(() => {
    if (!isLoadingUser && fabricCanvasElRef.current && !canvasRef.current) {
      const fc = new Canvas(fabricCanvasElRef.current, {
        width: 460, height: 460, backgroundColor: '#ffffff', preserveObjectStacking: true,
      });
      canvasRef.current = fc;
      fc.on('object:modified', syncCanvasToState);
      fc.on('selection:created', syncCanvasToState);
      fc.on('selection:updated', syncCanvasToState);
      const loadFonts = async () => {
        try {
          await Promise.all([
            document.fonts.load('1em "Jua"'), document.fonts.load('1em "Black Han Sans"'),
            document.fonts.load('1em "Hahmlet"'), document.fonts.load('1em "Do Hyeon"'),
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

  /* ─── JSX ─── */
  return (
    <div className="flex h-full overflow-hidden bg-surface">

      {/* ══════ LEFT: 설정 패널 ══════ */}
      <aside className="w-60 flex-shrink-0 border-r border-surface-container-highest/40 overflow-y-auto flex flex-col gap-3 p-4 bg-surface-container-lowest/30">

        {/* 제품 이미지 업로드 */}
        <Card
          onClick={() => fileInputRef.current?.click()}
          className="p-3 rounded-xl bg-white border border-dashed border-surface-container-highest/60 hover:border-primary transition-all cursor-pointer active:scale-[0.98] shadow-sm group"
        >
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                adProductFileRef.current = file;
                setHasProductImage(true);
                const r = new FileReader();
                r.onload = (ev) => { setPreviewImage(ev.target?.result as string); setGeneratedImage(null); };
                r.readAsDataURL(file);
              }
            }}
          />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-surface-container rounded-full flex items-center justify-center text-on-surface/40 group-hover:scale-110 transition-transform flex-shrink-0">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-on-surface leading-tight">
                {hasProductImage ? '이미지 변경' : '제품 이미지 (선택)'}
              </p>
              <p className="text-[10px] text-on-surface/40 mt-0.5">JPG, PNG · 10MB 이하</p>
            </div>
          </div>
        </Card>

        {/* 업종 카테고리 */}
        <Card className="p-3 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
          <SectionHeading>업종</SectionHeading>
          <div className="flex flex-col gap-1">
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategoryKey(c.id)}
                className={cn(
                  'w-full py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-all text-left',
                  categoryKey === c.id
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-surface-container-lowest border-surface-container-highest/60 text-on-surface/60 hover:bg-primary/5 hover:border-primary/30'
                )}>{c.label}</button>
            ))}
          </div>
        </Card>

        {/* 디자인 테마 */}
        <Card className="p-3 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
          <SectionHeading>테마</SectionHeading>
          <div className="flex flex-col gap-1">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => setThemeKey(t.id)}
                className={cn(
                  'w-full py-1.5 px-3 rounded-lg text-[11px] font-bold border transition-all text-left',
                  themeKey === t.id
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'bg-surface-container-lowest border-surface-container-highest/60 text-on-surface/60 hover:bg-primary/5 hover:border-primary/30'
                )}>{t.label}</button>
            ))}
          </div>
        </Card>

        {/* IP Adapter 강도 */}
        {hasProductImage && (
          <Card className="p-3 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <FieldLabel>이미지 반영 강도</FieldLabel>
              <span className="text-[11px] font-bold text-primary">{ipAdapterWeight.toFixed(1)}</span>
            </div>
            <input type="range" min="0.1" max="1.0" step="0.1" value={ipAdapterWeight}
              onChange={(e) => setIpAdapterWeight(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-primary cursor-pointer" />
            <div className="flex justify-between text-[9px] text-on-surface/30 font-bold mt-1">
              <span>프롬프트</span><span>이미지</span>
            </div>
          </Card>
        )}

        {/* 광고 설명 + 생성 버튼 */}
        <Card className="p-3 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
          <SectionHeading>광고 컨셉</SectionHeading>
          <Textarea
            value={adUserInput}
            onChange={(e) => setAdUserInput(e.target.value)}
            placeholder="예: 여름 한정 신메뉴 프로모션"
            className="bg-surface-container-lowest border-surface-container-highest/60 min-h-[72px] rounded-lg text-[12px] leading-relaxed placeholder:text-on-surface/30 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2 resize-none"
          />
        </Card>

        <Button
          onClick={handleGenerateAd}
          disabled={isCooking}
          className="w-full h-10 rounded-xl font-bold text-[12px] text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/10 active:scale-[0.98] transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            {isCooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
            {isCooking ? `생성 중 ${genProgress}%` : 'AI 광고 생성'}
          </span>
        </Button>
      </aside>

      {/* ══════ CENTER: 캔버스 미리보기 ══════ */}
      <main className="flex-1 min-w-0 border-r border-surface-container-highest/40 overflow-y-auto flex flex-col gap-4 p-5">

        {/* 비율 탭 */}
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-on-surface/50 uppercase tracking-wider">디자인 미리보기</h3>
          <div className="bg-white p-1 rounded-lg flex gap-1 border border-surface-container-highest/60 shadow-sm">
            {ASPECT_RATIOS.map((r, i) => (
              <button key={r.id} onClick={() => handleRatioChange(i)}
                className={cn(
                  'px-3 py-1.5 text-[10px] font-bold rounded-md transition-all whitespace-nowrap border border-transparent',
                  activeRatioIdx === i
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'text-on-surface/50 hover:bg-primary/5 hover:text-primary hover:border-primary/30'
                )}>{r.name}</button>
            ))}
          </div>
        </div>

        {/* 캔버스 */}
        <div className="flex justify-center">
          <div
            className={cn(
              'bg-white rounded-2xl shadow-xl overflow-hidden border border-surface-container-highest/60 relative transition-all duration-500',
              ASPECT_RATIOS[activeRatioIdx].class
            )}
            style={{ width: '100%', maxWidth: '460px' }}
          >
            <div className="w-full h-full flex items-center justify-center overflow-hidden bg-surface-container-low">
              <canvas ref={fabricCanvasElRef} />
            </div>
            {isCooking && (
              <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center gap-4 p-8 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-primary/5 rounded-[28px] border border-primary/10 flex items-center justify-center text-primary animate-pulse shadow-lg shadow-primary/5">
                  <ChefHat className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-[15px] font-bold text-on-surface">AI 광고 생성 중</p>
                  <p className="text-[12px] text-on-surface/50">브랜드 컨셉에 맞는 배경을 만들고 있어요</p>
                </div>
                <div className="w-full max-w-[180px] flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-on-surface/50">
                      {genProgress < 5 ? '준비 중' : genProgress < 15 ? '모델 로딩' : genProgress < 91 ? '이미지 생성' : '후처리'}
                    </span>
                    <span className="text-primary">{genProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${genProgress}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 텍스트 스타일링 */}
        <Card className="p-4 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
          <SectionHeading>텍스트 스타일링</SectionHeading>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon"
                className="w-9 h-9 rounded-lg border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                onClick={() => updateSelectedTextStyle({ fontSize: -2 }, true)}>
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon"
                className="w-9 h-9 rounded-lg border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                onClick={() => updateSelectedTextStyle({ fontSize: 2 }, true)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="relative flex-1">
              <select
                value={platformTexts[activeRatioIdx]?.fontFamily || 'Jua'}
                className="appearance-none bg-surface-container-lowest border border-surface-container-highest/70 h-9 text-[12px] font-bold px-3 pr-8 rounded-lg outline-none w-full cursor-pointer text-on-surface shadow-sm"
                onChange={(e) => updateSelectedTextStyle({ fontFamily: e.target.value })}>
                <option value="Jua">주아체</option>
                <option value="Black Han Sans">블랙 한산스</option>
                <option value="Hahmlet">함렛</option>
                <option value="Do Hyeon">도현체</option>
                <option value="Nanum Myeongjo">나눔명조</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1 h-2.5 bg-primary rounded-full" />
                <span className="text-[10px] font-bold text-on-surface/50 uppercase">글자 색</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LUXURY_PALETTE.map(p => (
                  <button key={p.color} title={p.name}
                    onClick={() => updateSelectedTextStyle({ fill: p.color })}
                    className={cn('w-6 h-6 rounded-full border hover:scale-110 active:scale-90 transition-all shadow-sm',
                      p.color === '#FFFFFF' ? 'border-surface-container-highest/70' : 'border-white')}
                    style={{ backgroundColor: p.color }} />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1 h-2.5 bg-secondary rounded-full" />
                <span className="text-[10px] font-bold text-on-surface/50 uppercase">테두리 색</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LUXURY_PALETTE.map(p => (
                  <button key={'s' + p.color} title={p.name}
                    onClick={() => updateSelectedTextStyle({ stroke: p.color, strokeWidth: 8 })}
                    className="w-6 h-6 rounded-full border-2 hover:scale-110 active:scale-90 transition-all shadow-sm bg-transparent"
                    style={{ borderColor: p.color }} />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 에셋 저장 */}
        <Button
          onClick={handleFinalExport}
          disabled={isExporting || !generatedImage}
          className="w-full h-10 rounded-xl font-bold text-[13px] text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/10 active:scale-[0.98] transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            에셋 라이브러리에 저장
          </span>
        </Button>
      </main>

      {/* ══════ RIGHT: 생성 히스토리 ══════ */}
      <aside className="w-72 flex-shrink-0 flex flex-col h-full">
        <div className="flex-shrink-0 px-4 py-3 border-b border-surface-container-highest/40">
          <h3 className="text-[11px] font-bold text-on-surface/50 uppercase tracking-wider">생성 히스토리</h3>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4">
          {genHistory.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-on-surface/20" />
              </div>
              <p className="text-[12px] font-bold text-on-surface/30">아직 생성된 광고가 없어요</p>
              <p className="text-[11px] text-on-surface/20">왼쪽에서 설정 후 생성 버튼을 눌러보세요</p>
            </div>
          )}

          {genHistory.map((item) => (
            <Card key={item.id} className="p-3 rounded-xl border-surface-container-highest/60 shadow-sm flex flex-col gap-2">
              {/* 썸네일 */}
              <div className="relative rounded-lg overflow-hidden">
                <img src={item.image} alt="Generated" className="w-full block rounded-lg" />
                <button
                  onClick={() => { setGeneratedImage(item.image); toast.success('이미지가 캔버스에 적용되었습니다.'); }}
                  className="absolute bottom-1.5 right-1.5 px-2 py-1 bg-black/60 hover:bg-black/80 text-white text-[9px] font-bold rounded-md backdrop-blur-sm transition-all"
                >캔버스에 적용</button>
              </div>

              {/* 카피 */}
              {item.copy && (
                <div className="bg-surface-container-lowest rounded-lg p-2.5">
                  <p className="text-[10px] font-bold text-on-surface/40 mb-1">광고 카피</p>
                  <p className="text-[11px] leading-relaxed text-on-surface/80 whitespace-pre-wrap">{item.copy}</p>
                  <div className="flex gap-1.5 mt-2">
                    <Button variant="outline" size="sm"
                      onClick={() => addTextToCanvas(item.copy)}
                      className="flex-1 h-7 rounded-lg text-[9px] font-bold border-surface-container-highest/70 text-on-surface/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
                      이미지에 적용
                    </Button>
                    <Button variant="outline" size="icon"
                      onClick={() => { navigator.clipboard.writeText(item.copy); toast.success('복사되었습니다.'); }}
                      className="w-7 h-7 rounded-lg border-surface-container-highest/70 text-on-surface/50 hover:text-primary">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              {/* 해시태그 */}
              {item.tags.length > 0 && (
                <div className="bg-surface-container-lowest rounded-lg p-2.5">
                  <p className="text-[10px] font-bold text-on-surface/40 mb-1.5">해시태그</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.tags.map(t => (
                      <Badge key={t} variant="outline"
                        className="text-[9px] py-0.5 px-2 border-surface-container-highest/70 text-on-surface/60 font-bold rounded-full">
                        {t.startsWith('#') ? t : `#${t}`}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm"
                    onClick={() => applyTagsToCanvas(item.tags)}
                    className="w-full h-7 rounded-lg text-[9px] font-bold border-surface-container-highest/70 text-on-surface/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
                    이미지에 적용
                  </Button>
                </div>
              )}
            </Card>
          ))}

          <div ref={historyEndRef} />
        </div>
      </aside>
    </div>
  );
}
