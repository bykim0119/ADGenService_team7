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
  Send,
  Bot,
  Sparkles,
} from "lucide-react";
import { Canvas, Textbox, FabricImage, Shadow } from "fabric";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1', ratio: 1 / 1, class: 'aspect-square' },
  { id: '9:16', name: '9:16', ratio: 9 / 16, class: 'aspect-[9/16]' },
  { id: '16:9', name: '16:9', ratio: 16 / 9, class: 'aspect-video' },
  { id: '21:9', name: '21:9', ratio: 21 / 9, class: 'aspect-[21/9]' },
];

const INITIAL_PREVIEW_IMG =
  "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&q=80&w=1080&h=1080";

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
  { name: '소프트 베이지', color: '#D6D3D1' },
];

/* ─── Types ─── */
type ChatMsg = {
  id: string;
  role: 'user' | 'ai';
  text?: string;
  image?: string;
  copy?: string;
  tags?: string[];
  progress?: number;
  status?: 'thinking' | 'done' | 'error';
  errorMsg?: string;
};

/* ─── Helper Components ─── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[10px] font-bold tracking-[0.05em] uppercase text-on-surface/50 mb-3">
      {children}
    </h2>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-bold text-on-surface/80 tracking-tight block mb-1.5">
      {children}
    </label>
  );
}

/* ─── Progress label helper ─── */
function progressLabel(pct: number): string {
  if (pct < 5) return "준비 중...";
  if (pct < 15) return "모델 로딩...";
  if (pct < 91) return `이미지 생성 중... (${pct}%)`;
  return "후처리 중...";
}

/* ─── Main Component ─── */
export default function EditorPage() {
  const router = useRouter();

  /* Chat state */
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  /* Canvas / design state */
  const [platformTexts, setPlatformTexts] = useState<Record<number, any>>({});
  const [previewImage, setPreviewImage] = useState(INITIAL_PREVIEW_IMG);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [activeRatioIdx, setActiveRatioIdx] = useState(0);
  const [restaurantName, setRestaurantName] = useState('');

  /* Settings */
  const [categoryKey, setCategoryKey] = useState('food');
  const [themeKey, setThemeKey] = useState('realistic');
  const [ipAdapterWeight, setIpAdapterWeight] = useState(0.7);
  const [hasProductImage, setHasProductImage] = useState(false);

  /* Refs */
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<Canvas | null>(null);
  const fabricCanvasElRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adProductFileRef = useRef<File | null>(null);
  const activeRatioIdxRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatHistoryRef = useRef<Array<{ user_input: string; copy: string; message: string }>>([]);

  useEffect(() => { activeRatioIdxRef.current = activeRatioIdx; }, [activeRatioIdx]);

  /* Auto-scroll when messages change */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMsgs]);

  /* ─── Canvas helpers ─── */
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

  const updateCanvasBackground = async (overrideData?: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    (canvas as any)._isUpdatingInternally = true;

    const imgUrl = generatedImage || previewImage;
    const ratio = ASPECT_RATIOS[activeRatioIdx];
    const containerWidth = 420;
    let targetHeight = containerWidth;
    if (ratio.id === '9:16') targetHeight = containerWidth * (16 / 9);
    if (ratio.id === '16:9') targetHeight = containerWidth * (9 / 16);
    if (ratio.id === '21:9') targetHeight = containerWidth * (9 / 21);

    const needsBgUpdate =
      !canvas.backgroundImage ||
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
        selectable: false, evented: false,
      });
      img.filters = [];
      canvas.backgroundImage = img;
      canvas.requestRenderAll();
    }

    canvas.getObjects().forEach(obj => {
      if ((obj as any).data?.isTextLayer) canvas.remove(obj);
    });

    const canvasState = platformTexts[activeRatioIdx] || {};
    const baseFontSize = canvasState.fontSize || (ASPECT_RATIOS[activeRatioIdx].id === '9:16' ? 42 : 36);
    const rawFont = canvasState.fontFamily || 'Jua';
    const fontToUse =
      typeof rawFont === 'string' && rawFont.includes(' ') && !rawFont.includes("'")
        ? `'${rawFont}'`
        : rawFont;

    try { await document.fonts.load(`1em ${fontToUse}`); } catch { /* ignore */ }

    const shadowEffect = new Shadow({ color: 'rgba(0,0,0,0.5)', blur: 15, offsetX: 2, offsetY: 2 });
    const commonStyles = {
      fontFamily: fontToUse || 'sans-serif',
      fill: canvasState.fill || '#FFFFFF',
      stroke: canvasState.stroke || '#1A1A1A',
      strokeWidth: 4, paintFirst: 'stroke' as const,
      textAlign: 'center' as const, originX: 'center' as const, originY: 'bottom' as const,
      left: containerWidth / 2, lineHeight: 1.3, shadow: shadowEffect,
      objectCaching: false, centeredScaling: true,
    };
    const modernControlProps = {
      borderColor: '#FFFFFF', cornerColor: '#FFFFFF', cornerSize: 8,
      transparentCorners: false, padding: 10, hasRotatingPoint: false,
      selectable: true, evented: true, data: { isTextLayer: true },
    };

    const bottomBase = targetHeight * 0.92;
    const hashTop = bottomBase;
    const brandTop = hashTop - baseFontSize * 0.8;
    const phraseTop = brandTop - baseFontSize * 1.5;

    const textLayers: any[] = [];
    if (canvasState.text) {
      const pos = canvasState.phrasePos || { top: phraseTop, left: containerWidth / 2 };
      textLayers.push(new Textbox(canvasState.text.trim(), {
        ...commonStyles, ...modernControlProps,
        data: { ...modernControlProps.data, id: 'phrase' },
        top: pos.top, left: pos.left,
        fontSize: baseFontSize * 0.5, width: containerWidth - 20, textAlign: 'center',
      }));
    }
    if (canvasState.brand) {
      const pos = canvasState.brandPos || { top: brandTop, left: containerWidth / 2 };
      textLayers.push(new Textbox(canvasState.brand.trim(), {
        ...commonStyles, ...modernControlProps,
        data: { ...modernControlProps.data, id: 'brand' },
        top: pos.top, left: pos.left,
        fontSize: baseFontSize, fontWeight: 'bold', strokeWidth: 6,
        width: containerWidth - 20, textAlign: 'center',
      }));
    }
    if (canvasState.hashtags) {
      const pos = canvasState.hashPos || { top: hashTop, left: containerWidth / 2 };
      textLayers.push(new Textbox(canvasState.hashtags.trim(), {
        ...commonStyles, ...modernControlProps,
        data: { ...modernControlProps.data, id: 'hash' },
        top: pos.top, left: pos.left,
        fontSize: baseFontSize * 0.45, width: containerWidth - 20, textAlign: 'center',
      }));
    }

    textLayers.forEach(obj => { canvas.add(obj); obj.setCoords(); });
    canvas.requestRenderAll();
    setTimeout(() => {
      canvas.getObjects().forEach(obj => {
        if ((obj as any).data?.isTextLayer) obj.setCoords();
      });
      canvas.requestRenderAll();
    }, 150);
    (canvas as any)._isUpdatingInternally = false;
  };

  const addTextToCanvas = (combinedText: string) => {
    const hashtagRegex = /#[^\s#]+/g;
    const hashes = (combinedText.match(hashtagRegex) || []).join(' ');
    const mainTextOnly = combinedText.replace(hashtagRegex, '').replace(/[\[\]【】]/g, '').trim();

    let optimizedFontSize = 44;
    const textLength = mainTextOnly.length;
    if (textLength > 15) optimizedFontSize = 38;
    if (textLength > 25) optimizedFontSize = 32;
    if (textLength > 40) optimizedFontSize = 26;
    if (textLength > 60) optimizedFontSize = 20;

    setPlatformTexts(prev => {
      const next = { ...prev };
      ASPECT_RATIOS.forEach((_, idx) => {
        next[idx] = {
          ...(next[idx] || {}),
          text: mainTextOnly,
          brand: restaurantName,
          hashtags: hashes,
          fontSize: optimizedFontSize,
          isManualEdit: true,
        };
      });
      return next;
    });
    toast.success("카피가 캔버스에 적용되었습니다.");
  };

  const applyTagsToCanvas = (tags: string[]) => {
    const hashtagStr = tags
      .map(t => (t.startsWith('#') ? t : `#${t}`))
      .join(' ');
    syncCanvasToState();
    setPlatformTexts(prev => {
      const next = { ...prev };
      ASPECT_RATIOS.forEach((_, idx) => {
        next[idx] = { ...(next[idx] || {}), hashtags: hashtagStr, isManualEdit: true };
      });
      return next;
    });
    toast.success("해시태그가 이미지에 적용되었습니다.");
  };

  const updateSelectedTextStyle = (props: any, relative = false) => {
    syncCanvasToState();
    setPlatformTexts(prev => {
      const current = prev[activeRatioIdx] || {};
      const nextFontSize =
        relative && props.fontSize
          ? (current.fontSize || 40) + props.fontSize
          : props.fontSize || current.fontSize;
      return {
        ...prev,
        [activeRatioIdx]: { ...current, ...props, fontSize: nextFontSize, textAlign: 'center', isManualEdit: true },
      };
    });
  };

  /* ─── Chat functions ─── */
  const pollForMsg = (jobId: string, msgId: string, inputText: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${jobId}`);
        const data = await res.json();

        if (typeof data.progress === 'number') {
          setChatMsgs(prev =>
            prev.map(m => m.id === msgId ? { ...m, progress: data.progress } : m)
          );
        }

        if (data.status === 'done' && data.image) {
          clearInterval(pollingRef.current!);
          const tags: string[] = data.tags || [];
          const copy: string = data.copy || '';
          const imageDataUrl = `data:image/png;base64,${data.image}`;

          setChatMsgs(prev =>
            prev.map(m =>
              m.id === msgId
                ? { ...m, status: 'done', progress: 100, image: imageDataUrl, copy, tags }
                : m
            )
          );

          /* Auto-apply generated image to canvas */
          setGeneratedImage(imageDataUrl);

          if (copy) {
            chatHistoryRef.current = [
              ...chatHistoryRef.current,
              { user_input: inputText, copy, message: data.message || '' },
            ];
          }

          toast.success('AI 광고 생성 완료!');
          setIsSending(false);
        } else if (data.status === 'failed_input') {
          clearInterval(pollingRef.current!);
          setChatMsgs(prev =>
            prev.map(m =>
              m.id === msgId
                ? { ...m, status: 'error', errorMsg: '입력 이미지를 확인해주세요: ' + (data.detail || '') }
                : m
            )
          );
          setIsSending(false);
        } else if (data.status === 'failed_system' || data.status === 'error') {
          clearInterval(pollingRef.current!);
          setChatMsgs(prev =>
            prev.map(m =>
              m.id === msgId ? { ...m, status: 'error', errorMsg: '서버 오류가 발생했습니다.' } : m
            )
          );
          setIsSending(false);
        }
      } catch {
        clearInterval(pollingRef.current!);
        setChatMsgs(prev =>
          prev.map(m =>
            m.id === msgId ? { ...m, status: 'error', errorMsg: '상태 확인 중 오류 발생' } : m
          )
        );
        setIsSending(false);
      }
    }, 2000);
  };

  const handleSend = async () => {
    if (!chatInput.trim() || isSending) return;

    const now = Date.now().toString(36);
    const userMsgId = now + Math.random().toString(36).slice(2);
    const aiMsgId = now + Math.random().toString(36).slice(2) + '_ai';
    const inputText = chatInput.trim();

    setChatMsgs(prev => [
      ...prev,
      { id: userMsgId, role: 'user', text: inputText },
      { id: aiMsgId, role: 'ai', status: 'thinking', progress: 0 },
    ]);
    setChatInput('');
    setIsSending(true);

    try {
      const formData = new FormData();
      formData.append('user_input', inputText);
      formData.append('category_key', categoryKey);
      formData.append('theme_key', themeKey);
      formData.append('history', JSON.stringify(chatHistoryRef.current));
      if (adProductFileRef.current) {
        formData.append('product_image', adProductFileRef.current);
        formData.append('ip_adapter_weight', String(ipAdapterWeight));
      }

      const response = await fetch('/api/generate', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok || !data.job_id) {
        setChatMsgs(prev =>
          prev.map(m =>
            m.id === aiMsgId
              ? { ...m, status: 'error', errorMsg: data.detail || '광고 생성 요청 실패' }
              : m
          )
        );
        setIsSending(false);
        return;
      }

      pollForMsg(data.job_id, aiMsgId, inputText);
    } catch (e) {
      console.error('Send Error:', e);
      setChatMsgs(prev =>
        prev.map(m =>
          m.id === aiMsgId ? { ...m, status: 'error', errorMsg: '서버 통신 실패' } : m
        )
      );
      setIsSending(false);
    }
  };

  /* ─── Export ─── */
  const getLatestCopy = () => {
    for (let i = chatMsgs.length - 1; i >= 0; i--) {
      const m = chatMsgs[i];
      if (m.role === 'ai' && m.status === 'done' && m.copy) return m.copy;
    }
    return '';
  };

  const handleFinalExport = async () => {
    if (!canvasRef.current || !generatedImage) return;
    syncCanvasToState();
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const latestCopy = getLatestCopy();
      const { data: campaign } = await supabase.from('campaigns').insert({
        user_id: user.id,
        menu_name: chatHistoryRef.current[chatHistoryRef.current.length - 1]?.user_input || '광고',
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
                user_id: user.id,
                campaign_id: campaign.id,
                generated_image_url: url,
                platform: ratio.name,
                ad_copy: latestCopy,
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
    } finally {
      setIsExporting(false);
    }
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
        width: 420, height: 420,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });
      canvasRef.current = fc;
      fc.on('object:modified', syncCanvasToState);
      fc.on('selection:created', syncCanvasToState);
      fc.on('selection:updated', syncCanvasToState);
      const loadFonts = async () => {
        try {
          await Promise.all([
            document.fonts.load('1em "Jua"'),
            document.fonts.load('1em "Black Han Sans"'),
            document.fonts.load('1em "Hahmlet"'),
            document.fonts.load('1em "Do Hyeon"'),
          ]);
          updateCanvasBackground();
        } catch {
          updateCanvasBackground();
        }
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
      {/* ════════════════════ LEFT PANEL ════════════════════ */}
      <div className="w-[480px] flex-shrink-0 border-r border-surface-container-highest/40 overflow-y-auto flex flex-col gap-4 p-5 bg-surface-container-lowest/30">

        {/* 제품 이미지 업로드 */}
        <Card
          onClick={() => fileInputRef.current?.click()}
          className="p-4 rounded-xl bg-white border border-surface-container-highest/60 border-dashed hover:border-primary transition-all duration-300 cursor-pointer active:scale-[0.98] shadow-sm hover:shadow-md group"
        >
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                adProductFileRef.current = file;
                setHasProductImage(true);
                const r = new FileReader();
                r.onload = (ev) => {
                  setPreviewImage(ev.target?.result as string);
                  setGeneratedImage(null);
                };
                r.readAsDataURL(file);
              }
            }}
          />
          <div className="flex items-center gap-3 py-1">
            <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-on-surface/40 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-on-surface">
                {hasProductImage ? '제품 이미지 변경' : '제품 이미지 업로드 (선택)'}
              </p>
              <p className="text-[11px] font-medium text-on-surface/50 mt-0.5">JPG, PNG · 최대 10MB</p>
            </div>
          </div>
        </Card>

        {/* 광고 기본 정보 */}
        <Card className="p-4 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
          <SectionHeading>광고 기본 정보</SectionHeading>
          <div className="flex flex-col gap-5">
            {/* 업종 */}
            <div>
              <FieldLabel>업종 카테고리</FieldLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {CATEGORIES.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryKey(c.id)}
                    className={cn(
                      'py-2 px-2 rounded-lg text-[11px] font-bold border transition-all duration-200 whitespace-nowrap',
                      idx === 4 && 'col-span-3',
                      categoryKey === c.id
                        ? 'bg-primary/5 border-primary text-primary shadow-sm'
                        : 'bg-surface-container-lowest border-surface-container-highest/60 text-on-surface/60 hover:bg-primary/5 hover:border-primary/30'
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 테마 */}
            <div>
              <FieldLabel>디자인 테마</FieldLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeKey(t.id)}
                    className={cn(
                      'py-2 rounded-lg text-[11px] font-bold border transition-all duration-200',
                      themeKey === t.id
                        ? 'bg-primary/5 border-primary text-primary shadow-sm'
                        : 'bg-surface-container-lowest border-surface-container-highest/60 text-on-surface/60 hover:bg-primary/5 hover:border-primary/30'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* IP Adapter 강도 */}
            {hasProductImage && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <FieldLabel>이미지 반영 강도</FieldLabel>
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
                <div className="flex justify-between text-[9px] text-on-surface/30 font-bold mt-1">
                  <span>프롬프트 위주</span>
                  <span>이미지 위주</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 캔버스 미리보기 */}
        <Card className="p-4 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <SectionHeading>미리보기</SectionHeading>
            <div className="flex gap-1">
              {ASPECT_RATIOS.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => handleRatioChange(i)}
                  className={cn(
                    'px-2 py-1 text-[10px] font-bold rounded-md transition-all duration-200 border border-transparent',
                    activeRatioIdx === i
                      ? 'bg-primary/5 border-primary text-primary'
                      : 'text-on-surface/40 hover:bg-primary/5 hover:text-primary hover:border-primary/30'
                  )}
                >
                  {r.id}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-center">
            <div
              className={cn(
                'bg-white rounded-xl shadow-md overflow-hidden border border-surface-container-highest/60 relative transition-all duration-500',
                ASPECT_RATIOS[activeRatioIdx].class
              )}
              style={{ width: '100%', maxWidth: '420px' }}
            >
              <div className="w-full h-full flex items-center justify-center overflow-hidden bg-surface-container-low">
                <canvas ref={fabricCanvasElRef} />
              </div>
            </div>
          </div>
        </Card>

        {/* 텍스트 스타일링 */}
        <Card className="p-4 rounded-xl bg-white border border-surface-container-highest/60 shadow-sm">
          <SectionHeading>텍스트 스타일링</SectionHeading>

          {/* 크기 + 폰트 */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 rounded-lg border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                onClick={() => updateSelectedTextStyle({ fontSize: -2 }, true)}
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-9 h-9 rounded-lg border-surface-container-highest/70 text-on-surface/60 hover:text-primary active:scale-[0.9] transition-all"
                onClick={() => updateSelectedTextStyle({ fontSize: 2 }, true)}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="relative flex-1">
              <select
                value={platformTexts[activeRatioIdx]?.fontFamily || 'Jua'}
                className="appearance-none bg-surface-container-lowest border border-surface-container-highest/70 h-9 text-[12px] font-bold px-3 pr-8 rounded-lg outline-none w-full cursor-pointer text-on-surface shadow-sm"
                onChange={(e) => updateSelectedTextStyle({ fontFamily: e.target.value })}
              >
                <option value="Jua">주아체</option>
                <option value="Black Han Sans">블랙 한산스</option>
                <option value="Hahmlet">함렛</option>
                <option value="Do Hyeon">도현체</option>
                <option value="Nanum Myeongjo">나눔명조</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface/30 pointer-events-none" />
            </div>
          </div>

          {/* 색상 팔레트 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-1 h-2.5 bg-primary rounded-full" />
                <span className="text-[10px] font-bold text-on-surface/50 uppercase">글자 색</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LUXURY_PALETTE.map(p => (
                  <button
                    key={p.color}
                    onClick={() => updateSelectedTextStyle({ fill: p.color })}
                    className={cn(
                      'w-6 h-6 rounded-full border hover:scale-110 active:scale-90 transition-all shadow-sm',
                      p.color === '#FFFFFF' ? 'border-surface-container-highest/70' : 'border-white'
                    )}
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-1 h-2.5 bg-secondary rounded-full" />
                <span className="text-[10px] font-bold text-on-surface/50 uppercase">테두리 색</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {LUXURY_PALETTE.map(p => (
                  <button
                    key={'s' + p.color}
                    onClick={() => updateSelectedTextStyle({ stroke: p.color, strokeWidth: 8 })}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 hover:scale-110 active:scale-90 transition-all shadow-sm bg-transparent',
                    )}
                    style={{ borderColor: p.color }}
                    title={p.name}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* 에셋 저장 */}
        <Button
          onClick={handleFinalExport}
          disabled={isExporting || !generatedImage}
          className="w-full h-11 rounded-xl font-bold text-[13px] text-white bg-primary hover:bg-primary/95 shadow-md shadow-primary/10 active:scale-[0.98] transition-all"
        >
          <span className="flex items-center justify-center gap-2">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            에셋 라이브러리에 저장
          </span>
        </Button>
      </div>

      {/* ════════════════════ RIGHT PANEL (Chat) ════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">

        {/* Chat Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-surface-container-highest/40 flex items-center gap-3 bg-white">
          <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-on-surface">AI 광고 어시스턴트</h2>
            <p className="text-[11px] text-on-surface/50">카테고리·테마를 설정하고 광고 컨셉을 입력하세요</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* Empty state */}
          {chatMsgs.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20 text-center">
              <div className="w-14 h-14 bg-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center">
                <Bot className="w-7 h-7 text-primary/60" />
              </div>
              <div>
                <p className="text-[15px] font-bold text-on-surface/70">아직 생성된 광고가 없어요</p>
                <p className="text-[12px] text-on-surface/40 mt-1">
                  왼쪽에서 카테고리·테마를 선택하고<br />아래 입력창에 광고 컨셉을 입력해보세요
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['여름 한정 신메뉴 프로모션', '감성적인 뷰티 광고', '세련된 IT 앱 광고'].map(ex => (
                  <button
                    key={ex}
                    onClick={() => setChatInput(ex)}
                    className="px-3 py-1.5 rounded-full border border-surface-container-highest/70 text-[11px] font-bold text-on-surface/50 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {chatMsgs.map(msg => (
            <div
              key={msg.id}
              className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {/* User bubble */}
              {msg.role === 'user' && (
                <div className="max-w-[70%] bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              )}

              {/* AI bubble */}
              {msg.role === 'ai' && (
                <div className="max-w-[85%] flex flex-col gap-2">

                  {/* Thinking state */}
                  {msg.status === 'thinking' && (
                    <Card className="p-4 rounded-2xl rounded-tl-sm border-surface-container-highest/60 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <Bot className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-[12px] font-bold text-on-surface/60">
                          {progressLabel(msg.progress || 0)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${msg.progress || 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-on-surface/30 font-bold mt-1.5 text-right">
                        {msg.progress || 0}%
                      </p>
                    </Card>
                  )}

                  {/* Done state */}
                  {msg.status === 'done' && (
                    <>
                      {/* Generated image */}
                      {msg.image && (
                        <div className="relative rounded-2xl rounded-tl-sm overflow-hidden shadow-md border border-surface-container-highest/40">
                          <img
                            src={msg.image}
                            alt="Generated advertisement"
                            className="w-full block"
                          />
                          <button
                            onClick={() => {
                              setGeneratedImage(msg.image!);
                              toast.success('이미지가 캔버스에 적용되었습니다.');
                            }}
                            className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white text-[10px] font-bold rounded-lg backdrop-blur-sm transition-all"
                          >
                            캔버스에 적용
                          </button>
                        </div>
                      )}

                      {/* Copy */}
                      {msg.copy && (
                        <Card className="p-4 rounded-xl border-surface-container-highest/60 shadow-sm">
                          <p className="text-[10px] font-bold text-on-surface/40 uppercase mb-2">광고 카피</p>
                          <p className="text-[13px] leading-relaxed text-on-surface/80 whitespace-pre-wrap">
                            {msg.copy}
                          </p>
                          <div className="flex gap-2 mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addTextToCanvas(msg.copy!)}
                              className="flex-1 h-8 rounded-lg border-surface-container-highest/70 text-on-surface/60 text-[10px] font-bold hover:bg-primary/5 hover:text-primary hover:border-primary/30 active:scale-[0.96] transition-all"
                            >
                              이미지에 적용
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                navigator.clipboard.writeText(msg.copy!);
                                toast.success('카피가 복사되었습니다.');
                              }}
                              className="w-8 h-8 rounded-lg border-surface-container-highest/70 text-on-surface/50 hover:text-primary active:scale-[0.96] transition-all"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </Card>
                      )}

                      {/* Hashtags */}
                      {msg.tags && msg.tags.length > 0 && (
                        <Card className="p-4 rounded-xl border-surface-container-highest/60 shadow-sm">
                          <p className="text-[10px] font-bold text-on-surface/40 uppercase mb-2">
                            추천 해시태그
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {msg.tags.map(t => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="text-[10px] py-1 px-2.5 border-surface-container-highest/70 text-on-surface/60 font-bold rounded-full cursor-default"
                              >
                                {t.startsWith('#') ? t : `#${t}`}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => applyTagsToCanvas(msg.tags!)}
                            className="w-full h-8 rounded-lg border-surface-container-highest/70 text-on-surface/60 text-[10px] font-bold hover:bg-primary/5 hover:text-primary hover:border-primary/30 active:scale-[0.96] transition-all"
                          >
                            이미지에 적용
                          </Button>
                        </Card>
                      )}
                    </>
                  )}

                  {/* Error state */}
                  {msg.status === 'error' && (
                    <Card className="p-4 rounded-2xl rounded-tl-sm border-destructive/30 bg-destructive/5 shadow-sm">
                      <p className="text-[12px] text-destructive font-medium">{msg.errorMsg}</p>
                    </Card>
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-surface-container-highest/40 bg-white">
          <div className="flex gap-2 items-end">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="광고 컨셉을 입력하세요... (예: 여름 한정 신메뉴 프로모션)"
              className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-surface-container-lowest border-surface-container-highest/60 rounded-xl text-[13px] leading-relaxed placeholder:text-on-surface/30 focus:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 transition-all px-4 py-3"
              disabled={isSending}
            />
            <Button
              onClick={handleSend}
              disabled={isSending || !chatInput.trim()}
              className="h-11 w-11 rounded-xl flex-shrink-0 bg-primary hover:bg-primary/95 text-white shadow-md shadow-primary/20 active:scale-[0.97] transition-all p-0"
            >
              {isSending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-on-surface/35 mt-1.5 px-0.5">
            Enter로 전송 · Shift+Enter로 줄바꿈 · 약 30~60초 소요
          </p>
        </div>
      </div>
    </div>
  );
}
