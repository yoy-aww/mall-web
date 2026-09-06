// 购物车 store（纯前端，localStorage 持久化，零第三方依赖）
// 按用户隔离：游客用 guyibu_cart_guest，登录用户用 guyibu_cart_<userId>，互不串数据。
// 登录时把游客购物车合并进该用户自己的购物车；老版单一 key 只做一次无脑迁移。
import { useState, useEffect } from 'react'
import { subscribe, getUser } from './auth'

export interface CartItem {
  id: string
  name: string
  image: string
  price: number
  originalPrice: number
  stock: number
  quantity: number
}

const LEGACY_KEY = 'guyibu_cart'          // 旧版全局 key，只迁移一次
const GUEST_KEY = 'guyibu_cart_guest'
const CART_KEY_PREFIX = 'guyibu_cart_'

function cartKeyForUser(user: { id: string } | null): string {
  return user ? `${CART_KEY_PREFIX}${user.id}` : GUEST_KEY
}

function parseItems(raw: string | null): CartItem[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw) as CartItem[]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function persist(key: string, items: CartItem[]) {
  try { localStorage.setItem(key, JSON.stringify(items)) } catch { /* 存储满/隐私模式：静默 */ }
}

// 老 key 有数据而新 key 为空 → 搬过去，删掉老 key。幂等，之后不再触发。
function migrateLegacyCart(targetKey: string) {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (!legacy) return
    if (localStorage.getItem(targetKey)) { localStorage.removeItem(LEGACY_KEY); return }
    persist(targetKey, parseItems(legacy))
    localStorage.removeItem(LEGACY_KEY)
  } catch { /* 迁移失败不阻塞 */ }
}

// 登录时把游客购物车并进该用户购物车：同商品累加数量（封顶库存），其余直接追加。
function mergeGuestIntoUser(userId: string) {
  const guestKey = GUEST_KEY
  const userKey = `${CART_KEY_PREFIX}${userId}`
  try {
    const guest = parseItems(localStorage.getItem(guestKey))
    if (guest.length === 0) { localStorage.removeItem(guestKey); return }
    const base = parseItems(localStorage.getItem(userKey))
    for (const item of guest) {
      const idx = base.findIndex(x => x.id === item.id)
      if (idx >= 0) {
        base[idx].quantity = Math.min((base[idx].quantity || 0) + (item.quantity || 0), item.stock)
      } else {
        base.push(item)
      }
    }
    persist(userKey, base)
    localStorage.removeItem(guestKey)
  } catch { /* 合并失败不阻塞登录 */ }
}

function load(): CartItem[] {
  const key = cartKeyForUser(getUser())
  migrateLegacyCart(key)
  return parseItems(localStorage.getItem(key))
}

let state: CartItem[] = load()
const listeners = new Set<() => void>()
function notify() {
  listeners.forEach(fn => fn())
}

// 读当前作用域（登录用户 / 游客）的购物车并做变换，写回同一个 key。
function withCurrentCart(fn: (items: CartItem[]) => CartItem[]) {
  const key = cartKeyForUser(getUser())
  migrateLegacyCart(key)
  const next = fn(parseItems(localStorage.getItem(key)))
  state = next
  persist(key, next)
  notify()
}

export function useCartStore() {
  const [items, setItems] = useState(load())
  const refresh = () => setItems(load())
  useEffect(() => {
    listeners.add(refresh)
    // 切号 / 登录 / 退出：先把游客数据并进新用户，再读新用户自己的购物车。
    const unsubAuth = subscribe(() => {
      const user = getUser()
      if (user) mergeGuestIntoUser(user.id)
      state = load()
      setItems(state)
    })
    return () => { listeners.delete(refresh); unsubAuth() }
  }, [])
  return items
}

export const cartActions = {
  add(p: { id: string; name: string; image: string; price: number; originalPrice: number; stock: number }, n = 1) {
    withCurrentCart(items => {
      const idx = items.findIndex(x => x.id === p.id)
      if (idx >= 0) items[idx].quantity = Math.min(items[idx].quantity + n, p.stock)
      else items.push({ ...p, quantity: Math.min(n, p.stock) })
      return items
    })
  },
  setQuantity(id: string, qty: number, stock: number) {
    withCurrentCart(items => {
      const idx = items.findIndex(x => x.id === id)
      if (idx < 0) return items
      const q = Math.max(0, Math.min(qty, stock))
      if (q === 0) items.splice(idx, 1)
      else items[idx].quantity = q
      return items
    })
  },
  remove(id: string) { withCurrentCart(items => items.filter(x => x.id !== id)) },
  clear() { withCurrentCart(() => []) },
}

export function cartSummary(items: CartItem[]) {
  return items.reduce((s, x) => ({ total: s.total + x.price * x.quantity, count: s.count + x.quantity }), { total: 0, count: 0 })
}
