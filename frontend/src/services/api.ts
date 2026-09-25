import axios from 'axios';
import {
  PaginatedNews,
  ArticleDetailResponse,
  CategoryCount,
  PaginatedKnowledge,
  User,
  UserPreferences,
  ChatMessage,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('news_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired
      if (error.response?.data?.error?.code === 'TOKEN_EXPIRED') {
        localStorage.removeItem('news_auth_token');
        localStorage.removeItem('news_user');
      }
    }
    return Promise.reject(error);
  }
);

export const newsApi = {
  getNews: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: 'newest' | 'oldest';
  }): Promise<PaginatedNews> => {
    const res = await api.get('/api/news', { params });
    return res.data.data;
  },

  getNewsById: async (id: string, lang?: 'en' | 'hi'): Promise<ArticleDetailResponse> => {
    const res = await api.get(`/api/news/${id}`, {
      params: lang ? { lang } : undefined,
    });
    return res.data.data;
  },

  getCategories: async (): Promise<CategoryCount[]> => {
    const res = await api.get('/api/categories');
    return res.data.data;
  },

  refreshNews: async (): Promise<{ message: string; stats: any }> => {
    const res = await api.post('/api/news/refresh');
    return res.data.data;
  },

  saveArticle: async (id: string): Promise<boolean> => {
    const res = await api.post(`/api/news/${id}/save`);
    return res.data.data.saved;
  },

  unsaveArticle: async (id: string): Promise<boolean> => {
    const res = await api.delete(`/api/news/${id}/save`);
    return res.data.data.saved;
  },

  getSavedNews: async (params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedNews> => {
    const res = await api.get('/api/saved', { params });
    return res.data.data;
  },

  getSavedIds: async (): Promise<string[]> => {
    const res = await api.get('/api/saved/ids');
    return res.data.data;
  },
};

export const knowledgeApi = {
  getKnowledge: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedKnowledge> => {
    const res = await api.get('/api/knowledge', { params });
    return res.data.data;
  },
};

export const chatApi = {
  sendMessage: async (
    message: string,
    articleId?: string,
    language?: 'en' | 'hi'
  ): Promise<{ message: string; response: string; relatedArticles: any[] }> => {
    const res = await api.post('/api/chat', { message, articleId, language });
    return res.data.data;
  },

  getConversations: async (): Promise<any[]> => {
    const res = await api.get('/api/chat/conversations');
    return res.data.data;
  },
};

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
    whatsappNumber?: string;
  }): Promise<{ user: User; token: string }> => {
    const res = await api.post('/api/auth/register', data);
    return res.data.data;
  },

  login: async (data: { email: string; password: string }): Promise<{ user: User; token: string }> => {
    const res = await api.post('/api/auth/login', data);
    return res.data.data;
  },

  getMe: async (): Promise<{ user: User; preferences: UserPreferences }> => {
    const res = await api.get('/api/auth/me');
    return res.data.data;
  },

  getPreferences: async (): Promise<UserPreferences> => {
    const res = await api.get('/api/preferences');
    return res.data.data;
  },

  updatePreferences: async (data: Partial<UserPreferences>): Promise<UserPreferences> => {
    const res = await api.put('/api/preferences', data);
    return res.data.data;
  },
};

export default api;
