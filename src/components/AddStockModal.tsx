import React, { useState } from 'react';
import { StockItem } from '../types';
import { INITIAL_STOCKS } from '../data/mockStocks';
import { fetchLiveStockQuote, formatSymbol } from '../services/stockService';
import { Search, Plus, X, Check, Loader2, Globe } from 'lucide-react';

interface AddStockModalProps {
  existingSymbols: string[];
  onAddStock: (stock: StockItem) => void;
  onClose: () => void;
}

export const AddStockModal: React.FC<AddStockModalProps> = ({
  existingSymbols,
  onAddStock,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customName, setCustomName] = useState('');
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  const [liveFetchedStock, setLiveFetchedStock] = useState<Partial<StockItem> | null>(null);
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');

  // Query live stock details online
  const handleQueryOnline = async (symbolToQuery?: string) => {
    const symInput = symbolToQuery || customSymbol || searchTerm;
    if (!symInput.trim()) return;
    setIsFetchingLive(true);
    setLiveFetchedStock(null);

    const fullSym = formatSymbol(symInput);
    const liveData = await fetchLiveStockQuote(fullSym);

    setIsFetchingLive(false);
    if (liveData) {
      setLiveFetchedStock(liveData);
      if (liveData.name) {
        setCustomName(liveData.name);
      }
      if (!customSymbol) {
        setCustomSymbol(symInput);
      }
    } else {
      alert(`線上未能找到 ${fullSym} 的即時資料，請確認代碼是否正確（例如台股 009816 / 2330 或美股 AAPL / NVDA）。`);
    }
  };

  // Filter preset stocks
  const presetList = Object.values(INITIAL_STOCKS).filter((stock) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      stock.symbol.toLowerCase().includes(term) ||
      stock.name.toLowerCase().includes(term) ||
      stock.category.toLowerCase().includes(term)
    );
  });

  // Handle adding custom symbol
  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSymbol.trim()) return;

    const sym = formatSymbol(customSymbol);
    const isTW = sym.endsWith('.TW');

    let baseStock = liveFetchedStock;
    if (!baseStock) {
      // Fetch live data if not queried yet
      setIsFetchingLive(true);
      baseStock = await fetchLiveStockQuote(sym);
      setIsFetchingLive(false);
    }

    const basePrice = baseStock?.currentPrice || (isTW ? 150 : 200);
    const newStock: StockItem = {
      id: `custom_${Date.now()}`,
      symbol: sym,
      name: customName.trim() || baseStock?.name || sym,
      category: baseStock?.category || (isTW ? 'tw_stock' : 'us_stock'),
      currency: baseStock?.currency || (isTW ? 'TWD' : 'USD'),
      currentPrice: basePrice,
      changeAmount: baseStock?.changeAmount ?? 0,
      changePercent: baseStock?.changePercent ?? 0,
      performance: baseStock?.performance || {
        d1: baseStock?.changePercent ?? 0,
        w1: 1.5,
        m1: 3.2,
        m3: 6.5,
        y1: 15.0,
      },
      marketCap: isTW ? '台股上市標的' : '美股上市標的',
      peRatio: 18.5,
      high52w: baseStock?.high52w || Math.round(basePrice * 1.25),
      low52w: baseStock?.low52w || Math.round(basePrice * 0.75),
      description: `線上實時報價標的 (${sym})`,
      chartData: baseStock?.chartData || {
        '1D': [
          { time: '09:00', price: basePrice * 0.98 },
          { time: '13:30', price: basePrice },
        ],
        '1W': [{ time: '週五', price: basePrice }],
        '1M': [{ time: '30日', price: basePrice }],
        '3M': [{ time: '本月', price: basePrice }],
        '1Y': [{ time: 'Q4', price: basePrice }],
      },
    };

    onAddStock(newStock);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[28px] w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 text-slate-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">➕</span>
            <div>
              <h3 className="text-lg font-bold text-slate-100">新增觀察股票</h3>
              <p className="text-xs text-slate-400">快速搜尋台美熱門股，或自訂任意股票代碼</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-slate-400 hover:text-slate-100 border border-zinc-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/50 px-4 pt-2">
          <button
            onClick={() => setActiveTab('preset')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'preset'
                ? 'border-slate-100 text-slate-100 bg-zinc-900 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔥 熱門精選標的
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'custom'
                ? 'border-slate-100 text-slate-100 bg-zinc-900 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ✏️ 手動輸入代碼 (台美股)
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === 'preset' && (
            <div className="space-y-3">
              {/* Search Bar */}
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="輸入股票代碼或名稱 (如：009816, 2330, NVDA, 0050)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                {searchTerm.trim().length > 0 && (
                  <button
                    onClick={() => handleQueryOnline(searchTerm)}
                    disabled={isFetchingLive}
                    className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 shrink-0 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isFetchingLive ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>線上抓取</span>
                  </button>
                )}
              </div>

              {/* Live Fetched Result Card */}
              {liveFetchedStock && (
                <div className="p-3.5 bg-amber-950/20 border border-amber-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono">線上實時</span>
                      <span className="font-bold text-sm text-slate-100">{liveFetchedStock.name}</span>
                      <span className="font-mono text-xs text-amber-400 font-bold">{liveFetchedStock.symbol}</span>
                    </div>
                    <p className="text-xs font-mono font-bold">
                      <span className="text-slate-100 mr-2">${liveFetchedStock.currentPrice} {liveFetchedStock.currency}</span>
                      <span className={liveFetchedStock.changePercent && liveFetchedStock.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        ({liveFetchedStock.changePercent && liveFetchedStock.changePercent >= 0 ? '+' : ''}{liveFetchedStock.changePercent}%)
                      </span>
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleAddCustom({ preventDefault: () => {} } as any)}
                      className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-extrabold text-xs rounded-lg shadow-sm flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>直接加入觀察清單</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Preset Stock Items */}
              <div className="space-y-2">
                {presetList.length === 0 && !liveFetchedStock && (
                  <div className="p-6 text-center bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                    <p className="text-xs text-slate-400">精選熱門庫中未找到「{searchTerm}」</p>
                    <button
                      onClick={() => handleQueryOnline(searchTerm)}
                      disabled={isFetchingLive}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-all shadow-md"
                    >
                      {isFetchingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                      <span>使用免費線上 API 搜尋並抓取『{searchTerm}』最新報價</span>
                    </button>
                  </div>
                )}

                {presetList.map((stock) => {
                  const isAdded = existingSymbols.includes(stock.symbol);
                  return (
                    <div
                      key={stock.symbol}
                      className="p-3 bg-zinc-950 border border-zinc-800/80 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-slate-200 font-mono">
                          {stock.category === 'tw_stock' ? '台' : stock.category === 'etf' ? 'ETF' : '美'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">{stock.name}</span>
                            <span className="font-mono text-xs text-slate-300 font-bold">{stock.symbol}</span>
                          </div>
                          <p className="text-[11px] font-mono flex items-center gap-1.5 mt-0.5">
                            <span className="font-bold text-slate-100">{stock.currentPrice}</span>
                            <span className="text-slate-400 font-medium">
                              {stock.currency === 'USD' ? '美國．USD' : '台灣．TWD'}
                            </span>
                            <span className={stock.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'}>
                              ({stock.changePercent >= 0 ? '+' : ''}{stock.changePercent}%)
                            </span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!isAdded) onAddStock(stock);
                        }}
                        disabled={isAdded}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-zinc-800 text-slate-500 border border-zinc-700 cursor-not-allowed'
                            : 'bg-slate-100 hover:bg-white text-zinc-900 shadow-sm'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>已在清單</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>加入觀察</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleAddCustom} className="space-y-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">股票代碼 (Symbol)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例如：009816, 2330, 2454.TW, PLTR, NVDA"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-slate-100 font-mono focus:border-zinc-600 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleQueryOnline(customSymbol)}
                    disabled={isFetchingLive || !customSymbol.trim()}
                    className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition-all shrink-0 disabled:opacity-50"
                  >
                    {isFetchingLive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    <span>抓取線上報價</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">台股支援 4-6 位數字代碼 (如 009816, 2330, 0050)；美股請填英文字母 (如 NVDA, AAPL)</p>
              </div>

              {liveFetchedStock && (
                <div className="p-3 bg-amber-950/20 border border-amber-500/40 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between font-bold text-amber-300">
                    <span>{liveFetchedStock.name} ({liveFetchedStock.symbol})</span>
                    <span>${liveFetchedStock.currentPrice} {liveFetchedStock.currency}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">已成功從線上 API 抓取即時價格與技術線圖資料</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-slate-300 font-bold">股票或標的名稱 (Stock Name)</label>
                <input
                  type="text"
                  placeholder="例如：台積電, 聯發科, Palantir (自動抓取或自訂)"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-slate-100 focus:border-zinc-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isFetchingLive}
                className="w-full py-3 bg-slate-100 hover:bg-white text-zinc-900 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isFetchingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>確認新增此股票到個人觀察清單</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
