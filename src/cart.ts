// 全局购物车 store（纯前端，localStorage 持久化，零第三方依赖）
import { useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  image: string
  price: number
  originalPrice: number
  stock: number
  quantity: number
}

const KEY = 'guyibu_cart'

function load(): CartItem[] {
  try {
    const v = localStorage.getItem(KEY)
    if (!v) return []
    const arr = JSON.parse(v) as CartItem[]
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

let state = load()
const listeners = new Set<() => void>()
function notify() {
  localStorage.setItem(KEY, JSON.stringify(state))
  listeners.forEach(fn => fn())
}

export function useCartStore() {
  const [items, setItems] = useState(load())
  const refresh = () => setItems(load())
  useEffect(() => {
    listeners.add(refresh)
    return () => { listeners.delete(refresh) }
  }, [])
  return items
}

function save(next: CartItem[]) {
  state = next
  notify()
}

export const cartActions = {
  add(p: { id: string; name: string; image: string; price: number; originalPrice: number; stock: number }, n = 1) {
    const items = load()
    const idx = items.findIndex(x => x.id === p.id)
    if (idx >= 0) items[idx].quantity = Math.min(items[idx].quantity + n, p.stock)
    else items.push({ ...p, quantity: Math.min(n, p.stock) })
    save(items)
  },
  setQuantity(id: string, qty: number, stock: number) {
    const items = load()
    const idx = items.findIndex(x => x.id === id)
    if (idx < 0) return
    const q = Math.max(0, Math.min(qty, stock))
    if (q === 0) items.splice(idx, 1)
    else items[idx].quantity = q
    save(items)
  },
  remove(id: string) { save(load().filter(x => x.id !== id)) },
  clear() { save([]) },
}

export function cartSummary(items: CartItem[]) {
  return items.reduce((s, x) => ({ total: s.total + x.price * x.quantity, count: s.count + x.quantity }), { total: 0, count: 0 })
}
