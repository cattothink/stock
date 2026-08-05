import React, { useState, useEffect } from 'react';
import { StockItem, StockNewsItem, AITrendPrediction } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { 
  X, 
  ExternalLink, 
  Sparkles, 
  Newspaper, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert,
  BarChart2,
  Clock
} from 'lucide-react';

interface StockDetailModalProps {
  stock: StockItem | null;
  initialTab?: 'trend' | 'news' | 'predict';
  onClose: () => void;
  colorScheme: 'tw' | 'us';
  onUpdateStockPrice?: (updatedStock: Partial<StockItem> & { symbol: string }) => void;
}

type TimeframeOption = '1D' | '1W' | '1M' | '3M' | '1Y';

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  initialTab = 'trend',
  onClose,
  colorScheme,
  onUpdateStockPrice,
}) => {
  if (!stock) return null;

  const [activeTab, setActiveTab] = useState<'trend' | 'news' | 'predict'>(initialTab);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>('1M');

  // Real-time price refresh state
  const [isRefreshingPrice, setIsRefreshingPrice] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(
    new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [liveStock, setLiveStock] = useState<StockItem>(stock);

  // News State
  const [newsList, setNewsList] = useState<StockNewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState<boolean>(false);

  // AI Prediction State
  const [prediction, setPrediction] = useState<AITrendPrediction | null>(null);
  const [loadingPredict, setLoadingPredict] = useState<boolean>(false);
  const [predictError, setPredictError] = useState<string | null>(null);

  // Keep live stock updated if prop changes
  useEffect(() => {
    setLiveStock(stock);
  }, [stock]);

  // Real-time price fetch / refresh
  const handleRefreshLivePrice = async () => {
    setIsRefreshingPrice(true);
    try {
      const res = await fetch('/api/stock-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: liveStock.symbol, currentPrice: liveStock.currentPrice }),
      });
      const data = await res.json();
      if (data.currentPrice) {
        const updated = {
          ...liveStock,
          currentPrice: data.currentPrice,
          changeAmount: Number((liveStock.changeAmount + data.priceDiff).toFixed(2)),
          changePercent: Number(((liveStock.changeAmount + data.priceDiff) / (data.currentPrice || 1) * 100).toFixed(2)),
        };
        setLiveStock(updated);
        setLastUpdatedTime(data.updatedAt || new Date().toLocaleTimeString('zh-TW'));
        if (onUpdateStockPrice) {
          onUpdateStockPrice(updated);
        }
      }
    } catch (e) {
      console.error('Failed to refresh stock price', e);
    } finally {
      setIsRefreshingPrice(false);
    }
  };

  // Fetch News
  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch('/api/stock-news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: liveStock.symbol, stockName: liveStock.name }),
      });
      const data = await res.json();
      if (data.news && Array.isArray(data.news)) {
        setNewsList(data.news);
      }
    } catch (e) {
      console.error('Failed to fetch news', e);
    } finally {
      setLoadingNews(false);
    }
  };

  // Fetch AI Prediction
  const fetchPrediction = async () => {
    setLoadingPredict(true);
    setPredictError(null);
    try {
      const res = await fetch('/api/stock-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: liveStock.symbol,
          stockName: liveStock.name,
          currentPrice: liveStock.currentPrice,
          currency: liveStock.currency,
          performance: liveStock.performance,
          description: liveStock.description,
        }),
      });
      if (!res.ok) throw new Error('AI 分析暫時忙碌中，請重試');
      const data: AITrendPrediction = await res.json();
      setPrediction(data);
    } catch (e: any) {
      console.error('Failed to fetch prediction', e);
      setPredictError(e.message || '無法取得 AI 趨勢分析');
    } finally {
      setLoadingPredict(false);
    }
  };

  useEffect(() => {
    fetchNews();
    fetchPrediction();
  }, [liveStock.symbol]);

  // Color helper based on TW or US scheme
  const isUpPositive = colorScheme === 'tw';
  const getChangeColor = (value: number) => {
    if (value === 0) return 'text-slate-500 bg-slate-100 border-slate-200';
    const isUp = value > 0;
    const isRedPositive = isUpPositive ? isUp : !isUp;
    return isRedPositive
      ? 'text-rose-600 bg-rose-50 border-rose-200'
      : 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getChartStroke = (value: number) => {
    if (value === 0) return '#64748b';
    const isUp = value > 0;
    const isRedPositive = isUpPositive ? isUp : !isUp;
    return isRedPositive ? '#e11d48' : '#059669';
  };

  const chartPoints = liveStock.chartData[selectedTimeframe] || liveStock.chartData['1M'] || [];
  const strokeColor = getChartStroke(liveStock.changePercent);

  const getSentimentBadge = (sentiment: 'bullish' | 'bearish' | 'neutral') => {
    switch (sentiment) {
      case 'bullish':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">🔥 利多看漲</span>;
      case 'bearish':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">⚠️ 利空觀望</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">⚖️ 中性震盪</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[28px] sm:rounded-[36px] w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-100">
        
        {/* Modal Header & Real-Time Price Banner */}
        <div className="p-4 sm:p-6 bg-zinc-950 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 text-slate-200 flex items-center justify-center text-2xl shadow-md flex-shrink-0">
              🐾
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-black text-slate-100">{liveStock.name}</h3>
                <span className="font-mono text-sm px-2.5 py-0.5 rounded-lg bg-zinc-800 text-slate-200 font-bold border border-zinc-700 shadow-xs">
                  {liveStock.symbol}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-slate-400 font-semibold uppercase border border-zinc-700">
                  {liveStock.currency}
                </span>
              </div>

              {/* Price Row */}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex flex-col font-mono">
                  <span className="text-2xl font-black text-slate-100">
                    {liveStock.currentPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {liveStock.currency === 'USD' ? '美國．USD' : '台灣．TWD'}
                  </span>
                </div>
                <span className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg border ${getChangeColor(liveStock.changePercent)}`}>
                  {liveStock.changeAmount >= 0 ? '+' : ''}{liveStock.changeAmount} ({liveStock.changePercent >= 0 ? '+' : ''}{liveStock.changePercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Right Action: Live Price Sync Button & Close */}
          <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefreshLivePrice}
                disabled={isRefreshingPrice}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-bold text-xs border border-zinc-700 shadow-xs flex items-center gap-1.5 transition-all"
                title="即時抓取最新報價"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingPrice ? 'animate-spin' : ''}`} />
                <span>{isRefreshingPrice ? '抓取中...' : '抓取最新價格'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-400 hover:text-slate-100 border border-zinc-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>更新於 {lastUpdatedTime}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/60 px-4 sm:px-6 pt-2">
          <button
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'trend'
                ? 'border-slate-100 text-slate-100 bg-zinc-900 rounded-t-2xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-slate-300" />
            <span>走勢圖與時間漲幅</span>
          </button>

          <button
            onClick={() => setActiveTab('predict')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'predict'
                ? 'border-amber-400 text-amber-300 bg-zinc-900 rounded-t-2xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Gemini AI 未來趨勢預測</span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === 'news'
                ? 'border-sky-400 text-sky-300 bg-zinc-900 rounded-t-2xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Newspaper className="w-4 h-4 text-sky-400" />
            <span>個股相關新聞</span>
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TREND CHART & TIMEFRAME PERFORMANCE MATRIX */}
          {activeTab === 'trend' && (
            <div className="space-y-6">
              {/* Chart Container */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-slate-300" />
                    <h4 className="font-bold text-slate-200 text-sm">
                      {liveStock.name} 趨勢線圖 ({selectedTimeframe})
                    </h4>
                  </div>

                  {/* Timeframe Buttons */}
                  <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
                    {(['1D', '1W', '1M', '3M', '1Y'] as TimeframeOption[]).map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setSelectedTimeframe(tf)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          selectedTimeframe === tf
                            ? 'bg-zinc-700 text-slate-100 shadow-xs'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-800'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recharts Area Chart */}
                <div className="h-56 sm:h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id={`detail-color-${liveStock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={['auto', 'auto']}
                        stroke="#64748b"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#3f3f46',
                          borderRadius: '1rem',
                          color: '#f4f4f5',
                          fontSize: '13px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
                        }}
                        formatter={(val: any) => [`${liveStock.currency === 'USD' ? 'USD $' : 'NT$'}${val}`, '價格']}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke={strokeColor}
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill={`url(#detail-color-${liveStock.symbol})`}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Timeframe Performance Matrix */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-xs">
                <h4 className="font-bold text-slate-200 text-sm mb-3 flex items-center justify-between">
                  <span>各時間週期漲幅表現</span>
                  <span className="text-xs text-slate-400 font-normal">基準單位：%</span>
                </h4>

                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: '1日', val: liveStock.performance.d1 },
                    { label: '1週', val: liveStock.performance.w1 },
                    { label: '1月', val: liveStock.performance.m1 },
                    { label: '3月', val: liveStock.performance.m3 },
                    { label: '1年', val: liveStock.performance.y1 },
                  ].map((item, i) => (
                    <div key={i} className="bg-zinc-900 rounded-xl p-2.5 border border-zinc-800">
                      <div className="text-xs text-slate-400 font-medium mb-1">{item.label}</div>
                      <div className={`text-xs sm:text-sm font-bold font-mono px-1 py-1 rounded-lg border ${getChangeColor(item.val)}`}>
                        {item.val >= 0 ? '+' : ''}{item.val}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Stock Fundamentals */}
                <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400">
                  <div>
                    52週高低範圍：
                    <span className="font-mono font-bold text-slate-200 ml-1">
                      {liveStock.low52w} ~ {liveStock.high52w}
                    </span>
                  </div>
                  <div>
                    本益比 (P/E)：
                    <span className="font-mono font-bold text-slate-200 ml-1">
                      {liveStock.peRatio || 'N/A'}
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    市值規模：
                    <span className="font-mono font-bold text-slate-200 ml-1">
                      {liveStock.marketCap || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GEMINI AI PREDICTION */}
          {activeTab === 'predict' && (
            <div className="space-y-6">
              {loadingPredict ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-amber-300 font-bold text-sm">
                    🐱 貓咪 AI 正在研讀 {liveStock.name} 技術K線與籌碼數據...
                  </p>
                  <p className="text-xs text-slate-400">（分析目標價區間、利多催化劑與貓爪操作心法）</p>
                </div>
              ) : predictError ? (
                <div className="p-6 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-center space-y-3">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                  <p className="text-slate-200 font-medium">{predictError}</p>
                  <button
                    onClick={fetchPrediction}
                    className="px-4 py-2 rounded-xl bg-zinc-800 text-slate-200 font-bold text-xs border border-zinc-700"
                  >
                    重新試試
                  </button>
                </div>
              ) : prediction ? (
                <div className="space-y-5">
                  {/* Top Sentiment & Target Price */}
                  <div className="bg-zinc-950 rounded-2xl p-5 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-slate-400 font-medium mb-1">AI 市場情緒指標</div>
                      <div className="flex items-center gap-2">
                        {getSentimentBadge(prediction.sentiment)}
                        <span className="text-slate-100 font-bold text-lg">
                          信心指數：{prediction.confidenceScore}%
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                      <div className="text-xs text-slate-400 mb-1">3個月預估目標價區間</div>
                      <div className="font-mono text-amber-400 font-black text-lg flex items-baseline justify-start sm:justify-end gap-1.5">
                        <span>{prediction.targetPriceRange.low} ~ {prediction.targetPriceRange.high}</span>
                        <span className="text-xs font-semibold text-slate-400">
                          ({liveStock.currency === 'USD' ? '美國．USD' : '台灣．TWD'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cat Assistant Wisdom Highlight */}
                  <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                    <div className="text-3xl">🐱</div>
                    <div>
                      <h4 className="text-slate-200 font-bold text-sm mb-1">貓咪小助手總評與建議</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">{prediction.catWisdom}</p>
                    </div>
                  </div>

                  {/* Key Takeaways */}
                  <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800 space-y-2">
                    <h4 className="text-slate-200 font-bold text-sm flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>核心趨勢與技術亮點</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-300">
                      {prediction.keyTakeaways.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Catalysts & Risks Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-rose-950/40 rounded-2xl p-4 border border-rose-900/60">
                      <h4 className="text-rose-400 font-bold text-xs mb-2 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>潛在利多催化劑</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {prediction.catalysts.map((cat, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-rose-400 font-bold">✓</span>
                            <span>{cat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-amber-950/40 rounded-2xl p-4 border border-amber-900/60">
                      <h4 className="text-amber-400 font-bold text-xs mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        <span>關鍵風險留意點</span>
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {prediction.risks.map((risk, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">!</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Refresh Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={fetchPrediction}
                      className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs font-bold border border-zinc-700 flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>重新生成 AI 預測</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 3: LATEST NEWS & EXTERNAL LINKS */}
          {activeTab === 'news' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-slate-400">
                  即時彙整 {liveStock.name} 最新新聞摘要，可直接點擊「前往外部新聞網頁」閱讀完整報導：
                </p>
                <button
                  onClick={fetchNews}
                  className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-200 font-bold border border-zinc-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>整理最新新聞</span>
                </button>
              </div>

              {loadingNews ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  載入最新新聞中...
                </div>
              ) : newsList.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  目前暫無最新新聞
                </div>
              ) : (
                <div className="space-y-3">
                  {newsList.map((news) => (
                    <div
                      key={news.id}
                      className="bg-zinc-950 p-4.5 rounded-2xl border border-zinc-800 hover:border-zinc-700 shadow-xs transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-slate-100 font-bold text-sm leading-snug">
                          {news.title}
                        </h4>
                        {getSentimentBadge(news.sentiment)}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {news.summary}
                      </p>

                      <div className="flex items-center justify-between pt-2 text-[11px] text-slate-400 border-t border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-medium">{news.source}</span>
                          <span>•</span>
                          <span>{news.publishedAt}</span>
                        </div>

                        {/* EXTERNAL LINK BUTTON REQUIREMENT */}
                        <a
                          href={news.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 font-bold border border-sky-800/80 flex items-center gap-1 transition-colors"
                        >
                          <span>前往外部新聞網頁</span>
                          <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
