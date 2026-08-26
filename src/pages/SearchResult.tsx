import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, Product } from '../api'
import './SearchResult.css'

export default function SearchResult() {
  const [params] = useSearchParams()
  const q = params.get('q') || ''
  const [results, setResults] = useState<Product[]>([])

  useEffect(() => {
    if (!q) { setResults([]); return }
    api.search(q).then(setResults).catch(() => setResults([]))
  }, [q])

  return (
    <div className="search-page">
      <div className="page-head">
        <h1 className="page-title">
          搜索：<span className="q">{q}</span>
        </h1>
        <span className="page-sub">找到 {results.length} 件</span>
      </div>
      {results.length === 0 && q ? (
        <div className="empty">
          <p>没有找到关于「{q}」的商品</p>
          <Link to="/products">去全部商品逛逛 →</Link>
        </div>
      ) : (
        <div className="search-list">
          {results.map((p) => <SearchItem key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}

function SearchItem({ p }: { p: Product }) {
  const price = p.discountedPrice ?? p.originalPrice
  return (
    <Link to={`/products/${p.id}`} className="search-item">
      <div className="item-img" style={{ backgroundImage: `url(${p.image})` }} />
      <div className="item-mid">
        <div className="item-name">{p.name}</div>
        <div className="item-tags">
          {(p.tags || []).slice(0, 4).map((t) => <span key={t} className="tag">{t}</span>)}
        </div>
        <div className="item-desc">{p.description.slice(0, 50)}{p.description.length > 50 ? '…' : ''}</div>
      </div>
      <div className="item-price">
        <span className="now">¥{price}</span>
        {p.discountedPrice && <span className="old">¥{p.originalPrice}</span>}
      </div>
    </Link>
  )
}
