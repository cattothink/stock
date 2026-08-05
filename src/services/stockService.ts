import { StockItem, StockPricePoint, StockCategory } from '../types';

// Map of common TW stock Chinese names for prettier display
const TW_STOCK_NAMES: Record<string, string> = {
  '2330.TW': '台積電',
  '2454.TW': '聯發科',
  '2317.TW': '鴻海',
  '2308.TW': '台達電',
  '2382.TW': '廣達',
  '3231.TW': '緯創',
  '2379.TW': '瑞昱',
  '3034.TW': '聯詠',
  '0050.TW': '元大台灣50',
  '0056.TW': '元大高股息',
  '00878.TW': '國泰永續高股息',
  '00919.TW': '群益台灣精選高息',
  '00929.TW': '復華台灣科技優息',
  '00940.TW': '元大台灣價值高息',
};

// Map of common US stock Chinese names
const US_STOCK_NAMES: Record<string, string> = {
  NVDA: 'NVIDIA (輝達)',
  AAPL: 'Apple (蘋果)',
  TSLA: 'Tesla (特斯樂)',
  MSFT: 'Microsoft (微軟)',
  GOOGL: 'Alphabet (Google)',
  AMZN: 'Amazon (亞馬遜)',
  META: 'Meta (臉書)',
  AMD: 'AMD (超微)',
  INTC: 'Intel (英特爾)',
  TSM: '台積電 ADR',
  QQQ: '納斯達克100 ETF',
  SPY: '標普500 ETF',
};

// Helper to format raw symbol
export function formatSymbol(raw: string): string {
  const clean = raw.trim().toUpperCase();
  if (!clean) return '';
  if (/^\d{4,6}$/.test(clean)) {
    return `${clean}.TW`;
  }
  return clean;
}

// Fetch raw JSON from Yahoo Finance via proxy fallbacks
async function fetchYahooFinanceJson(symbol: string, range = '1y', interval = '1d'): Promise<any> {
  const formatted = formatSymbol(symbol);
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(formatted)}?range=${range}&interval=${interval}`;

  const proxies = [
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => u, // Direct fetch fallback
  ];

  for (const proxyFn of proxies) {
    try {
      const url = proxyFn(targetUrl);
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data?.chart?.result?.[0]) {
          return data.chart.result[0];
        }
      }
    } catch (err) {
      // Try next proxy
    }
  }

  return null;
}

/**
 * Fetch live stock data for a given symbol.
 * Returns updated fields for StockItem.
 */
export async function fetchLiveStockQuote(rawSymbol: string): Promise<Partial<StockItem> | null> {
  const symbol = formatSymbol(rawSymbol);
  if (!symbol) return null;

  try {
    const result = await fetchYahooFinanceJson(symbol, '1y', '1d');
    if (!result || !result.meta) {
      return null;
    }

    const meta = result.meta;
    const timestamps: number[] = result.timestamp || [];
    const quotes = result.indicators?.quote?.[0] || {};
    const closePrices: (number | null)[] = quotes.close || [];

    // Filter out null / invalid price points
    const validDataPoints: { timestamp: number; price: number }[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const p = closePrices[i];
      if (p !== null && p !== undefined && !isNaN(p) && p > 0) {
        validDataPoints.push({ timestamp: timestamps[i], price: p });
      }
    }

    if (validDataPoints.length === 0 && !meta.regularMarketPrice) {
      return null;
    }

    const isTW = symbol.endsWith('.TW');
    const currency = isTW ? 'TWD' : (meta.currency || 'USD');
    const category: StockCategory = isTW
      ? symbol.startsWith('00') ? 'etf' : 'tw_stock'
      : 'us_stock';

    // Current price
    let currentPrice = meta.regularMarketPrice;
    if (!currentPrice && validDataPoints.length > 0) {
      currentPrice = validDataPoints[validDataPoints.length - 1].price;
    }
    currentPrice = Math.round((currentPrice || 0) * 100) / 100;

    // Previous close
    const prevClose = meta.chartPreviousClose || meta.previousClose || (validDataPoints.length > 1 ? validDataPoints[validDataPoints.length - 2].price : currentPrice);
    const changeAmount = Math.round((currentPrice - prevClose) * 100) / 100;
    const changePercent = prevClose > 0 ? Math.round(((currentPrice - prevClose) / prevClose) * 10000) / 100 : 0;

    // 52-week High/Low
    let high52w = meta.fiftyTwoWeekHigh;
    let low52w = meta.fiftyTwoWeekLow;
    if (!high52w && validDataPoints.length > 0) {
      high52w = Math.max(...validDataPoints.map((d) => d.price));
    }
    if (!low52w && validDataPoints.length > 0) {
      low52w = Math.min(...validDataPoints.map((d) => d.price));
    }

    // Name formatting
    let name = TW_STOCK_NAMES[symbol] || US_STOCK_NAMES[symbol];
    if (!name) {
      name = meta.shortName || meta.longName || meta.symbol || symbol;
    }

    // Construct Chart Data arrays (1D, 1W, 1M, 3M, 1Y)
    const chartData = buildChartDataFromPoints(validDataPoints, currentPrice);

    // Calculate timeframe performance
    const performance = calculatePerformance(validDataPoints, currentPrice, changePercent);

    return {
      symbol,
      name,
      category,
      currency,
      currentPrice,
      changeAmount,
      changePercent,
      performance,
      chartData,
      high52w: Math.round((high52w || currentPrice * 1.2) * 100) / 100,
      low52w: Math.round((low52w || currentPrice * 0.8) * 100) / 100,
    };
  } catch (error) {
    console.error(`Failed to fetch live quote for ${rawSymbol}:`, error);
    return null;
  }
}

// Build 1D, 1W, 1M, 3M, 1Y chart points
function buildChartDataFromPoints(
  points: { timestamp: number; price: number }[],
  currentPrice: number
): Record<string, StockPricePoint[]> {
  if (!points || points.length === 0) {
    return {
      '1D': [{ time: '13:30', price: currentPrice }],
      '1W': [{ time: '週五', price: currentPrice }],
      '1M': [{ time: '30日', price: currentPrice }],
      '3M': [{ time: '本月', price: currentPrice }],
      '1Y': [{ time: 'Q4', price: currentPrice }],
    };
  }

  // 1Y data (all points scaled to max ~30 points)
  const step1Y = Math.max(1, Math.floor(points.length / 30));
  const data1Y: StockPricePoint[] = points
    .filter((_, idx) => idx % step1Y === 0 || idx === points.length - 1)
    .map((p) => {
      const d = new Date(p.timestamp * 1000);
      return {
        time: `${d.getMonth() + 1}/${d.getDate()}`,
        price: Math.round(p.price * 100) / 100,
      };
    });

  // 3M data (last ~65 trading days)
  const points3M = points.slice(-65);
  const step3M = Math.max(1, Math.floor(points3M.length / 20));
  const data3M: StockPricePoint[] = points3M
    .filter((_, idx) => idx % step3M === 0 || idx === points3M.length - 1)
    .map((p) => {
      const d = new Date(p.timestamp * 1000);
      return {
        time: `${d.getMonth() + 1}/${d.getDate()}`,
        price: Math.round(p.price * 100) / 100,
      };
    });

  // 1M data (last ~22 trading days)
  const points1M = points.slice(-22);
  const data1M: StockPricePoint[] = points1M.map((p) => {
    const d = new Date(p.timestamp * 1000);
    return {
      time: `${d.getMonth() + 1}/${d.getDate()}`,
      price: Math.round(p.price * 100) / 100,
    };
  });

  // 1W data (last ~5 trading days)
  const points1W = points.slice(-5);
  const daysOfWeek = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
  const data1W: StockPricePoint[] = points1W.map((p) => {
    const d = new Date(p.timestamp * 1000);
    return {
      time: daysOfWeek[d.getDay()],
      price: Math.round(p.price * 100) / 100,
    };
  });

  // 1D simulated intra-day timeline based on recent price movement
  const lastPrice = points1W[points1W.length - 1]?.price || currentPrice;
  const prevPrice = points1W[points1W.length - 2]?.price || lastPrice * 0.99;
  const diff = lastPrice - prevPrice;

  const data1D: StockPricePoint[] = [
    { time: '09:00', price: Math.round(prevPrice * 100) / 100 },
    { time: '10:15', price: Math.round((prevPrice + diff * 0.3) * 100) / 100 },
    { time: '11:30', price: Math.round((prevPrice + diff * 0.6) * 100) / 100 },
    { time: '12:45', price: Math.round((prevPrice + diff * 0.8) * 100) / 100 },
    { time: '13:30', price: Math.round(lastPrice * 100) / 100 },
  ];

  return {
    '1D': data1D,
    '1W': data1W,
    '1M': data1M,
    '3M': data3M,
    '1Y': data1Y,
  };
}

// Calculate timeframe performance %
function calculatePerformance(
  points: { timestamp: number; price: number }[],
  currentPrice: number,
  changePercent1D: number
) {
  const getChangeFromN = (nDaysAgo: number) => {
    if (points.length <= nDaysAgo) return changePercent1D;
    const pastPrice = points[points.length - 1 - nDaysAgo].price;
    if (!pastPrice || pastPrice === 0) return 0;
    return Math.round(((currentPrice - pastPrice) / pastPrice) * 10000) / 100;
  };

  return {
    d1: changePercent1D,
    w1: getChangeFromN(5),
    m1: getChangeFromN(22),
    m3: getChangeFromN(65),
    y1: getChangeFromN(Math.min(250, points.length - 1)),
  };
}

/**
 * Fetch batch live quotes for an array of stock symbols.
 */
export async function fetchBatchLiveQuotes(
  symbols: string[]
): Promise<Record<string, Partial<StockItem>>> {
  const results: Record<string, Partial<StockItem>> = {};
  const promises = symbols.map(async (sym) => {
    const data = await fetchLiveStockQuote(sym);
    if (data && data.symbol) {
      results[data.symbol] = data;
    }
  });

  await Promise.allSettled(promises);
  return results;
}
