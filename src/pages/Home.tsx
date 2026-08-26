import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, Category, Product } from '../api'
import './Home.css'

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [popular, setPopular] = useState<Product[]>([])

  useEffect(() => {
    api.categories().then(setCategories).catch(() => setCategories([]))
    api.popular().then(setPopular).catch(() => setPopular([]))
  }, [])

  return (
    <div className="home">
      <SectionTitle title="品类导航" sub="按品类逛好物" />
      <div className="cat-grid">
        {categories.map((c) => (
          <Link key={c.id} to={`/products?cat=${c.id}`} className="cat-card">
            <span className="cat-name">{c.name}</span>
            <span className="cat-count">{c.productCount} 件</span>
          </Link>
        ))}
      </div>

      <SectionTitle title="热销好物" sub="精选道地本草" />
      <div className="prod-grid">
        {popular.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>

      <div className="see-more">
        <Link to="/products">查看全部商品 →</Link>
      </div>
    </div>
  )
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      <span className="section-sub">{sub}</span>
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
