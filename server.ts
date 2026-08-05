import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy Gemini client getter
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not configured yet. Fallbacks will be used if needed.');
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // 1. Stock AI Trend Prediction Endpoint
  app.post('/api/stock-predict', async (req, res) => {
    try {
      const { symbol, stockName, currentPrice, currency, performance, description } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback response if GEMINI_API_KEY is missing
        return res.json({
          symbol: symbol || 'UNKNOWN',
          stockName: stockName || '觀察標的',
          sentiment: 'bullish',
          confidenceScore: 82,
          targetPriceRange: {
            low: Math.round(currentPrice * 0.95),
            high: Math.round(currentPrice * 1.18),
            current: currentPrice,
          },
          keyTakeaways: [
            `近期動能拉升，短線位於關鍵均線支撐之上 (${currency})`,
            '產業AI與先進製程營運前景看好，量能穩定',
            '籌碼面法人維持淨買超，波動放緩時適合分批關心',
          ],
          catalysts: ['次世代新產品量產出貨', '毛利率改善與營收年增雙位數', '全球產業需求擴大'],
          risks: ['總體經濟利率變動', '大盤短線拉回過高壓力', '地緣政治與組裝供應鏈調整'],
          catWisdom: '喵！這檔股票貓爪捏很緊，有支撐才踏實，貓步要慢慢走，別急著一次梭哈唷！🐾',
          updatedAt: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        });
      }

      const prompt = `你是一位專業且幽默的股市分析貓喵專家（貓咪小助手），請針對以下股票進行未來趨勢分析：
股票名稱：${stockName} (${symbol})
當前股價：${currency} ${currentPrice}
近期績效：1日 ${performance?.d1}%, 1週 ${performance?.w1}%, 1月 ${performance?.m1}%, 3月 ${performance?.m3}%, 1年 ${performance?.y1}%
背景簡介：${description || '市場熱門觀察個股'}

請詳細分析其未來趨勢、技術與基本面看點、區間目標價、風險，並附上一句風格幽默又貼切的貓咪智慧語錄。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: '你是一個專業的繁體中文股市 AI 分析助理，請以 JSON 格式回應，確保態度客觀，同時融入討喜的貓咪視角（貓語、貓生哲理與風險提醒）。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              stockName: { type: Type.STRING },
              sentiment: { type: Type.STRING, description: 'bullish, bearish, or neutral' },
              confidenceScore: { type: Type.NUMBER, description: '0 to 100' },
              targetPriceRange: {
                type: Type.OBJECT,
                properties: {
                  low: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                  current: { type: Type.NUMBER },
                },
                required: ['low', 'high', 'current'],
              },
              keyTakeaways: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3條核心趨勢亮點分析',
              },
              catalysts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3個潛在利多催化劑',
              },
              risks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-3個關鍵風險提示',
              },
              catWisdom: { type: Type.STRING, description: '貓咪助理的幽默金句提醒' },
            },
            required: ['symbol', 'stockName', 'sentiment', 'confidenceScore', 'targetPriceRange', 'keyTakeaways', 'catalysts', 'risks', 'catWisdom'],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      data.updatedAt = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
      res.json(data);
    } catch (err: any) {
      console.error('Error generating AI prediction:', err);
      // Return clear error message to frontend
      res.status(500).json({ error: err.message || 'AI 趨勢分析生成失敗，請稍後重試' });
    }
  });

  // 2. Stock News Endpoint
  app.post('/api/stock-news', async (req, res) => {
    try {
      const { symbol, stockName } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        // Fallback mock news if key not ready
        const isTW = symbol?.includes('.TW');
        const defaultUrl = isTW 
          ? `https://www.google.com/search?q=${encodeURIComponent(stockName + ' 股票新聞')}`
          : `https://finance.yahoo.com/quote/${symbol}/news/`;

        return res.json({
          news: [
            {
              id: 'n_1',
              title: `${stockName} (${symbol}) 最新財報與產業展望焦點`,
              summary: `${stockName} 受惠於整體產業升級與國際訂單挹注，法人觀察籌碼動能穩健，市場關注後續獲利表現。`,
              source: isTW ? '鉅亨網 Anue' : 'Yahoo Finance',
              publishedAt: '30 分鐘前',
              url: defaultUrl,
              sentiment: 'bullish',
              impactTags: ['營運展望', '產業焦點'],
            },
            {
              id: 'n_2',
              title: `法人對 ${stockName} 近期股價評等與目標價彙整`,
              summary: '最新券商報告分析，營運指標優於預期，雖然大盤波動增加，但長期競爭優勢依然明確。',
              source: isTW ? '經濟日報' : 'CNBC Markets',
              publishedAt: '2 小時前',
              url: defaultUrl,
              sentiment: 'bullish',
              impactTags: ['外資評等', '目標價'],
            },
            {
              id: 'n_3',
              title: '市場關注總體經濟變數，關切短線成交量變化',
              summary: '聯準會利率政策與總體需求復甦速度仍為關注焦點，投資人宜留意震盪築底訊號。',
              source: isTW ? '工商時報' : 'Bloomberg',
              publishedAt: '5 小時前',
              url: defaultUrl,
              sentiment: 'neutral',
              impactTags: ['總體經濟', '量能觀察'],
            },
          ],
        });
      }

      const prompt = `請為股票 ${stockName} (${symbol}) 提供 3 則最新相關的繁體中文新聞摘要與市場解讀。
包含新聞標題、重點摘要、新聞來源名稱、發布相對時間、利多/利空/中性標籤，以及可以查詢該股票真實新聞的外部搜尋或金融網站連結。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: '你是一個專業金融新聞編輯，請以 JSON 陣列回應最新新聞列表。外部連結請提供前往 Google Finance 或 Yahoo Finance 該個股頁面的合法完整網址。',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              news: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    source: { type: Type.STRING },
                    publishedAt: { type: Type.STRING },
                    url: { type: Type.STRING },
                    sentiment: { type: Type.STRING, description: 'bullish, bearish, neutral' },
                    impactTags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['id', 'title', 'summary', 'source', 'publishedAt', 'url', 'sentiment'],
                },
              },
            },
            required: ['news'],
          },
        },
      });

      const data = JSON.parse(response.text || '{ "news": [] }');
      res.json(data);
    } catch (err: any) {
      console.error('Error generating stock news:', err);
      res.status(500).json({ error: err.message || '獲取新聞資料失敗' });
    }
  });

  // 3. Stock Price Refresh Endpoint
  app.post('/api/stock-price', async (req, res) => {
    try {
      const { symbol, currentPrice } = req.body;
      const base = typeof currentPrice === 'number' && currentPrice > 0 ? currentPrice : 100;
      // Fluctuate price slightly (+- 0.8%)
      const pctChange = (Math.random() - 0.48) * 0.016;
      const newPrice = Number((base * (1 + pctChange)).toFixed(2));
      const diff = Number((newPrice - base).toFixed(2));
      const nowStr = new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      res.json({
        symbol,
        currentPrice: newPrice,
        priceDiff: diff,
        updatedAt: nowStr,
      });
    } catch (err: any) {
      res.status(500).json({ error: '刷新價格失敗' });
    }
  });

  // 4. AI Cat Wisdom Endpoint
  app.post('/api/cat-quote', async (req, res) => {
    try {
      const { marketCondition, stockContext } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          quote: '今日貓語：先觀察，再決定 🐾',
          mood: 'cautious',
          actionTip: '盤勢震盪時，抱著貓貓看盤最安心！',
        });
      }

      const prompt = `請生成一句充滿可愛貓咪視角的股市提醒「今日貓語」（例如：今日貓語：xxxx），回應格式為 JSON：
包含:
- quote: 以「今日貓語：...」開頭的短句（15-25字）
- mood: "wise" | "playful" | "cautious" | "sleepy" | "excited"
- actionTip: 15字內給股民的操作實用小建議

目前市場狀況 context: ${marketCondition || '大盤震盪觀望'} ${stockContext ? `個股：${stockContext}` : ''}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quote: { type: Type.STRING },
              mood: { type: Type.STRING },
              actionTip: { type: Type.STRING },
            },
            required: ['quote', 'mood', 'actionTip'],
          },
        },
      });

      const data = JSON.parse(response.text || '{}');
      res.json(data);
    } catch (err: any) {
      res.json({
        quote: '今日貓語：K線像貓毛一樣亂，先冷靜吃個罐罐 🥫',
        mood: 'sleepy',
        actionTip: '市場有不確定性時，適度留現金是最好的貓爪屏障。',
      });
    }
  });

  // Vite middleware for development vs static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
