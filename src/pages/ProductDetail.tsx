import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, Product } from '../api'
import { cartActions } from '../cart'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [p, setP] = useState<Product | null>(null)

  useEffect(() => {
    if (!id) return
    api.productById(id).then(setP).catch(() => setP(null))
  }, [id])

  if (!p) return <div className="detail-page"><div className="loading">加载中…</div></div>

  const price = p.discountedPrice ?? p.originalPrice
  const save = p.discountedPrice ? p.originalPrice - price : 0

  return (
    <div className="detail-page">
      <Link to="/products" className="back">← 返回列表</Link>
      <div className="detail-card">
        <div className="detail-img" style={{ backgroundImage: `url(${p.image})` }} />
        <div className="detail-info">
          <div className="detail-tags">
            {(p.tags || []).map((t) => <span key={t} className="tag">{t}</span>)}
          </div>
          <h1 className="detail-name">{p.name}</h1>
          <p className="detail-cat">分类：{p.categoryId}</p>
          <div className="detail-price-block">
            <span className="now">¥{price}</span>
            {p.discountedPrice && <span className="old">¥{p.originalPrice}</span>}
            {save > 0 && <span className="save">省 ¥{save}</span>}
          </div>
          <div className="detail-stock">库存：{p.stock} 件</div>
          <div className="detail-desc">
            <span className="label">商品简介</span>
            <p>{p.description}</p>
          </div>
          <button className="buy-btn" onClick={() => {
            const price = p.discountedPrice ?? p.originalPrice
            cartActions.add({ id: p.id, name: p.name, image: p.image, price, originalPrice: p.originalPrice, stock: p.stock })
          }}>加入购物车</button>
        </div>
      </div>
    </div>
  )
}
