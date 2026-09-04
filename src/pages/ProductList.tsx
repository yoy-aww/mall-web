import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, Category, Product } from '../api'
import './ProductList.css'

export default function ProductList() {
  const [params] = useSearchParams()
  const cat = params.get('cat') || ''
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetch = async () => {
      const [ps, cs] = await Promise.all([api.products(), api.categories()])
      setProducts(ps)
      setCategories(cs)
      setLoading(false)
    }
    fetch().catch(() => { setLoading(false); setError('加载失败，请稍后重试') })
  }, [])

  const filtered = useMemo(() => {
    return cat ? products.filter((p) => p.categoryId === cat) : products
  }, [products, cat])

  const curCat = categories.find((c) => c.id === cat)

  return (
    <div className="list-page">
      <div className="page-head">
        <h1 className="page-title">{curCat?.name || '全部商品'}</h1>
        <span className="page-sub">共 {filtered.length} 件</span>
      </div>
      <div className="filter-bar">
        <Link to="/products" className={`chip ${!cat ? 'on' : ''}`}>全部</Link>
        {categories.map((c) => (
          <Link key={c.id} to={`/products?cat=${c.id}`} className={`chip ${cat === c.id ? 'on' : ''}`}>
            {c.name}
          </Link>
        ))}
      </div>
      {loading ? (
        <div className="prod-grid loading-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="prod-card skeleton">
              <div className="prod-img skeleton-block" />
              <div className="prod-body">
                <div className="skeleton-line w60" />
                <div className="skeleton-line w40" />
                <div className="skeleton-line w30" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty">😵 {error}</div>
      ) : filtered.length === 0 ? (
        <div className="empty">暂无商品</div>
      ) : (
        <div className="prod-grid">
          {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}

function ProductCard({ p }: { p: Product }) {
  const price = p.discountedPrice ?? p.originalPrice
  const discount = p.discountedPrice ? Math.round((price / p.originalPrice) * 10) : null
  return (
    <Link to={`/products/${p.id}`} className="prod-card">
      <div className="prod-img" style={{ backgroundImage: `url(${p.image})` }} />
      <div className="prod-body">
        <div className="prod-tags">
          {(p.tags || []).slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
        <div className="prod-name">{p.name}</div>
        <div className="prod-price">
          <span className="now">¥{price}</span>
          {p.discountedPrice && <span className="old">¥{p.originalPrice}</span>}
          {discount && <span className="badge">{discount}折</span>}
        </div>
        <div className="prod-stock">库存 {p.stock} 件</div>
      </div>
    </Link>
  )
}
