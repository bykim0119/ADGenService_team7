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
  Utensils,
  Monitor,
  Shirt,
  Sparkles,
  Ellipsis,
  Palette,
  Camera,
  Box,
  Image as ImageIcon,
  Upload,
  Utensils,
  Monitor,
  Shirt,
  Sparkles,
  Ellipsis,
  Palette,
  Camera,
  Box,
  Image as ImageIcon,
  Upload,
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
  { id: '1:1', name: '인스타 피드', ratio: 1 / 1, class: 'aspect-square' },
  { id: '9:16', name: '인스타 스토리', ratio: 9 / 16, class: 'aspect-[9/16]' },
  { id: '16:9', name: '유튜브 썸네일', ratio: 16 / 9, class: 'aspect-video' },
  { id: '21:9', name: '배너 광고', ratio: 21 / 9, class: 'aspect-[21/9]' },
  { id: '1:1', name: '인스타 피드', ratio: 1 / 1, class: 'aspect-square' },
  { id: '9:16', name: '인스타 스토리', ratio: 9 / 16, class: 'aspect-[9/16]' },
  { id: '16:9', name: '유튜브 썸네일', ratio: 16 / 9, class: 'aspect-video' },
  { id: '21:9', name: '배너 광고', ratio: 21 / 9, class: 'aspect-[21/9]' },
];

const INITIAL_PREVIEW_IMG =
  "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=1080&h=1080";

const CATEGORIES = [
  { id: 'food', label: '음식/외식', icon: Utensils },
  { id: 'it', label: 'IT/앱', icon: Monitor },
  { id: 'fashion', label: '패션/의류', icon: Shirt },
  { id: 'beauty', label: '뷰티/화장품', icon: Sparkles },
  { id: 'other', label: '기타', icon: Ellipsis },
  { id: 'food', label: '음식/외식', icon: Utensils },
  { id: 'it', label: 'IT/앱', icon: Monitor },
  { id: 'fashion', label: '패션/의류', icon: Shirt },
  { id: 'beauty', label: '뷰티/화장품', icon: Sparkles },
  { id: 'other', label: '기타', icon: Ellipsis },
];

const THEMES = [
  { id: 'cartoon', label: '카툰', icon: Palette },
  { id: 'realistic', label: '실사', icon: Camera },
  { id: 'minimal', label: '미니멀', icon: Box },
  { id: 'cartoon', label: '카툰', icon: Palette },
  { id: 'realistic', label: '실사', icon: Camera },
  { id: 'minimal', label: '미니멀', icon: Box },
];

const LUXURY_PALETTE = [
  { name: '퓨어 화이트', color: '#FFFFFF' },
  { name: '딥 블랙', color: '#121212' },
  { name: '로즈 레드', color: '#BE123C' },
  { name: '번트 오렌지', color: '#C2410C' },
  { name: '앰버 골드', color: '#B45309' },
  { name: '퓨어 화이트', color: '#FFFFFF' },
  { name: '딥 블랙', color: '#121212' },
  { name: '로즈 레드', color: '#BE123C' },
  { name: '번트 오렌지', color: '#C2410C' },
  { name: '앰버 골드', color: '#B45309' },
  { name: '포레스트 그린', color: '#065F46' },
  { name: '로얄 블루', color: '#1E40AF' },
  { name: '딥 인디고', color: '#3730A3' },
  { name: '로얄 블루', color: '#1E40AF' },
  { name: '딥 인디고', color: '#3730A3' },
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
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-3 bg-primary/40 rounded-full" />
      <h2 className="text-[10px] font-bold tracking-[0.1em] uppercase text-on-surface/40">
        {children}
      </h2>
    </div>
    <div className="flex items-center gap-2 mb-3">
      <div className="w-1 h-3 bg-primary/40 rounded-full" />
      <h2 className="text-[10px] font-bold tracking-[0.1em] uppercase text-on-surface/40">
        {children}
      </h2>
    </div>
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
  const [genHistory, setGenHistory] = useState<GenResult[]>([]);
  const [isCooking, setIsCooking] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [adUserInput, setAdUserInput] = useState('');
  const [genHistory, setGenHistory] = useState<GenResult[]>([]);
  const [isCooking, setIsCooking] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [adUserInput, setAdUserInput] = useState('');

  /* 캔버스 */
  const [platformTexts, setPlatformTexts] = useState<Record<number, any>>({});
  const [containerWidth, setContainerWidth] = useState(460);
  const [previewImage, setPreviewImage] = useState(INITIAL_PREVIEW_IMG);
  const [containerWidth, setContainerWidth] = useState(460);
  const [previewImage, setPreviewImage] = useState(INITIAL_PREVIEW_IMG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeRatioIdx, setActiveRatioIdx] = useState(0);
  const [restaurantName, setRestaurantName] = useState('');

  /* 설정 */
<<<<<<< HEAD
  const [categoryKey, setCategoryKey]       = useState('food');
  const [themeKey, setThemeKey]             = useState('realistic');
  const [ipAdapterWeight, setIpAdapterWeight] = useState(0.5);
=======
  const [categoryKey, setCategoryKey] = useState('food');
  const [themeKey, setThemeKey] = useState('realistic');
  const [ipAdapterWeight, setIpAdapterWeight] = useState(0.7);
>>>>>>> ce2554362a844e91808f1f0ddd9a925201686c7a
  const [hasProductImage, setHasProductImage] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'canvas' | 'history'>('settings');


  const [activeTab, setActiveTab] = useState<'settings' | 'canvas' | 'history'>('settings');



  /* Refs */
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const fabricCanvasElRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const adProductFileRef = useRef<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const adProductFileRef = useRef<File | null>(null);
  const activeRatioIdxRef = useRef(0);
  const adHistoryRef = useRef<Array<{ user_input: string; copy: string; message: string }>>([]);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const adHistoryRef = useRef<Array<{ user_input: string; copy: string; message: string }>>([]);
  const historyEndRef = useRef<HTMLDivElement>(null);

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
    const brandObj = objects.find(o => (o as any).data?.id === 'brand') as any;
    const hashObj = objects.find(o => (o as any).data?.id === 'hash') as any;
    const brandObj = objects.find(o => (o as any).data?.id === 'brand') as any;
    const hashObj = objects.find(o => (o as any).data?.id === 'hash') as any;

    if (!phraseObj && !brandObj && !hashObj) return;

    setPlatformTexts(prev => {
      const idx = activeRatioIdxRef.current;
      const idx = activeRatioIdxRef.current;
      const current = prev[idx] || {};
      const updates: any = {};
      if (phraseObj) { updates.text = phraseObj.text; updates.phrasePos = { top: phraseObj.top, left: phraseObj.left }; }
      if (brandObj) { updates.brand = brandObj.text; updates.fontSize = brandObj.fontSize; updates.brandPos = { top: brandObj.top, left: brandObj.left }; }
      if (hashObj) { updates.hashtags = hashObj.text; updates.hashPos = { top: hashObj.top, left: hashObj.left }; }
      if (phraseObj) { updates.text = phraseObj.text; updates.phrasePos = { top: phraseObj.top, left: phraseObj.left }; }
      if (brandObj) { updates.brand = brandObj.text; updates.fontSize = brandObj.fontSize; updates.brandPos = { top: brandObj.top, left: brandObj.left }; }
      if (hashObj) { updates.hashtags = hashObj.text; updates.hashPos = { top: hashObj.top, left: hashObj.left }; }
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

    const imgUrl = generatedImage || previewImage;
    const ratio = ASPECT_RATIOS[activeRatioIdx];
    // const containerWidth = 460; // Use state instead
    let targetHeight = containerWidth;
    if (ratio.id === '9:16') targetHeight = containerWidth * (16 / 9);
    if (ratio.id === '16:9') targetHeight = containerWidth * (9 / 16);
    if (ratio.id === '21:9') targetHeight = containerWidth * (9 / 21);
    const imgUrl = generatedImage || previewImage;
    const ratio = ASPECT_RATIOS[activeRatioIdx];
    // const containerWidth = 460; // Use state instead
    let targetHeight = containerWidth;
    if (ratio.id === '9:16') targetHeight = containerWidth * (16 / 9);
    if (ratio.id === '16:9') targetHeight = containerWidth * (9 / 16);
    if (ratio.id === '21:9') targetHeight = containerWidth * (9 / 21);

    const needsBgUpdate =
      !canvas.backgroundImage ||
      (canvas.backgroundImage as FabricImage).getSrc() !== imgUrl ||
      canvas.width !== containerWidth ||
      canvas.width !== containerWidth ||
      canvas.height !== targetHeight;

    if (needsBgUpdate) {
      const img = await FabricImage.fromURL(imgUrl, { crossOrigin: 'anonymous' });
      canvas.setDimensions({ width: containerWidth, height: targetHeight });
      const scale = Math.max(containerWidth / img.width!, targetHeight / img.height!);
      img.set({
        scaleX: scale, scaleY: scale, left: containerWidth / 2, top: targetHeight / 2,
        originX: 'center', originY: 'center', selectable: false, evented: false
      });
      img.set({
        scaleX: scale, scaleY: scale, left: containerWidth / 2, top: targetHeight / 2,
        originX: 'center', originY: 'center', selectable: false, evented: false
      });
      img.filters = [];
      canvas.backgroundImage = img;
      canvas.requestRenderAll();
    }

    canvas.getObjects().forEach(obj => { if ((obj as any).data?.isTextLayer) canvas.remove(obj); });

    const state = platformTexts[activeRatioIdx] || {};
    const state = platformTexts[activeRatioIdx] || {};
    const baseFontSize = state.fontSize || (ratio.id === '9:16' ? 42 : 36);
    const rawFont = state.fontFamily || 'Jua';
    const fontToUse = typeof rawFont === 'string' && rawFont.includes(' ') && !rawFont.includes("'")
    const rawFont = state.fontFamily || 'Jua';
    const fontToUse = typeof rawFont === 'string' && rawFont.includes(' ') && !rawFont.includes("'")
      ? `'${rawFont}'` : rawFont;

    try { await document.fonts.load(`1em ${fontToUse}`); } catch { /* ignore */ }

    const shadowEffect = new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 2, offsetY: 2 });
    const commonStyles = {
    const shadowEffect = new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 2, offsetY: 2 });
    const commonStyles = {
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
    const hashTop = bottomBase;
    const brandTop = hashTop - baseFontSize * 0.8;
    const phraseTop = brandTop - baseFontSize * 1.5;
    const hashTop = bottomBase;
    const brandTop = hashTop - baseFontSize * 0.8;
    const phraseTop = brandTop - baseFontSize * 1.5;

    const layers: any[] = [];
    if (state.text) {
      const pos = state.phrasePos || { top: phraseTop, left: containerWidth / 2 };
      layers.push(new Textbox(state.text.trim(), {
        ...commonStyles, ...controlProps,
      layers.push(new Textbox(state.text.trim(), {
        ...commonStyles, ...controlProps,
        data: { ...controlProps.data, id: 'phrase' }, top: pos.top, left: pos.left,
        fontSize: baseFontSize * 0.5, width: containerWidth - 20
      }));
        fontSize: baseFontSize * 0.5, width: containerWidth - 20
      }));
    }
    if (state.brand) {
      const pos = state.brandPos || { top: brandTop, left: containerWidth / 2 };
      layers.push(new Textbox(state.brand.trim(), {
        ...commonStyles, ...controlProps,
      layers.push(new Textbox(state.brand.trim(), {
        ...commonStyles, ...controlProps,
        data: { ...controlProps.data, id: 'brand' }, top: pos.top, left: pos.left,
        fontSize: baseFontSize, fontWeight: 'bold', strokeWidth: 6, width: containerWidth - 20
      }));
        fontSize: baseFontSize, fontWeight: 'bold', strokeWidth: 6, width: containerWidth - 20
      }));
    }
    if (state.hashtags) {
      const pos = state.hashPos || { top: hashTop, left: containerWidth / 2 };
      layers.push(new Textbox(state.hashtags.trim(), {
        ...commonStyles, ...controlProps,
      layers.push(new Textbox(state.hashtags.trim(), {
        ...commonStyles, ...controlProps,
        data: { ...controlProps.data, id: 'hash' }, top: pos.top, left: pos.left,
        fontSize: baseFontSize * 0.45, width: containerWidth - 20
      }));
        fontSize: baseFontSize * 0.45, width: containerWidth - 20
      }));
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
    const hashes = (combinedText.match(hashtagRegex) || []).join(' ');
    const mainText = combinedText.replace(hashtagRegex, '').replace(/[\[\]【】]/g, '').trim();
    const hashes = (combinedText.match(hashtagRegex) || []).join(' ');
    const mainText = combinedText.replace(hashtagRegex, '').replace(/[\[\]【】]/g, '').trim();

    let fontSize = 44;
    if (mainText.length > 15) fontSize = 38;
    if (mainText.length > 25) fontSize = 32;
    if (mainText.length > 40) fontSize = 26;
    if (mainText.length > 60) fontSize = 20;

    setPlatformTexts(prev => {
      const next = { ...prev };
      ASPECT_RATIOS.forEach((_, idx) => {
        next[idx] = {
          ...(next[idx] || {}), text: mainText, brand: restaurantName,
          hashtags: hashes, fontSize, isManualEdit: true
        };
        next[idx] = {
          ...(next[idx] || {}), text: mainText, brand: restaurantName,
          hashtags: hashes, fontSize, isManualEdit: true
        };
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
        const res = await fetch(`/api/status/${jobId}`);
        const res = await fetch(`/api/status/${jobId}`);
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
      const data = await response.json();
      const data = await response.json();

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
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.replace('/login');
          return;
        }
        setRestaurantName(user.user_metadata?.restaurant_name || '');
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setIsLoadingUser(false);
      }
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          router.replace('/login');
          return;
        }
        setRestaurantName(user.user_metadata?.restaurant_name || '');
      } catch (err) {
        console.error("Auth error:", err);
      } finally {
        setIsLoadingUser(false);
      }
    };
    init();


    const handleResize = () => {
      const w = Math.min(460, window.innerWidth - 64);
      setContainerWidth(w);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);


    const handleResize = () => {
      const w = Math.min(460, window.innerWidth - 64);
      setContainerWidth(w);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  useEffect(() => {
    if (!isLoadingUser && fabricCanvasElRef.current && !canvasRef.current) {
      const fc = new Canvas(fabricCanvasElRef.current, {
        width: containerWidth, height: containerWidth, backgroundColor: '#ffffff', preserveObjectStacking: true,
        width: containerWidth, height: containerWidth, backgroundColor: '#ffffff', preserveObjectStacking: true,
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

    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-surface relative">
      {/* ══════ MOBILE TABS ══════ */}
      <div className="lg:hidden flex border-b border-surface-container-highest/40 bg-white">
        {(['settings', 'canvas', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-[11px] font-bold transition-colors border-b-2",
              activeTab === tab
                ? "text-primary border-primary bg-primary/5"
                : "text-slate-400 border-transparent hover:text-slate-600"
            )}
          >
            {tab === 'settings' ? '설정' : tab === 'canvas' ? '편집기' : '히스토리'}
          </button>
        ))}
      </div>

    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-surface relative">
      {/* ══════ MOBILE TABS ══════ */}
      <div className="lg:hidden flex border-b border-surface-container-highest/40 bg-white">
        {(['settings', 'canvas', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-[11px] font-bold transition-colors border-b-2",
              activeTab === tab
                ? "text-primary border-primary bg-primary/5"
                : "text-slate-400 border-transparent hover:text-slate-600"
            )}
          >
            {tab === 'settings' ? '설정' : tab === 'canvas' ? '편집기' : '히스토리'}
          </button>
        ))}
      </div>

      {/* ══════ LEFT: 설정 패널 ══════ */}
      <aside className={cn(
        "w-full lg:w-64 flex-1 lg:flex-none min-h-0 border-r border-surface-container-highest/40 overflow-y-auto flex flex-col gap-3.5 p-4 pb-8 bg-surface-container-lowest/30 transition-all",

        activeTab !== 'settings' && "hidden lg:flex"
      )}>




        <Card className="p-4 border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] rounded-2xl bg-white space-y-4">
          <SectionHeading>제품 이미지 추가</SectionHeading>

          {/* Mobile: Grid Layout (Gallery/Camera) */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            {/* Gallery Upload */}
            <Card
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-3 rounded-2xl bg-white border border-slate-200 hover:border-primary transition-all cursor-pointer active:scale-[0.95] shadow-sm group flex flex-col items-center justify-center gap-2",
                hasProductImage && adProductFileRef.current && !adProductFileRef.current.name.includes('camera') 
                  ? "border-primary bg-primary/5" 
                  : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                hasProductImage && adProductFileRef.current && !adProductFileRef.current.name.includes('camera') 
                  ? "bg-primary text-white" 
                  : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
              )}>
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">갤러리</span>
            </Card>

            {/* Camera Upload */}
            <Card
              onClick={() => cameraInputRef.current?.click()}
              className={cn(
                "p-3 rounded-2xl bg-white border border-slate-200 hover:border-primary transition-all cursor-pointer active:scale-[0.95] shadow-sm group flex flex-col items-center justify-center gap-2",
                hasProductImage && adProductFileRef.current && adProductFileRef.current.name.includes('camera')
                  ? "border-primary bg-primary/5" 
                  : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                hasProductImage && adProductFileRef.current && adProductFileRef.current.name.includes('camera')
                  ? "bg-primary text-white" 
                  : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
              )}>
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">촬영하기</span>
            </Card>
          </div>

          {/* PC: Original Style (Single Wide Box) */}
          <Card
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "hidden md:flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group gap-3 animate-in fade-in duration-500",
              hasProductImage && "border-primary/20 bg-primary/5"
            )}
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
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const cameraFile = new File([file], `camera_${file.name}`, { type: file.type });
                    adProductFileRef.current = cameraFile;
                    setHasProductImage(true);
                    const r = new FileReader();
                    r.onload = (ev) => { setPreviewImage(ev.target?.result as string); setGeneratedImage(null); };
                    r.readAsDataURL(file);
                  }
                }}
              />
             <div className="w-11 h-11 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
               <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-primary" />
             </div>
             <div className="text-center">
               <p className="text-[12px] font-bold text-slate-600">제품 이미지 업로드 <span className="text-[10px] font-medium text-slate-400 opacity-90">(선택)</span></p>
               <p className="text-[10px] text-slate-400 mt-0.5">이미지를 드래그하거나 클릭하여 추가하세요</p>
             </div>

          </Card>
      <aside className={cn(
        "w-full lg:w-64 flex-1 lg:flex-none min-h-0 border-r border-surface-container-highest/40 overflow-y-auto flex flex-col gap-3.5 p-4 pb-8 bg-surface-container-lowest/30 transition-all",

        activeTab !== 'settings' && "hidden lg:flex"
      )}>




        <Card className="p-4 border-slate-100 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] rounded-2xl bg-white space-y-4">
          <SectionHeading>제품 이미지 추가</SectionHeading>

          {/* Mobile: Grid Layout (Gallery/Camera) */}
          <div className="grid grid-cols-2 gap-2 md:hidden">
            {/* Gallery Upload */}
            <Card
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "p-3 rounded-2xl bg-white border border-slate-200 hover:border-primary transition-all cursor-pointer active:scale-[0.95] shadow-sm group flex flex-col items-center justify-center gap-2",
                hasProductImage && adProductFileRef.current && !adProductFileRef.current.name.includes('camera') 
                  ? "border-primary bg-primary/5" 
                  : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                hasProductImage && adProductFileRef.current && !adProductFileRef.current.name.includes('camera') 
                  ? "bg-primary text-white" 
                  : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
              )}>
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">갤러리</span>
            </Card>

            {/* Camera Upload */}
            <Card
              onClick={() => cameraInputRef.current?.click()}
              className={cn(
                "p-3 rounded-2xl bg-white border border-slate-200 hover:border-primary transition-all cursor-pointer active:scale-[0.95] shadow-sm group flex flex-col items-center justify-center gap-2",
                hasProductImage && adProductFileRef.current && adProductFileRef.current.name.includes('camera')
                  ? "border-primary bg-primary/5" 
                  : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                hasProductImage && adProductFileRef.current && adProductFileRef.current.name.includes('camera')
                  ? "bg-primary text-white" 
                  : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
              )}>
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700">촬영하기</span>
            </Card>
          </div>

          {/* PC: Original Style (Single Wide Box) */}
          <Card
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "hidden md:flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group gap-3 animate-in fade-in duration-500",
              hasProductImage && "border-primary/20 bg-primary/5"
            )}
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
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const cameraFile = new File([file], `camera_${file.name}`, { type: file.type });
                    adProductFileRef.current = cameraFile;
                    setHasProductImage(true);
                    const r = new FileReader();
                    r.onload = (ev) => { setPreviewImage(ev.target?.result as string); setGeneratedImage(null); };
                    r.readAsDataURL(file);
                  }
                }}
              />
             <div className="w-11 h-11 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
               <UploadCloud className="w-5 h-5 text-slate-400 group-hover:text-primary" />
             </div>
             <div className="text-center">
               <p className="text-[12px] font-bold text-slate-600">제품 이미지 업로드 <span className="text-[10px] font-medium text-slate-400 opacity-90">(선택)</span></p>
               <p className="text-[10px] text-slate-400 mt-0.5">이미지를 드래그하거나 클릭하여 추가하세요</p>
             </div>

          </Card>




          
          {hasProductImage && (
            <p className="text-[10px] text-primary font-bold text-center mt-1 animate-in fade-in">
              이미지가 선택되었습니다.
            </p>
          )}
        </Card>






          
          {hasProductImage && (
            <p className="text-[10px] text-primary font-bold text-center mt-1 animate-in fade-in">
              이미지가 선택되었습니다.
            </p>
          )}
        </Card>



        {/* 업종 카테고리 */}
        <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <SectionHeading>업종 선택</SectionHeading>
          <div className="flex flex-col gap-1.5 relative z-10">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const isActive = categoryKey === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryKey(c.id)}
                  className={cn(
                    'group relative w-full flex items-center gap-2.5 py-1.5 px-3 rounded-full text-[11px] font-medium transition-all duration-300 border',
                    isActive
                      ? 'bg-primary/5 border-primary text-primary shadow-sm scale-[1.02]'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary active:scale-95'
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-primary text-white" : "bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="flex-1 text-left">{c.label}</span>
                </button>
              );
            })}
        <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <SectionHeading>업종 선택</SectionHeading>
          <div className="flex flex-col gap-1.5 relative z-10">
            {CATEGORIES.map(c => {
              const Icon = c.icon;
              const isActive = categoryKey === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategoryKey(c.id)}
                  className={cn(
                    'group relative w-full flex items-center gap-2.5 py-1.5 px-3 rounded-full text-[11px] font-medium transition-all duration-300 border',
                    isActive
                      ? 'bg-primary/5 border-primary text-primary shadow-sm scale-[1.02]'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-primary/30 hover:bg-primary/[0.04] hover:text-primary active:scale-95'
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-primary text-white" : "bg-slate-100 group-hover:bg-primary/10 group-hover:text-primary"
                  )}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="flex-1 text-left">{c.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* 디자인 테마 */}
        <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <SectionHeading>디자인 테마</SectionHeading>
          <div className="flex flex-col gap-1.5 relative z-10">
            {THEMES.map(t => {
              const Icon = t.icon;
              const isActive = themeKey === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeKey(t.id)}
                  className={cn(
                    'group relative w-full flex items-center gap-2.5 py-1.5 px-3 rounded-full text-[11px] font-medium transition-all duration-300 border',
                    isActive
                      ? 'bg-secondary/5 border-secondary text-secondary shadow-sm scale-[1.02]'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-secondary/30 hover:bg-secondary/[0.04] hover:text-secondary active:scale-95'
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-secondary text-white" : "bg-slate-100 group-hover:bg-secondary/10 group-hover:text-secondary"
                  )}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="flex-1 text-left">{t.label}</span>
                </button>
              );
            })}
        <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <SectionHeading>디자인 테마</SectionHeading>
          <div className="flex flex-col gap-1.5 relative z-10">
            {THEMES.map(t => {
              const Icon = t.icon;
              const isActive = themeKey === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setThemeKey(t.id)}
                  className={cn(
                    'group relative w-full flex items-center gap-2.5 py-1.5 px-3 rounded-full text-[11px] font-medium transition-all duration-300 border',
                    isActive
                      ? 'bg-secondary/5 border-secondary text-secondary shadow-sm scale-[1.02]'
                      : 'bg-white border-slate-100 text-slate-500 hover:border-secondary/30 hover:bg-secondary/[0.04] hover:text-secondary active:scale-95'
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-secondary text-white" : "bg-slate-100 group-hover:bg-secondary/10 group-hover:text-secondary"
                  )}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="flex-1 text-left">{t.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* IP Adapter 강도 */}
        {hasProductImage && (
          <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
            <div className="flex justify-between items-start">
              <SectionHeading>이미지 반영 강도</SectionHeading>
              <span className="text-[11px] font-bold text-primary mt-0.5">{ipAdapterWeight.toFixed(1)}</span>
          <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
            <div className="flex justify-between items-start">
              <SectionHeading>이미지 반영 강도</SectionHeading>
              <span className="text-[11px] font-bold text-primary mt-0.5">{ipAdapterWeight.toFixed(1)}</span>
            </div>
            <input type="range" min="0.1" max="1.0" step="0.05" value={ipAdapterWeight}
              onChange={(e) => setIpAdapterWeight(parseFloat(e.target.value))}
              className="w-full h-1.5 accent-primary cursor-pointer" />
            <div className="flex justify-between text-[9px] text-on-surface/30 font-bold mt-1">
              <span>프롬프트</span><span>이미지</span>
            </div>
          </Card>
        )}

        {/* 광고 설명 + 생성 버튼 */}
        <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
        <Card className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
          <SectionHeading>광고 컨셉</SectionHeading>
          <textarea
          <textarea
            value={adUserInput}
            onChange={(e) => setAdUserInput(e.target.value)}
            placeholder="예: 여름 한정 신메뉴 프로모션"
            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-lg text-[13px] text-on-surface/80 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 shadow-sm resize-none transition-all placeholder:text-slate-300"
            className="w-full h-32 p-4 bg-white border border-slate-200 rounded-lg text-[13px] text-on-surface/80 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 hover:border-slate-300 shadow-sm resize-none transition-all placeholder:text-slate-300"
          />
        </Card>

        <Button
          onClick={handleGenerateAd}
          disabled={isCooking}
          className="w-full h-11 rounded-lg font-bold text-[13px] text-white bg-gradient-to-r from-primary to-[#4a7a6e] hover:shadow-lg hover:shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all overflow-hidden relative group border-0 disabled:opacity-70 disabled:cursor-not-allowed flex-shrink-0"
          className="w-full h-11 rounded-lg font-bold text-[13px] text-white bg-gradient-to-r from-primary to-[#4a7a6e] hover:shadow-lg hover:shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all overflow-hidden relative group border-0 disabled:opacity-70 disabled:cursor-not-allowed flex-shrink-0"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isCooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-white/20" />}
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isCooking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 fill-white/20" />}
            {isCooking ? `생성 중 ${genProgress}%` : 'AI 광고 생성'}
          </span>
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
          <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 skew-x-12" />
        </Button>
      </aside>

      {/* ══════ CENTER: 캔버스 미리보기 ══════ */}
      <main className={cn(
        "flex-1 min-w-0 min-h-0 border-r border-surface-container-highest/40 overflow-y-auto flex flex-col gap-4 p-4 pb-8",


        activeTab !== 'canvas' && "hidden lg:flex"
      )}>



      <main className={cn(
        "flex-1 min-w-0 min-h-0 border-r border-surface-container-highest/40 overflow-y-auto flex flex-col gap-4 p-4 pb-8",


        activeTab !== 'canvas' && "hidden lg:flex"
      )}>




        {/* 비율 탭 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <h3 className="text-[11px] font-bold text-on-surface/50 uppercase tracking-wider">디자인 미리보기</h3>
          <div className="bg-white p-1 rounded-full flex justify-center gap-1 border border-surface-container-highest/60 shadow-sm overflow-x-auto no-scrollbar max-w-full mx-auto md:mx-0">

          <div className="bg-white p-1 rounded-full flex justify-center gap-1 border border-surface-container-highest/60 shadow-sm overflow-x-auto no-scrollbar max-w-full mx-auto md:mx-0">

            {ASPECT_RATIOS.map((r, i) => (
              <button key={r.id} onClick={() => handleRatioChange(i)}
                className={cn(
                  'px-3.5 py-1.5 text-[10px] font-bold rounded-full transition-all whitespace-nowrap border border-transparent',
                  'px-3.5 py-1.5 text-[10px] font-bold rounded-full transition-all whitespace-nowrap border border-transparent',
                  activeRatioIdx === i
                    ? 'bg-primary/5 border-primary text-primary'
                    : 'text-on-surface/50 hover:bg-primary/[0.04] hover:text-primary hover:border-primary/30'
                    : 'text-on-surface/50 hover:bg-primary/[0.04] hover:text-primary hover:border-primary/30'
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
            style={{ width: '100%', maxWidth: `${containerWidth}px` }}
            style={{ width: '100%', maxWidth: `${containerWidth}px` }}
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
                className="w-9 h-9 rounded-full border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                className="w-9 h-9 rounded-full border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                onClick={() => updateSelectedTextStyle({ fontSize: -2 }, true)}>
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="icon"
                className="w-9 h-9 rounded-full border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                className="w-9 h-9 rounded-full border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                onClick={() => updateSelectedTextStyle({ fontSize: 2 }, true)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="relative flex-1">
              <select
                value={platformTexts[activeRatioIdx]?.fontFamily || 'Jua'}
                className="appearance-none bg-surface-container-lowest border border-surface-container-highest/70 h-9 text-[12px] font-bold px-3 pr-8 rounded-full outline-none w-full cursor-pointer text-on-surface shadow-sm"
                className="appearance-none bg-surface-container-lowest border border-surface-container-highest/70 h-9 text-[12px] font-bold px-3 pr-8 rounded-full outline-none w-full cursor-pointer text-on-surface shadow-sm"
                onChange={(e) => updateSelectedTextStyle({ fontFamily: e.target.value })}>
                <option value="Jua">주아체</option>
                <option value="Black Han Sans">블랙 한산스</option>
                <option value="Hahmlet">함렛</option>
                <option value="Do Hyeon">도현체</option>
                <option value="Nanum Myeongjo">나눔명조</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <SectionHeading>글자 색</SectionHeading>
              <SectionHeading>글자 색</SectionHeading>
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
              <SectionHeading>테두리 색</SectionHeading>
              <SectionHeading>테두리 색</SectionHeading>
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
        <div className="flex justify-center md:justify-end mt-2">
          <Button
            onClick={handleFinalExport}
            disabled={isExporting || !generatedImage}
            className="w-full md:w-[224px] h-11 rounded-full font-bold text-[13px] text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all overflow-hidden relative group border border-primary/20 disabled:opacity-60 disabled:bg-primary/80 disabled:cursor-not-allowed flex-shrink-0"

          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              에셋 라이브러리에 저장
            </span>
          </Button>
        </div>
        <div className="flex justify-center md:justify-end mt-2">
          <Button
            onClick={handleFinalExport}
            disabled={isExporting || !generatedImage}
            className="w-full md:w-[224px] h-11 rounded-full font-bold text-[13px] text-white bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all overflow-hidden relative group border border-primary/20 disabled:opacity-60 disabled:bg-primary/80 disabled:cursor-not-allowed flex-shrink-0"

          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              에셋 라이브러리에 저장
            </span>
          </Button>
        </div>
      </main>

      {/* ══════ RIGHT: 생성 히스토리 ══════ */}
      <aside className={cn(
        "w-full lg:w-72 flex-1 lg:flex-none min-h-0 flex flex-col transition-all overflow-y-auto pb-8",

        activeTab !== 'history' && "hidden lg:flex"
      )}>




        <div className="flex-shrink-0 px-4 pt-4 border-b border-surface-container-highest/40">
          <SectionHeading>생성 히스토리</SectionHeading>
      <aside className={cn(
        "w-full lg:w-72 flex-1 lg:flex-none min-h-0 flex flex-col transition-all overflow-y-auto pb-8",

        activeTab !== 'history' && "hidden lg:flex"
      )}>




        <div className="flex-shrink-0 px-4 pt-4 border-b border-surface-container-highest/40">
          <SectionHeading>생성 히스토리</SectionHeading>
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
                  className="absolute bottom-1.5 right-1.5 px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white text-[9px] font-bold rounded-full backdrop-blur-sm transition-all"
                  className="absolute bottom-1.5 right-1.5 px-2.5 py-1 bg-black/60 hover:bg-black/80 text-white text-[9px] font-bold rounded-full backdrop-blur-sm transition-all"
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
                      className="flex-1 h-7 rounded-full text-[9px] font-bold border-surface-container-highest/70 text-on-surface/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
                      className="flex-1 h-7 rounded-full text-[9px] font-bold border-surface-container-highest/70 text-on-surface/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
                      이미지에 적용
                    </Button>
                    <Button variant="outline" size="icon"
                      onClick={() => { navigator.clipboard.writeText(item.copy); toast.success('복사되었습니다.'); }}
                      className="w-7 h-7 rounded-full border-surface-container-highest/70 text-on-surface/50 hover:text-primary">
                      className="w-7 h-7 rounded-full border-surface-container-highest/70 text-on-surface/50 hover:text-primary">
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
                    className="w-full h-7 rounded-full text-[9px] font-bold border-surface-container-highest/70 text-on-surface/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
                    className="w-full h-7 rounded-full text-[9px] font-bold border-surface-container-highest/70 text-on-surface/60 hover:bg-primary/5 hover:text-primary hover:border-primary/30">
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
