import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';
import { ChatDrawer } from '../components/ChatDrawer';
import { Toast } from '../components/Toast';
import { NewsArticle, CategoryCount } from '../types';
import { newsApi } from '../services/api';
import { useSavedNews } from '../hooks/useSavedNews';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<CategoryCount[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const { isSaved, toggleSave } = useSavedNews();

  const fetchCategoryCounts = async () => {
    try {
      const counts = await newsApi.getCategories();
      setCategoryCounts(counts);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCategoryCounts();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await newsApi.refreshNews();
      setLastUpdated(new Date());
      await fetchCategoryCounts();
      setToastMessage('Live news refreshed with latest stories!');
      // Dispatch custom event to notify current active page
      window.dispatchEvent(new CustomEvent('news_refreshed'));
    } catch {
      setToastMessage('Failed to refresh feeds. Check network connectivity.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 antialiased selection:bg-sky-500 selection:text-white overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar categoryCounts={categoryCounts} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto pb-16 lg:pb-0">
        <Header
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          onSearch={(q) => navigate(`/latest?search=${encodeURIComponent(q)}`)}
        />

        <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Outlet
            context={{
              onOpenDetail: (article: NewsArticle) => navigate(`/news/${article._id}`),
              showToast,
              categoryCounts,
            }}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />

      {/* Global Floating AI Chat Widget */}
      <ChatDrawer />

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
