// 统一 API 请求层
import { getUser, getToken } from './auth'
const API_BASE = '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as object) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error || `请求失败 (${res.status})`;
    throw new Error(msg);
  }
  const data = (await res.json()) as { success: boolean; data: T; error?: string };
  if (!data.success) throw new Error(data.error || '接口返回失败');
  // 浏览器端七牛 https:// 端点不稳，降级为 http://（小程序端本就 http，正常）
  return fixHttps(data.data) as T
}
// 七牛外链 HTTP 正常、HTTPS 不稳，展示用图统一降级为 http
function fixHttps(v: any): any {
  if (typeof v === 'string') return v.replace(/^https:\/\//, 'http://')
  if (Array.isArray(v)) return v.map(x => fixHttps(x))
  if (v && typeof v === 'object') return Object.fromEntries(
    Object.entries(v).map(([k, val]) => [k, fixHttps(val)])
  )
  return v
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
  sortOrder: number;
}
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  sortOrder: number;
  enabled: number;
  audioUrl: string;
}
export interface Product {
  id: string;
  name: string;
  image: string;
  originalPrice: number;
  discountedPrice: number | null;
  categoryId: string;
  description: string;
  stock: number;
  tags: string[];
}
export interface Review {
  id: string;
  productId: string;
  userId: string;
  username: string;
  nickname: string;
  rating: number;
  content: string;
  images: string[];
  reply?: string;
  replyAt?: string;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  receiverName: string;
  receiverPhone: string;
  province: string;
  city: string;
  address: string;
  isDefault: number;
}

export interface AfterSale {
  id: string;
  orderId: string;
  userId: string;
  orderStatus: string;
  items: { productId: string; productName: string; quantity: number }[];
  reason: string;
  description: string;
  images: string[];
  status: string;
  handleReason?: string;
  createdAt: string;
  handledAt?: string;
}

export const api = {
  banners: () => request<Banner[]>('/banners'),
  categories: () => request<Category[]>('/categories'),
  products: () => request<Product[]>('/products'),
  productById: (id: string) => request<Product>(`/products/${id}`),
  productsByCategory: (categoryId: string) =>
    request<Product[]>(`/products/category/${categoryId}`),
  popular: () => request<Product[]>('/products/popular'),
  grouped: () => request<Record<string, Product[]>>('/products/grouped'),
  search: (q: string) => request<Product[]>(`/products/search?q=${encodeURIComponent(q)}`),

  // 用户认证
  login: (username: string, password: string) =>
    request<{ token: string; user: { id: string; username: string; nickname: string; role: string; phone: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string, nickname?: string, phone?: string) =>
    request<{ id: string; username: string; role: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, nickname, phone }),
    }),
  me: () => request<{ id: string; username: string; nickname: string; role: string }>('/auth/me'),

  // 用户信息
  updateMe: (data: { nickname?: string; phone?: string }) => {
    const uid = getUser()?.id || '';
    return request<{ id: string }>(`/auth/users/${uid}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  changePassword: (oldPassword: string, newPassword: string) =>
    request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    }),

  // 订单
  myOrders: () => {
    const uid = getUser()?.id;
    return request<any[]>(`/orders${uid ? `?userId=${uid}` : ''}`);
  },
  createOrder: (data: {
    userId: string; items: { productId: string; productName: string; productImage: string; price: number; quantity: number }[];
    totalAmount: number; shippingAddress: string; receiverName: string; receiverPhone: string; remark?: string;
  }) =>
    request<{ id: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 评价
  reviews: (productId: string) => request<Review[]>(`/reviews?productId=${encodeURIComponent(productId)}`),
  reviewStats: (productId: string) =>
    request<{ avg: number; total: number; dist: number[] }>(`/reviews/product/${encodeURIComponent(productId)}/stats`),
  createReview: (data: { productId: string; userId: string; rating: number; content: string }) =>
    request<{ id: string }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 地址簿
  addresses: () => request<Address[]>('/addresses'),
  createAddress: (data: Partial<Address>) =>
    request<{ id: string }>('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAddress: (id: string, data: Partial<Address>) =>
    request<{ id: string }>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteAddress: (id: string) =>
    request<{ deleted: string }>(`/addresses/${id}`, { method: 'DELETE' }),

  // 售后
  aftersales: () => request<AfterSale[]>('/aftersales'),
  createAfterSale: (data: { orderId: string; items: { productId: string; productName: string; quantity: number }[]; reason: string; description: string }) =>
    request<{ id: string }>('/aftersales', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
