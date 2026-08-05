export type StockCategory = 'tw_stock' | 'us_stock' | 'etf' | 'crypto';

export interface TimeframePerformance {
  d1: number; // 1D %
  w1: number; // 1W %
  m1: number; // 1M %
  m3: number; // 3M %
  y1: number; // 1Y %
}

export interface StockPricePoint {
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface StockItem {
  id: string;
  symbol: string;        // e.g. "2330.TW", "NVDA"
  name: string;          // e.g. "台積電", "NVIDIA"
  category: StockCategory;
  currency: 'TWD' | 'USD';
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  performance: TimeframePerformance;
  chartData: Record<string, StockPricePoint[]>; // '1D', '1W', '1M', '3M', '1Y'
  marketCap?: string;
  peRatio?: number;
  high52w?: number;
  low52w?: number;
  description?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  avatar: string;        // Emoji or icon name
  roleDescription: string;
  watchlist: string[];   // Array of stock symbols or stock IDs
  createdAt: string;
}

export interface StockNewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  url: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impactTags?: string[];
}

export interface AITrendPrediction {
  symbol: string;
  stockName: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidenceScore: number; // 0 - 100
  targetPriceRange: {
    low: number;
    high: number;
    current: number;
  };
  keyTakeaways: string[];
  catalysts: string[];
  risks: string[];
  catWisdom: string;
  updatedAt: string;
}

export interface CatQuote {
  quote: string;
  mood: 'wise' | 'playful' | 'cautious' | 'sleepy' | 'excited';
  actionTip?: string;
}
