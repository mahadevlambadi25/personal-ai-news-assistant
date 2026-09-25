import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { LanguageProvider } from './context/LanguageContext';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { LatestNewsPage } from './pages/LatestNewsPage';
import { CategoryPage } from './pages/CategoryPage';
import { KnowledgePage } from './pages/KnowledgePage';
import { SavedPage } from './pages/SavedPage';
import { ChatPage } from './pages/ChatPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NewsDetailPage } from './pages/NewsDetailPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LanguageProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="latest" element={<LatestNewsPage />} />
              <Route path="news/:id" element={<NewsDetailPage />} />
              <Route path="category/:category" element={<CategoryPage />} />
              <Route path="knowledge" element={<KnowledgePage />} />
              <Route path="saved" element={<SavedPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;
