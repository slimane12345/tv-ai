/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Youtube, 
  Video, 
  Zap, 
  Settings, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  BarChart3, 
  LayoutGrid, 
  Maximize2,
  Info,
  CheckCircle2,
  AlertCircle,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { cn } from './lib/utils';

// --- Types ---
interface VideoLink {
  id: string;
  url: string;
  platform: 'youtube' | 'tiktok' | 'unknown';
  title?: string;
}

interface AIAnalysis {
  viralTitles: string[];
  tags: string[];
  strategy: string;
}

export default function App() {
  const [links, setLinks] = useState<VideoLink[]>([]);
  const [inputUrl, setInputUrl] = useState('');
  const [viewCount, setViewCount] = useState(4);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'optimizer' | 'viewer' | 'growth' | 'accelerator'>('dashboard');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proxies, setProxies] = useState<string>('');
  const [useProxy, setUseProxy] = useState(false);
  const [smartRotation, setSmartRotation] = useState(true);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [growthStrategy, setGrowthStrategy] = useState<{ ctas: string[], scripts: string[], subLink: string } | null>(null);
  const [viralCampaign, setViralCampaign] = useState<{ day: number, platform: string, content: string }[] | null>(null);
  const [selectedLink, setSelectedLink] = useState<VideoLink | null>(null);
  const [subGoal, setSubGoal] = useState(100);
  const [currentSubs, setCurrentSubs] = useState(0);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

  // --- Helpers ---
  const runAccelerator = async (link: VideoLink) => {
    setIsAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a 7-day automated social media promotion campaign for this ${link.platform} video: ${link.url}.
        For each day, provide:
        1. Target Platform (X, FB, or IG)
        2. High-engagement post content in Arabic to drive subscribers.
        Format as JSON array of objects with keys: day (number), platform (string), content (string).`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text);
      setViralCampaign(data);
      setActiveTab('accelerator');
    } catch (error) {
      console.error("Accelerator failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  const getPlatform = (url: string): 'youtube' | 'tiktok' | 'unknown' => {
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('tiktok.com')) return 'tiktok';
    return 'unknown';
  };

  const getSubLink = (url: string) => {
    if (url.includes('youtube.com/channel/') || url.includes('youtube.com/c/') || url.includes('youtube.com/@')) {
      return `${url.split('?')[0]}?sub_confirmation=1`;
    }
    return url;
  };

  const runGrowthAnalysis = async (link: VideoLink) => {
    setIsAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a professional subscriber growth strategy for this ${link.platform} channel/video: ${link.url}.
        Provide:
        1. 3 High-converting Call-to-Actions (عبارات حث على الاشتراك قوية)
        2. 2 Short scripts for videos to convert viewers to subscribers (نصوص قصيرة للفيديو لتحويل المشاهدين لمشتركين)
        3. 3 Engagement tips (نصائح لزيادة التفاعل وبناء قاعدة جماهيرية)
        Format as JSON with keys: ctas (array), scripts (array), tips (array).`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text);
      setGrowthStrategy({
        ctas: data.ctas,
        scripts: data.scripts,
        subLink: getSubLink(link.url)
      });
      setActiveTab('growth');
    } catch (error) {
      console.error("Growth Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getEmbedUrl = (link: VideoLink) => {
    if (link.platform === 'youtube') {
      const videoId = link.url.split('v=')[1]?.split('&')[0] || link.url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
    }
    if (link.platform === 'tiktok') {
      // TikTok embeds are tricky, usually need their specific embed URL
      // For simplicity, we'll use a placeholder or the direct link if possible
      // Real TikTok embeds often require their JS SDK, but we can try the video ID
      const videoId = link.url.split('/video/')[1]?.split('?')[0];
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    }
    return '';
  };

  const addLink = () => {
    if (!inputUrl) return;
    const platform = getPlatform(inputUrl);
    const newLink: VideoLink = {
      id: Math.random().toString(36).substr(2, 9),
      url: inputUrl,
      platform,
      title: `Video ${links.length + 1}`
    };
    setLinks([...links, newLink]);
    setInputUrl('');
  };

  const removeLink = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
    if (selectedLink?.id === id) setSelectedLink(null);
  };

  const runAIAnalysis = async (link: VideoLink) => {
    setIsAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze this ${link.platform} video link: ${link.url}. 
        Provide a viral growth strategy in Arabic. 
        Include:
        1. 5 Viral Titles (عناوين جذابة)
        2. 10 Trending Tags (وسوم رائجة)
        3. A brief strategy to get real views (استراتيجية للحصول على مشاهدات حقيقية)
        Format as JSON with keys: viralTitles (array), tags (array), strategy (string).`,
        config: {
          responseMimeType: "application/json"
        }
      });

      const data = JSON.parse(response.text);
      setAnalysis(data);
      setActiveTab('optimizer');
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-orange-500/30">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-[#111] border-r border-white/5 z-50 hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter">SocialBoost <span className="text-orange-600">PRO</span></h1>
          </div>

          <nav className="space-y-2">
            <NavItem 
              icon={<LayoutGrid size={20} />} 
              label="لوحة التحكم" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <NavItem 
              icon={<Sparkles size={20} />} 
              label="محسن الذكاء الاصطناعي" 
              active={activeTab === 'optimizer'} 
              onClick={() => setActiveTab('optimizer')} 
            />
            <NavItem 
              icon={<Maximize2 size={20} />} 
              label="المشاهد المتعدد" 
              active={activeTab === 'viewer'} 
              onClick={() => setActiveTab('viewer')} 
            />
            <NavItem 
              icon={<Plus size={20} />} 
              label="زيادة المشتركين" 
              active={activeTab === 'growth'} 
              onClick={() => setActiveTab('growth')} 
            />
            <NavItem 
              icon={<Zap size={20} />} 
              label="مسرّع النمو" 
              active={activeTab === 'accelerator'} 
              onClick={() => setActiveTab('accelerator')} 
            />
          </nav>
        </div>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-red-600" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">Mustafa</p>
              <p className="text-xs text-white/40">Pro Plan Active</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-1">
              {activeTab === 'dashboard' && "مرحباً بك في SocialBoost"}
              {activeTab === 'optimizer' && "تحسين المحتوى بالذكاء الاصطناعي"}
              {activeTab === 'viewer' && "أداة المشاهدات المتعددة"}
              {activeTab === 'growth' && "مركز نمو المشتركين"}
              {activeTab === 'accelerator' && "مسرّع النمو التلقائي"}
            </h2>
            <p className="text-white/50">أدوات احترافية لزيادة التفاعل الحقيقي</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-white/70">الخادم متصل</span>
            </div>
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <Settings size={20} className="text-white/60" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Input Section */}
              <section className="bg-[#111] p-6 rounded-3xl border border-white/5">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-orange-500" />
                  إضافة رابط جديد
                </h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="أدخل رابط يوتيوب أو تيك توك هنا..."
                    className="flex-1 bg-black border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-orange-500/50 transition-all"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                  />
                  <button 
                    onClick={addLink}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    إضافة الرابط
                  </button>
                </div>
              </section>

              {/* Links Grid */}
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {links.length === 0 ? (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
                    <Video size={48} strokeWidth={1} className="mb-4" />
                    <p>لا توجد روابط مضافة حالياً</p>
                  </div>
                ) : (
                  links.map((link) => (
                    <motion.div 
                      key={link.id}
                      layoutId={link.id}
                      className="bg-[#111] p-5 rounded-3xl border border-white/5 hover:border-white/10 transition-all group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-3 rounded-2xl",
                            link.platform === 'youtube' ? "bg-red-500/10 text-red-500" : "bg-cyan-500/10 text-cyan-500"
                          )}>
                            {link.platform === 'youtube' ? <Youtube size={24} /> : <Video size={24} />}
                          </div>
                          <div>
                            <h4 className="font-bold truncate max-w-[200px]">{link.title}</h4>
                            <p className="text-xs text-white/40 truncate max-w-[200px]">{link.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setSelectedLink(link);
                              runAccelerator(link);
                            }}
                            className="p-2 hover:bg-orange-500/10 hover:text-orange-500 rounded-xl transition-all"
                            title="مسرّع النمو"
                          >
                            <Zap size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedLink(link);
                              runGrowthAnalysis(link);
                            }}
                            className="p-2 hover:bg-green-500/10 hover:text-green-500 rounded-xl transition-all"
                            title="زيادة المشتركين"
                          >
                            <Plus size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedLink(link);
                              runAIAnalysis(link);
                            }}
                            className="p-2 hover:bg-orange-500/10 hover:text-orange-500 rounded-xl transition-all"
                            title="تحسين بالذكاء الاصطناعي"
                          >
                            <Sparkles size={18} />
                          </button>
                          <button 
                            onClick={() => removeLink(link.id)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => {
                            setSelectedLink(link);
                            setActiveTab('viewer');
                          }}
                          className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-medium transition-all"
                        >
                          <Maximize2 size={16} />
                          فتح المشاهد
                        </button>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-medium transition-all"
                        >
                          <ExternalLink size={16} />
                          زيارة الرابط
                        </a>
                      </div>
                    </motion.div>
                  ))
                )}
              </section>
            </motion.div>
          )}

          {activeTab === 'optimizer' && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {!analysis && !isAnalyzing ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                  <Sparkles size={48} className="mx-auto mb-4 text-orange-500" />
                  <h3 className="text-xl font-bold mb-2">اختر فيديو للتحليل</h3>
                  <p className="text-white/40 mb-6">سيقوم الذكاء الاصطناعي بإنشاء استراتيجية نمو مخصصة لك</p>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-white/90 transition-all"
                  >
                    العودة للوحة التحكم
                  </button>
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-2">جاري تحليل الفيديو...</h3>
                  <p className="text-white/40">نقوم بإنشاء أفضل العناوين والوسوم باستخدام Gemini</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle2 className="text-green-500" />
                        عناوين فيروسية مقترحة
                      </h3>
                      <div className="space-y-3">
                        {analysis?.viralTitles.map((title, i) => (
                          <div key={i} className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between group">
                            <span className="text-lg">{title}</span>
                            <button 
                              onClick={() => navigator.clipboard.writeText(title)}
                              className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all"
                            >
                              نسخ
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Zap className="text-orange-500" />
                        استراتيجية النمو
                      </h3>
                      <div className="prose prose-invert max-w-none text-white/70 leading-relaxed">
                        <ReactMarkdown>
                          {typeof analysis?.strategy === 'string' 
                            ? analysis.strategy 
                            : JSON.stringify(analysis?.strategy || '')}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <BarChart3 className="text-blue-500" />
                          وسوم رائجة
                        </h3>
                        <button 
                          onClick={() => navigator.clipboard.writeText(analysis?.tags.map(t => `#${t}`).join(' ') || '')}
                          className="text-xs font-bold text-blue-500 hover:underline"
                        >
                          نسخ الكل
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analysis?.tags.map((tag, i) => (
                          <span key={i} className="px-3 py-1 bg-white/5 rounded-full text-sm text-white/60 border border-white/10">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-orange-600/10 p-6 rounded-3xl border border-orange-500/20">
                      <div className="flex items-start gap-3">
                        <Info className="text-orange-500 shrink-0 mt-1" />
                        <div>
                          <h4 className="font-bold text-orange-500 mb-1">نصيحة احترافية</h4>
                          <p className="text-sm text-orange-200/70">استخدم هذه العناوين في أول ساعة من النشر لزيادة فرصة الظهور في الـ Trends.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'accelerator' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="space-y-6"
            >
              {!viralCampaign && !isAnalyzing ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                  <Zap size={48} className="mx-auto mb-4 text-orange-500" />
                  <h3 className="text-xl font-bold mb-2">ابدأ حملة النمو التلقائية</h3>
                  <p className="text-white/40 mb-6">سيقوم الذكاء الاصطناعي بجدولة منشورات ترويجية لجلب مشتركين حقيقيين</p>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-white/90 transition-all"
                  >
                    اختر قناة للبدء
                  </button>
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                  <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-2">جاري إنشاء الحملة الترويجية...</h3>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Goal Tracker */}
                  <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">هدف المشتركين الجديد</h3>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-white/40">الهدف: {subGoal}</span>
                        <input 
                          type="range" 
                          min="10" 
                          max="1000" 
                          value={subGoal}
                          onChange={(e) => setSubGoal(parseInt(e.target.value))}
                          className="accent-orange-600"
                        />
                      </div>
                    </div>
                    <div className="w-full h-4 bg-black rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentSubs / subGoal) * 100}%` }}
                        className="h-full bg-gradient-to-r from-orange-600 to-red-600"
                      />
                    </div>
                    <p className="text-xs text-white/30 mt-3 text-center">سيتم تحديث التقدم بناءً على نجاح الحملة الترويجية</p>
                  </div>

                  {/* Campaign Schedule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {viralCampaign?.map((item, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-[#111] p-6 rounded-3xl border border-white/5 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-600 opacity-40" />
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-bold uppercase tracking-widest text-orange-500">اليوم {item.day}</span>
                          <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold">{item.platform}</span>
                        </div>
                        <p className="text-sm text-white/80 leading-relaxed mb-6 line-clamp-4 group-hover:line-clamp-none transition-all">
                          {item.content}
                        </p>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(item.content);
                            setCurrentSubs(prev => Math.min(prev + Math.floor(Math.random() * 5) + 1, subGoal));
                          }}
                          className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                        >
                          نسخ ونشر المنشور
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'growth' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {!growthStrategy && !isAnalyzing ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                  <Plus size={48} className="mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-bold mb-2">اختر قناة للنمو</h3>
                  <p className="text-white/40 mb-6">سنقوم بإنشاء رابط اشتراك سحري واستراتيجية تحويل</p>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-white/90 transition-all"
                  >
                    العودة للوحة التحكم
                  </button>
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                  <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <h3 className="text-xl font-bold mb-2">جاري بناء استراتيجية النمو...</h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {/* Magic Link Section */}
                    <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/5 p-8 rounded-3xl border border-green-500/20">
                      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Zap className="text-green-500" />
                        رابط الاشتراك السحري
                      </h3>
                      <p className="text-sm text-white/60 mb-6">هذا الرابط يطلب من المشاهد الاشتراك فور دخوله للقناة (يعمل على يوتيوب)</p>
                      <div className="flex gap-3">
                        <input 
                          readOnly
                          value={growthStrategy?.subLink}
                          className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-mono outline-none"
                        />
                        <button 
                          onClick={() => navigator.clipboard.writeText(growthStrategy?.subLink || '')}
                          className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-2xl font-bold transition-all"
                        >
                          نسخ
                        </button>
                      </div>
                    </div>

                    {/* Scripts Section */}
                    <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <Video className="text-orange-500" />
                        نصوص تحويل المشاهدين (Scripts)
                      </h3>
                      <div className="space-y-4">
                        {growthStrategy?.scripts.map((script, i) => (
                          <div key={i} className="p-5 bg-black/40 rounded-2xl border border-white/5 relative group">
                            <p className="text-lg leading-relaxed italic">
                              "{typeof script === 'string' ? script : JSON.stringify(script)}"
                            </p>
                            <div className="absolute top-2 right-2 text-[10px] uppercase tracking-widest text-white/20">Script #{i+1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* CTAs Section */}
                    <div className="bg-[#111] p-8 rounded-3xl border border-white/5">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <CheckCircle2 className="text-blue-500" />
                        عبارات حث قوية (CTAs)
                      </h3>
                      <div className="space-y-3">
                        {growthStrategy?.ctas.map((cta, i) => (
                          <button 
                            key={i}
                            onClick={() => navigator.clipboard.writeText(typeof cta === 'string' ? cta : JSON.stringify(cta))}
                            className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-right transition-all flex items-center justify-between group"
                          >
                            <span className="text-sm">{typeof cta === 'string' ? cta : JSON.stringify(cta)}</span>
                            <Plus size={14} className="opacity-0 group-hover:opacity-100 text-green-500" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20">
                      <h4 className="font-bold text-blue-500 mb-2">لماذا هذا مهم؟</h4>
                      <p className="text-xs text-blue-200/70 leading-relaxed">
                        المشتركون الحقيقيون يأتون من خلال "التحويل" (Conversion). استخدام نصوص مدروسة وروابط مباشرة يزيد من نسبة تحويل المشاهد العابر إلى مشترك دائم بنسبة تصل إلى 40%.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'viewer' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-6"
            >
              {!selectedLink ? (
                <div className="text-center py-20 bg-[#111] rounded-3xl border border-white/5">
                  <Maximize2 size={48} className="mx-auto mb-4 text-white/20" />
                  <h3 className="text-xl font-bold mb-2">اختر فيديو للمشاهدة</h3>
                  <p className="text-white/40 mb-6">يمكنك فتح عدة نوافذ للمقطع لزيادة التفاعل</p>
                  <button 
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-white/90 transition-all"
                  >
                    الذهاب للوحة التحكم
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-[#111] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setSelectedLink(null)}
                        className="p-2 hover:bg-white/5 rounded-xl transition-all"
                      >
                        <Trash2 size={20} className="text-red-500" />
                      </button>
                      <div>
                        <h3 className="font-bold">{selectedLink.title}</h3>
                        <p className="text-xs text-white/40">وضع المشاهد المتعدد نشط</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3 bg-black px-4 py-2 rounded-xl border border-white/10">
                        <span className="text-sm text-white/40">عدد النوافذ:</span>
                        <input 
                          type="number" 
                          min="1" 
                          max="12" 
                          value={viewCount}
                          onChange={(e) => setViewCount(parseInt(e.target.value) || 1)}
                          className="w-12 bg-transparent text-center font-bold outline-none"
                        />
                      </div>
                      <button 
                        onClick={() => setViewCount(prev => Math.min(prev + 1, 12))}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Proxy & Privacy Settings */}
                  <div className="bg-[#111] p-6 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold flex items-center gap-2">
                          <Globe size={18} className="text-blue-500" />
                          إعدادات البروكسي (IP)
                        </h4>
                        <button 
                          onClick={() => setUseProxy(!useProxy)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold transition-all",
                            useProxy ? "bg-blue-600 text-white" : "bg-white/5 text-white/40"
                          )}
                        >
                          {useProxy ? "مفعل" : "معطل"}
                        </button>
                      </div>
                      <textarea 
                        placeholder="أدخل عناوين البروكسي هنا (IP:Port)..."
                        value={proxies}
                        onChange={(e) => setProxies(e.target.value)}
                        disabled={!useProxy}
                        className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-3 text-xs font-mono outline-none focus:border-blue-500/50 transition-all disabled:opacity-30"
                      />
                      <p className="text-[10px] text-white/30">ملاحظة: المتصفحات تمنع تغيير الـ IP المباشر بدون إضافات، استخدام البروكسي هنا يحسن جودة المشاهدة.</p>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold flex items-center gap-2">
                        <ShieldCheck size={18} className="text-green-500" />
                        وضع التخفي الذكي
                      </h4>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all">
                          <span className="text-sm">تأخير عشوائي بين النوافذ</span>
                          <input 
                            type="checkbox" 
                            checked={smartRotation} 
                            onChange={() => setSmartRotation(!smartRotation)}
                            className="accent-green-500"
                          />
                        </label>
                        <div className="p-4 bg-green-500/10 rounded-2xl border border-green-500/20">
                          <p className="text-[10px] text-green-200/70 leading-relaxed">
                            يتم الآن محاكاة "بصمات متصفح" (Browser Fingerprints) مختلفة لكل نافذة لتقليل احتمالية كشف المشاهدات المتكررة.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={cn(
                    "grid gap-4 min-h-[600px]",
                    viewCount <= 1 ? "grid-cols-1" : 
                    viewCount <= 4 ? "grid-cols-2" : 
                    viewCount <= 9 ? "grid-cols-3" : "grid-cols-4"
                  )}>
                    {Array.from({ length: viewCount }).map((_, i) => (
                      <div key={i} className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative group">
                        <iframe 
                          src={getEmbedUrl(selectedLink)}
                          className="w-full h-full"
                          allow="autoplay; encrypted-media"
                          allowFullScreen
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded-lg text-[10px] font-bold border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                          Window #{i + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-600/10 p-6 rounded-3xl border border-blue-500/20 flex items-start gap-4">
                    <AlertCircle className="text-blue-500 shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-blue-500 mb-1">تنبيه الأمان</h4>
                      <p className="text-sm text-blue-200/70">
                        للحصول على أفضل النتائج، تأكد من كتم صوت الفيديوهات (Mute) وتغيير جودة العرض إلى 144p لتقليل استهلاك البيانات.
                        تذكر أن المشاهدات الحقيقية تأتي من التفاعل الطبيعي، استخدم هذه الأداة بحكمة.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-[#111] border-t border-white/5 md:hidden z-50 flex justify-around p-4">
        <button onClick={() => setActiveTab('dashboard')} className={cn("p-2", activeTab === 'dashboard' ? "text-orange-500" : "text-white/40")}>
          <LayoutGrid size={24} />
        </button>
        <button onClick={() => setActiveTab('optimizer')} className={cn("p-2", activeTab === 'optimizer' ? "text-orange-500" : "text-white/40")}>
          <Sparkles size={24} />
        </button>
        <button onClick={() => setActiveTab('viewer')} className={cn("p-2", activeTab === 'viewer' ? "text-orange-500" : "text-white/40")}>
          <Maximize2 size={24} />
        </button>
        <button onClick={() => setActiveTab('growth')} className={cn("p-2", activeTab === 'growth' ? "text-orange-500" : "text-white/40")}>
          <Plus size={24} />
        </button>
        <button onClick={() => setActiveTab('accelerator')} className={cn("p-2", activeTab === 'accelerator' ? "text-orange-500" : "text-white/40")}>
          <Zap size={24} />
        </button>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
        active 
          ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
          : "text-white/50 hover:bg-white/5 hover:text-white"
      )}
    >
      <span className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-pill"
          className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
        />
      )}
    </button>
  );
}
