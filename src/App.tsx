import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, StockItem } from './types';
import { DEFAULT_USERS, INITIAL_STOCKS } from './data/mockStocks';
import { fetchBatchLiveQuotes, fetchLiveStockQuote } from './services/stockService';
import { Navbar } from './components/Navbar';
import { Watchlist } from './components/Watchlist';
import { StockDetailModal } from './components/StockDetailModal';
import { AddStockModal } from './components/AddStockModal';
import { UserModal } from './components/UserModal';
import { CatAssistant } from './components/CatAssistant';

export default function App() {
  // 1. Users state
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('cat_stock_users_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load users from localStorage', e);
      }
    }
    return DEFAULT_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const savedId = localStorage.getItem('cat_stock_current_user_id');
    if (savedId && users.some((u) => u.id === savedId)) return savedId;
    return users[0]?.id || 'user_a';
  });

  // Active User object
  const currentUser = users.find((u) => u.id === currentUserId) || users[0] || DEFAULT_USERS[0];

  // 2. All stocks pool
  const [stocksMap, setStocksMap] = useState<Record<string, StockItem>>(() => {
    const saved = localStorage.getItem('cat_stock_pool_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load stock pool', e);
      }
    }
    return INITIAL_STOCKS;
  });

  // 3. UI Modes & Color Scheme
  const [colorScheme, setColorScheme] = useState<'tw' | 'us'>('tw');
  const [isRefreshingLiveQuotes, setIsRefreshingLiveQuotes] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedStockForDetail, setSelectedStockForDetail] = useState<StockItem | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'trend' | 'news' | 'predict'>('trend');

  // Function to refresh live stock quotes from online API
  const handleRefreshLiveQuotes = useCallback(async () => {
    setIsRefreshingLiveQuotes(true);
    try {
      const watchlistSymbols = currentUser.watchlist || [];
      const allSymbols = Array.from(
        new Set([
          ...watchlistSymbols,
          '2330.TW',
          'NVDA',
          '0050.TW',
          '2454.TW',
          'TSLA',
          'AAPL',
          'MSFT',
        ])
      );

      const liveQuotesMap = await fetchBatchLiveQuotes(allSymbols);

      if (Object.keys(liveQuotesMap).length > 0) {
        setStocksMap((prev) => {
          const updated = { ...prev };
          for (const [sym, liveData] of Object.entries(liveQuotesMap)) {
            if (updated[sym] && liveData) {
              updated[sym] = {
                ...updated[sym],
                ...liveData,
              };
            } else if (liveData && liveData.symbol) {
              // Create if missing
              updated[sym] = {
                id: `live_${Date.now()}_${sym}`,
                symbol: sym,
                name: liveData.name || sym,
                category: liveData.category || 'tw_stock',
                currency: liveData.currency || 'TWD',
                currentPrice: liveData.currentPrice || 0,
                changeAmount: liveData.changeAmount || 0,
                changePercent: liveData.changePercent || 0,
                performance: liveData.performance || { d1: 0, w1: 0, m1: 0, m3: 0, y1: 0 },
                chartData: liveData.chartData || { '1D': [], '1W': [], '1M': [], '3M': [], '1Y': [] },
                high52w: liveData.high52w,
                low52w: liveData.low52w,
              };
            }
          }
          return updated;
        });

        const now = new Date();
        const formattedTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        setLastUpdatedTime(formattedTime);
      }
    } catch (err) {
      console.error('Failed to fetch live quotes:', err);
    } finally {
      setIsRefreshingLiveQuotes(false);
    }
  }, [currentUser.watchlist]);

  // Auto fetch live stock quotes on mount and when active user changes
  useEffect(() => {
    handleRefreshLiveQuotes();
  }, [currentUserId]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('cat_stock_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('cat_stock_current_user_id', currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('cat_stock_pool_v2', JSON.stringify(stocksMap));
  }, [stocksMap]);

  // Derived stock list for current user
  const currentUserStocks: StockItem[] = (currentUser.watchlist || [])
    .map((symbol) => stocksMap[symbol])
    .filter((s): s is StockItem => Boolean(s));

  // Handlers for Watchlist Reordering
  const handleReorderStocks = (newOrderSymbols: string[]) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => (u.id === currentUser.id ? { ...u, watchlist: newOrderSymbols } : u))
    );
  };

  // Add stock to current user's watchlist
  const handleAddStock = (stock: StockItem) => {
    setStocksMap((prev) => ({
      ...prev,
      [stock.symbol]: prev[stock.symbol] || stock,
    }));

    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === currentUser.id) {
          const exists = u.watchlist.includes(stock.symbol);
          if (exists) return u;
          return { ...u, watchlist: [...u.watchlist, stock.symbol] };
        }
        return u;
      })
    );
  };

  // Remove stock from current user's watchlist
  const handleRemoveStock = (symbol: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === currentUser.id) {
          return { ...u, watchlist: u.watchlist.filter((s) => s !== symbol) };
        }
        return u;
      })
    );
  };

  // Create new User Profile
  const handleCreateUser = (name: string, avatar: string, roleDescription: string) => {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name,
      avatar,
      roleDescription,
      watchlist: ['2330.TW', 'NVDA', '0050.TW'],
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
  };

  // Delete User Profile
  const handleDeleteUser = (userId: string) => {
    const remaining = users.filter((u) => u.id !== userId);
    if (remaining.length === 0) return;
    setUsers(remaining);
    if (currentUserId === userId) {
      setCurrentUserId(remaining[0].id);
    }
  };

  // Update User Profile Name
  const handleUpdateUserName = (userId: string, newName: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, name: newName } : u))
    );
  };

  // Export Data JSON
  const handleExportData = () => {
    const data = {
      users,
      stocksMap,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cat-stock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  // Import Data JSON
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.users && parsed.stocksMap) {
          setUsers(parsed.users);
          setStocksMap(parsed.stocksMap);
          if (parsed.users[0]?.id) setCurrentUserId(parsed.users[0].id);
          alert('成功匯入個人設定檔與觀察清單！');
        }
      } catch (err) {
        alert('匯入失敗：請確認 JSON 檔案格式正確。');
      }
    };
    reader.readAsText(file);
  };

  // Live stock price update from Detail Modal
  const handleUpdateStockPrice = (updated: Partial<StockItem> & { symbol: string }) => {
    setStocksMap((prev) => {
      const existing = prev[updated.symbol];
      if (!existing) return prev;
      return {
        ...prev,
        [updated.symbol]: {
          ...existing,
          ...updated,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 font-sans selection:bg-zinc-800 selection:text-white pb-28">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        users={users}
        onSelectUser={(u) => setCurrentUserId(u.id)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        colorScheme={colorScheme}
        onToggleColorScheme={() => setColorScheme((prev) => (prev === 'tw' ? 'us' : 'tw'))}
        onRefreshLiveQuotes={handleRefreshLiveQuotes}
        isRefreshing={isRefreshingLiveQuotes}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <Watchlist
          currentUser={currentUser}
          stocks={currentUserStocks}
          colorScheme={colorScheme}
          onReorderStocks={handleReorderStocks}
          onRemoveStock={handleRemoveStock}
          onSelectStockDetail={(s, tab = 'trend') => {
            setSelectedStockForDetail(s);
            setDetailModalTab(tab);
          }}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onRefreshLiveQuotes={handleRefreshLiveQuotes}
          isRefreshing={isRefreshingLiveQuotes}
          lastUpdatedTime={lastUpdatedTime}
        />
      </main>

      {/* Wandering Cat Assistant */}
      <CatAssistant
        currentStockContext={
          currentUserStocks[0] ? `${currentUserStocks[0].name} (${currentUserStocks[0].symbol})` : undefined
        }
      />

      {/* Modals */}
      {isAddModalOpen && (
        <AddStockModal
          existingSymbols={currentUser.watchlist}
          onAddStock={handleAddStock}
          onClose={() => setIsAddModalOpen(false)}
        />
      )}

      {isUserModalOpen && (
        <UserModal
          currentUser={currentUser}
          users={users}
          onSelectUser={(u) => setCurrentUserId(u.id)}
          onCreateUser={handleCreateUser}
          onDeleteUser={handleDeleteUser}
          onUpdateUserName={handleUpdateUserName}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onClose={() => setIsUserModalOpen(false)}
        />
      )}

      {selectedStockForDetail && (
        <StockDetailModal
          stock={selectedStockForDetail}
          initialTab={detailModalTab}
          onClose={() => setSelectedStockForDetail(null)}
          colorScheme={colorScheme}
          onUpdateStockPrice={handleUpdateStockPrice}
        />
      )}
    </div>
  );
}
