import React, { useState } from 'react';
import { StockItem, UserProfile } from '../types';
import { 
  Trash2, 
  Newspaper, 
  Sparkles, 
  TrendingUp, 
  ChevronUp,
  ChevronDown,
  BarChart3,
  GripVertical,
  Plus,
  RefreshCw
} from 'lucide-react';

interface WatchlistProps {
  currentUser: UserProfile;
  stocks: StockItem[];
  colorScheme: 'tw' | 'us';
  onReorderStocks: (newOrderSymbolList: string[]) => void;
  onRemoveStock: (symbol: string) => void;
  onSelectStockDetail: (stock: StockItem, initialTab?: 'trend' | 'news' | 'predict') => void;
  onOpenAddModal: () => void;
  onRefreshLiveQuotes?: () => void;
  isRefreshing?: boolean;
  lastUpdatedTime?: string | null;
}

// Mini SVG Sparkline Component for Stock Cards
const SparklineThumbnail: React.FC<{
  data: { time: string; price: number }[];
  color: string;
  isUp: boolean;
}> = ({ data, color }) => {
  if (!data || data.length < 2) return null;

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  const width = 120;
  const height = 36;
  const padding = 4;

  const points = data.map((item, idx) => {
    const x = (idx / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((item.price - minPrice) / range) * (height - padding * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M ${points[0]} L ${points.join(' L ')} L ${width - padding},${height} L ${padding},${height} Z`;

  return (
    <div className="flex flex-col items-end justify-center">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`sparkline-grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.0} />
          </linearGradient>
        </defs>
        {/* Filled Area */}
        <path d={areaD} fill={`url(#sparkline-grad-${color})`} />
        {/* Trend Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* End Dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].split(',')[0]}
            cy={points[points.length - 1].split(',')[1]}
            r="3"
            fill={color}
            className="animate-pulse"
          />
        )}
      </svg>
    </div>
  );
};

export const Watchlist: React.FC<WatchlistProps> = ({
  currentUser,
  stocks,
  colorScheme,
  onReorderStocks,
  onRemoveStock,
  onSelectStockDetail,
  onOpenAddModal,
  onRefreshLiveQuotes,
  isRefreshing = false,
  lastUpdatedTime = null,
}) => {
  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newStocks = [...stocks];
    const [movedItem] = newStocks.splice(draggedIndex, 1);
    newStocks.splice(dropIndex, 0, movedItem);

    onReorderStocks(newStocks.map((s) => s.symbol));
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Color helper based on TW or US scheme
  const isUpPositive = colorScheme === 'tw';
  const getChangeColorProps = (value: number) => {
    if (value === 0) {
      return {
        textClass: 'text-slate-400 bg-zinc-800 border-zinc-700',
        strokeColor: '#94a3b8',
      };
    }
    const isUp = value > 0;
    const isRedPositive = isUpPositive ? isUp : !isUp;
    if (isRedPositive) {
      return {
        textClass: 'text-rose-400 bg-rose-950/70 border-rose-800/80',
        strokeColor: '#f43f5e',
      };
    } else {
      return {
        textClass: 'text-emerald-400 bg-emerald-950/70 border-emerald-800/80',
        strokeColor: '#10b981',
      };
    }
  };

  if (stocks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 bg-zinc-900 border border-zinc-800 rounded-3xl text-center shadow-2xl">
        <div className="w-16 h-16 bg-zinc-800 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl border border-zinc-700">
          🐾
        </div>
        <h3 className="text-xl font-bold text-slate-100 mb-2">
          {currentUser.name} 目前的觀察清單是空的喵！
        </h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
          快新增關注的熱門股票（例如台積電、輝達、鴻海或高股息ETF），支援滑鼠拖曳順序與即時趨勢縮圖！
        </p>
        <button
          onClick={onOpenAddModal}
          className="px-6 py-3 bg-slate-100 hover:bg-white text-zinc-900 font-bold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2 mx-auto"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>新增股票到觀察名單</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Compact Watchlist Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-mono font-bold text-slate-200 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
            {stocks.length} 檔標的
          </span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 font-medium text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRefreshing ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRefreshing ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span>{isRefreshing ? '線上同步最新行情中...' : '實時行情連線 (免費線上 API)'}</span>
            {lastUpdatedTime && (
              <span className="text-slate-400 font-mono text-[10px] ml-1">
                ({lastUpdatedTime})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshLiveQuotes && (
            <button
              onClick={onRefreshLiveQuotes}
              disabled={isRefreshing}
              className="text-xs px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-slate-200 font-bold border border-zinc-800 shadow-sm flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              title="立即從免費線上 API 抓取最新股價"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? '刷新中...' : '即時刷新'}</span>
            </button>
          )}

          <button
            onClick={onOpenAddModal}
            className="text-xs px-3.5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>新增觀察股</span>
          </button>
        </div>
      </div>

      {/* Stock Cards List with Drag and Drop */}
      <div className="space-y-3">
        {stocks.map((stock, index) => {
          const { textClass, strokeColor } = getChangeColorProps(stock.changePercent);
          const isBeingDragged = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== index;
          const chartData = stock.chartData['1M'] || stock.chartData['1D'] || [];

          return (
            <div
              key={stock.symbol}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectStockDetail(stock, 'trend')}
              className={`bg-zinc-900/90 border rounded-2xl p-4 sm:p-5 shadow-lg transition-all cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
                isBeingDragged
                  ? 'opacity-40 border-slate-500 border-dashed scale-[0.98]'
                  : isDragOver
                  ? 'border-slate-300 bg-zinc-800 shadow-xl scale-[1.01]'
                  : 'border-zinc-800/90 hover:border-zinc-700 hover:bg-zinc-900'
              }`}
            >
              {/* Left Side: Drag Handle & Stock Info (No #1 numbers as requested) */}
              <div className="flex items-center gap-3">
                {/* Drag Handle Grip Icon */}
                <div 
                  className="cursor-grab active:cursor-grabbing p-2 rounded-xl bg-zinc-800/80 text-slate-400 hover:text-slate-100 hover:bg-zinc-800 transition-colors border border-zinc-700/50"
                  title="按住拖曳改變股票順序"
                  onClick={(e) => e.stopPropagation()}
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-slate-100 tracking-wide group-hover:text-slate-300 transition-colors">
                      {stock.name}
                    </h3>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-zinc-800 text-slate-300 font-bold border border-zinc-700">
                      {stock.symbol}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-950 text-slate-400 uppercase font-semibold">
                      {stock.currency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-sm">
                    {stock.description || '優質觀察個股'}
                  </p>
                </div>
              </div>

              {/* Right Side: Current Price, Sparkline Trend Thumbnail & Detail Triggers */}
              <div className="flex items-center justify-between md:justify-end gap-5 sm:gap-7 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                {/* SPARKLINE TREND THUMBNAIL */}
                <div className="hidden sm:block">
                  <SparklineThumbnail
                    data={chartData}
                    color={strokeColor}
                    isUp={stock.changePercent >= 0}
                  />
                </div>

                {/* CURRENT PRICE DISPLAY - 3 Stacked Lines */}
                <div className="flex flex-col text-left md:text-right">
                  {/* Line 1: Amount */}
                  <div className="text-[28px] sm:text-[30px] font-bold font-mono text-slate-100 tracking-tight">
                    {stock.currentPrice.toLocaleString()}
                  </div>
                  {/* Line 2: Region & Currency (Gray font) */}
                  <div className="text-xs font-medium font-mono text-slate-400 mt-0.5">
                    {stock.currency === 'USD' ? '美國．USD' : '台灣．TWD'}
                  </div>
                  {/* Line 3: Change Badge */}
                  <div className="mt-1 md:self-end">
                    <span
                      className={`inline-block text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${textClass}`}
                    >
                      {stock.changeAmount >= 0 ? '+' : ''}
                      {stock.changeAmount} ({stock.changePercent >= 0 ? '+' : ''}
                      {stock.changePercent}%)
                    </span>
                  </div>
                </div>

                {/* Quick Action Buttons (Icon-only) */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStockDetail(stock, 'trend');
                    }}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 transition-all shadow-sm"
                    title="點擊查看詳細資訊（走勢圖/新聞/AI預測）"
                  >
                    <BarChart3 className="w-4 h-4 text-slate-300" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStockDetail(stock, 'news');
                    }}
                    className="p-2 rounded-xl bg-zinc-800/80 hover:bg-sky-950 text-slate-400 hover:text-sky-400 border border-zinc-700 transition-colors"
                    title="個股新聞"
                  >
                    <Newspaper className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectStockDetail(stock, 'predict');
                    }}
                    className="p-2 rounded-xl bg-zinc-800/80 hover:bg-amber-950 text-slate-400 hover:text-amber-400 border border-zinc-700 transition-colors"
                    title="AI 預測"
                  >
                    <Sparkles className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveStock(stock.symbol);
                    }}
                    className="p-2 rounded-xl hover:bg-rose-950/80 text-slate-500 hover:text-rose-400 transition-colors"
                    title="移出觀察名單"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
