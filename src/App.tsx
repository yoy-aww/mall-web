import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { api, Banner } from './api'
import { useCartStore, cartSummary } from './cart'
import { isLoggedIn, getUser, getToken, logout } from './auth'
import './App.css'

function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-mark">枸</span>
      <span className="logo-text">道地本草</span>
    </Link>
  )
}

function SearchBox() {
  return (
    <form className="search-box"
      onSubmit={(e) => {
        e.preventDefault()
        const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
        if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q.trim())}`
      }}>
      <input name="q" type="text" placeholder="搜 索 好 草 本" />
      <button type="submit" aria-label="搜索">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
      </button>
    </form>
  )
}

function CartIcon() {
  const items = useCartStore()
  const { count } = cartSummary(items)
  return (
    <Link to="/cart" className="cart-link" aria-label="购物车">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" />
        <path d="M2 2h2l2.4 11.1A2 2 0 0 0 8.4 15H20l1.8-7.3A2 2 0 0 0 20 6h-9.5L9 3H2z" />
      </svg>
      {count > 0 ? <span className="cart-badge">{count}</span> : null}
    </Link>
  )
}

function UserArea() {
  const user = getUser()
  const navigate = useNavigate()
  if (user) {
    return (
      <div className="user-area" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => navigate('/profile')}>
        <span className="user-avatar" style={{
          width: 32, height: 32, borderRadius: 16,
          background: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 14, fontWeight: 700,
        }}>
          {(user.nickname || user.username).charAt(0)}
        </span>
        <span style={{ fontSize: 13, color: '#333' }}>{user.nickname || user.username}</span>
        <span
          onClick={(e) => { e.stopPropagation(); logout(); navigate('/') }}
          style={{ fontSize: 12, color: '#999', cursor: 'pointer', marginLeft: 4 }}
        >退出</span>
      </div>
    )
  }
  return (
    <Link to="/auth" className="user-login-btn">登录 / 注册</Link>
  )
}

function NotifyIcon() {
  const [unread, setUnread] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!getToken()) return

    // 首次拉取兜底（已有未读消息时立即显示）
    const init = async () => {
      try {
        const d = await api.getNotifications()
        setUnread((d as any).data?.unread ?? (d as any).unread ?? 0)
      } catch { /* ignore */ }
    }
    init()

    // SSE 实时推送
    let es: EventSource | null = null
    try {
      es = new EventSource(`/api/notifications/stream?auth=${getToken()}`)
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'notification') {
            setUnread(u => u + 1)
          }
        } catch { /* ignore */ }
      }
      es.onerror = () => { /* EventSource 自动重连，忽略 */ }
    } catch { /* 网络异常时降级为轮询 */ }

    return () => {
      es?.close()
    }
  }, [])

  if (!getToken()) return null
  return (
    <span
      style={{ position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
      onClick={() => navigate('/profile')}
      title="消息通知"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
      {unread > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -6,
          backgroundColor: '#ff4d4f', color: '#fff',
          fontSize: 10, fontWeight: 700,
          padding: '1px 5px', borderRadius: 8,
          minWidth: 16, textAlign: 'center',
        }}>{unread > 99 ? '99+' : unread}</span>
      )}
    </span>
  )
}

export default function App() {
  const [banners, setBanners] = useState<Banner[]>([])
  const navigate = useNavigate()
  const location = useLocation()
  const showBanner = location.pathname === '/'
  useEffect(() => { api.banners().then(setBanners).catch(() => setBanners([])) }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />
          <SearchBox />
          <CartIcon />
          <NotifyIcon />
          <UserArea />
        </div>
      </header>
      <div className="nav">
        <nav className="nav-inner">
          <Link to="/" className="nav-link">首页</Link>
          <Link to="/products" className="nav-link">全部商品</Link>
          <Link to="/products?cat=welfare" className="nav-link">惠民专区</Link>
          <Link to="/products?cat=herbs" className="nav-link">中药材</Link>
          <Link to="/products?cat=health" className="nav-link">保健品</Link>
          <Link to="/products?cat=activity" className="nav-link">活动专区</Link>
          <Link to="/profile" className="nav-link nav-profile-link">个人中心</Link>
        </nav>
      </div>
      <main className="main">
        {showBanner && <HeroBanner banners={banners} navigate={navigate} />}
        <Outlet />
      </main>
      <footer className="footer">
        <span>枸益补 · 道地本草商城 &nbsp;|&nbsp; 同源小程序商城</span>
      </footer>
    </div>
  )
}

function HeroBanner({ banners, navigate }: { banners: Banner[]; navigate: (to: string) => void }) {
  const [idx, setIdx] = useState(0)
  const [fade, setFade] = useState(false)
  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => {
      setFade(true)
      setTimeout(() => { setIdx((i) => (i + 1) % banners.length); setFade(false) }, 300)
    }, 4500)
    return () => clearInterval(t)
  }, [banners.length])
  if (banners.length === 0) return null
  const b = banners[idx]
  const target = mapBannerLink(b.link)
  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${b.image})`, cursor: target ? 'pointer' : 'default' }}
      onClick={(e) => { e.preventDefault(); if (target) navigate(target) }}
    >
      <div className={`hero-overlay ${fade ? 'fade' : ''}`} />
      <div className="hero-content">
        <h1 className="hero-title">{b.title}</h1>
        <p className="hero-sub">{b.subtitle}</p>
        <div className="hero-dots">
          {banners.map((_, i) => (
            <span key={i} className={`dot ${i === idx ? 'on' : ''}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

function mapBannerLink(link?: string): string | null {
  if (!link) return null
  // 直接是 web 路由（以 / 开头且不包含 /pages/）
  if (link.startsWith('/') && !link.includes('/pages/')) return link
  // 小程序路径 /pages/category/category?type=xxx → /products?cat=xxx
  const m = link.match(/type=([\w-]+)/)
  if (m) return `/products?cat=${m[1]}`
  // 小程序商品详情页 /pages/product/product?id=xxx → /products/xxx
  const p = link.match(/product\/product\?id=(\w+)/)
  if (p) return `/products/${p[1]}`
  return null
}
