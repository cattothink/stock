import React, { useState, useEffect } from 'react';
import { CatQuote } from '../types';
import { CAT_QUOTES_POOL } from '../data/mockStocks';
import { playMeowSound } from '../utils/audio';
import { Sparkles, Heart, RefreshCw, X } from 'lucide-react';

interface CatAssistantProps {
  currentStockContext?: string;
}

export const CatAssistant: React.FC<CatAssistantProps> = ({ currentStockContext }) => {
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [currentQuote, setCurrentQuote] = useState<CatQuote>(CAT_QUOTES_POOL[0]);
  const [petCount, setPetCount] = useState<number>(0);
  const [showHearts, setShowHearts] = useState<boolean>(false);
  
  // 2D Wandering position state across screen (X & Y axes)
  const [posX, setPosX] = useState<number>(12);
  const [posY, setPosY] = useState<number>(16);
  const [directionX, setDirectionX] = useState<'right' | 'left'>('right');
  const [directionY, setDirectionY] = useState<'up' | 'down'>('up');
  const [isWandering, setIsWandering] = useState<boolean>(true);
  const [isMeowing, setIsMeowing] = useState<boolean>(false);
  const [showBubble, setShowBubble] = useState<boolean>(true);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);

  // Initial canned food index base count
  const baseCannedCount = 10888;
  const currentCannedCount = baseCannedCount + petCount;

  // 2D Wandering animation effect (moves both horizontally and vertically)
  useEffect(() => {
    if (!isWandering) return;

    const interval = setInterval(() => {
      // Horizontal wandering (X axis)
      setPosX((prevX) => {
        let nextX = prevX + (directionX === 'right' ? 1.6 : -1.6);
        if (nextX >= 76) {
          setDirectionX('left');
          return 76;
        }
        if (nextX <= 4) {
          setDirectionX('right');
          return 4;
        }
        return nextX;
      });

      // Vertical wandering (Y axis floating)
      setPosY((prevY) => {
        let nextY = prevY + (directionY === 'up' ? 1.2 : -1.2);
        if (nextY >= 50) {
          setDirectionY('down');
          return 50;
        }
        if (nextY <= 10) {
          setDirectionY('up');
          return 10;
        }
        return nextY;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWandering, directionX, directionY]);

  // Petting handler
  const handlePetCat = () => {
    playMeowSound();
    setPetCount((prev) => prev + 1);
    setIsMeowing(true);
    setShowHearts(true);

    setTimeout(() => {
      setIsMeowing(false);
      setShowHearts(false);
    }, 1500);
  };

  // Switch Quote locally
  const handleNextQuote = () => {
    const nextIdx = (quoteIndex + 1) % CAT_QUOTES_POOL.length;
    setQuoteIndex(nextIdx);
    setCurrentQuote(CAT_QUOTES_POOL[nextIdx]);
    playMeowSound();
  };

  // Ask AI for Cat Quote
  const handleFetchAiQuote = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/cat-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockContext: currentStockContext }),
      });
      const data = await res.json();
      if (data.quote) {
        setCurrentQuote({
          quote: data.quote,
          mood: data.mood || 'wise',
          actionTip: data.actionTip || '盤勢變化多，注意風險。',
        });
        playMeowSound();
      }
    } catch (e) {
      handleNextQuote();
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div
      className="fixed z-30 transition-all duration-700 ease-in-out pointer-events-none"
      style={{ left: `${posX}%`, bottom: `${posY}px` }}
    >
      <div className="relative pointer-events-auto flex flex-col items-center group">
        
        {/* Floating Heart / Meow Particles */}
        {showHearts && (
          <div className="absolute -top-12 flex items-center gap-1 animate-bounce text-slate-100 font-bold text-xs bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700 shadow-2xl">
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span>撫摸成功！ 罐罐 +1 🥫</span>
          </div>
        )}

        {/* Speech Bubble */}
        {showBubble && (
          <div className="mb-2 max-w-xs sm:max-w-sm bg-zinc-900/95 border border-zinc-700 text-slate-200 rounded-2xl p-3.5 shadow-2xl relative transform transition-all duration-300 hover:scale-105 backdrop-blur-md">
            {/* Pointer arrow */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-zinc-700"></div>

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-200 font-bold mb-1">
                <span>🐾 股市靈貓開講</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-slate-300 border border-zinc-700 font-mono">
                  純白貓助手
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleNextQuote}
                  className="p-1 rounded hover:bg-zinc-800 text-slate-400 hover:text-slate-200 transition-colors"
                  title="換一句貓語"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowBubble(false)}
                  className="p-1 rounded hover:bg-zinc-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* MAIN QUOTE DISPLAY */}
            <p className="font-bold text-sm text-slate-100 leading-snug mb-1">
              {currentQuote.quote}
            </p>

            {currentQuote.actionTip && (
              <p className="text-[11px] text-slate-400 leading-tight">
                💡 貓爪提醒：{currentQuote.actionTip}
              </p>
            )}

            {/* Quote Action Bar */}
            <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
              <button
                onClick={handleFetchAiQuote}
                disabled={isAiLoading}
                className="text-slate-200 hover:text-white font-bold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{isAiLoading ? '靈感生成中...' : '問貓貓當前股市觀點'}</span>
              </button>

              <span className="text-slate-400 text-[10px] font-mono">
                撫摸：{petCount} 次
              </span>
            </div>
          </div>
        )}

        {/* Animated Cat Avatar & Integrated Cat Food Index Badge */}
        <div
          onClick={handlePetCat}
          className="cursor-pointer relative flex flex-col items-center group/cat select-none"
        >
          {/* Integrated Cat Food Index Badge attached to the Cat */}
          <div className="mb-1.5 px-3 py-1 bg-zinc-900/95 border border-amber-500/50 rounded-full shadow-xl flex items-center gap-1.5 text-xs font-mono font-bold text-slate-100 backdrop-blur-md hover:border-amber-400 transition-colors">
            <span className="text-amber-400">🐱 罐罐指數：</span>
            <span className="text-amber-300">{currentCannedCount.toLocaleString()} 罐</span>
            <span className="text-xs text-rose-400 font-normal">(+52.0)</span>
          </div>

          {/* Meow Badge */}
          {isMeowing && (
            <div className="absolute -top-7 text-xs font-black text-slate-100 animate-pulse bg-zinc-800 px-3 py-0.5 rounded-full border border-zinc-700 shadow-lg z-20">
              喵嗚～ 🐾 罐罐+1
            </div>
          )}

          {/* PURE WHITE CAT HEAD - NO BLACK CIRCLE FRAME (去背白貓) */}
          <div
            className={`w-16 h-16 transition-transform duration-300 hover:scale-110 drop-shadow-[0_10px_15px_rgba(255,255,255,0.15)] ${
              directionX === 'left' ? 'scale-x-[-1]' : ''
            }`}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Outer Ears */}
              <path d="M 18 42 L 30 6 L 46 32 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
              <path d="M 82 42 L 70 6 L 54 32 Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
              
              {/* Inner Ears (Soft Pink) */}
              <path d="M 24 36 L 31 14 L 42 30 Z" fill="#F472B6" opacity="0.85" />
              <path d="M 76 36 L 69 14 L 58 30 Z" fill="#F472B6" opacity="0.85" />

              {/* White Cat Head Base Shape */}
              <ellipse cx="50" cy="52" rx="35" ry="28" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />

              {/* Cheeks / Muzzle */}
              <ellipse cx="50" cy="60" rx="16" ry="10" fill="#F8FAFC" />

              {/* Glowing Golden Amber Eyes */}
              <ellipse cx="35" cy="46" rx="6.5" ry="7.5" fill="#F59E0B" />
              <ellipse cx="65" cy="46" rx="6.5" ry="7.5" fill="#F59E0B" />
              
              {/* Eye Pupils & Specular Reflection Highlights */}
              <ellipse cx="35" cy="46" rx="2.5" ry="5.5" fill="#0F172A" />
              <ellipse cx="65" cy="46" rx="2.5" ry="5.5" fill="#0F172A" />
              <circle cx="33" cy="43" r="2" fill="#FFFFFF" />
              <circle cx="63" cy="43" r="2" fill="#FFFFFF" />

              {/* Pink Nose */}
              <polygon points="47,56 53,56 50,60" fill="#F472B6" />

              {/* Mouth */}
              <path d="M 44 61 Q 50 65 56 61" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />

              {/* Whiskers (Dark/Slate for contrast on white fur & black background) */}
              <line x1="8" y1="50" x2="28" y2="53" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="6" y1="58" x2="26" y2="58" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="92" y1="50" x2="72" y2="53" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="94" y1="58" x2="74" y2="58" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>

          {/* Quick Cat Control Bar */}
          <div className="mt-1 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 rounded-full px-2.5 py-0.5 text-[10px] text-slate-300 shadow-xl backdrop-blur-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsWandering(!isWandering);
              }}
              className="hover:text-white font-bold"
            >
              {isWandering ? '🚶 自由遊走中' : '💤 原地休息'}
            </button>
            <span className="text-zinc-600">•</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowBubble(!showBubble);
              }}
              className="hover:text-white"
            >
              {showBubble ? '收起貓語' : '開啟貓語'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
