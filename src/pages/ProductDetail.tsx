import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api, Product, Review } from '../api'
import { cartActions } from '../cart'
import { getUser } from '../auth'
import './ProductDetail.css'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [p, setP] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState({ avg: 0, total: 0, dist: [0, 0, 0, 0, 0] })
  const [categoryName, setCategoryName] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ rating: 5, content: '' })
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState('')
  const user = getUser()

  useEffect(() => {
    if (!id) return
    api.productById(id).then(p => {
      setP(p)
      if (p?.categoryId) api.categories().then(cs => {
        const c = cs.find(x => x.id === p.categoryId)
        if (c) setCategoryName(c.name)
      }).catch(() => {})
    }).catch(() => setP(null))
    loadReviews()
  }, [id])

  const loadReviews = () => {
    if (!id) return
    api.reviews(id).then(setReviews).catch(() => setReviews([]))
    api.reviewStats(id).then(setStats).catch(() => {})
  }

  const handleSubmit = async () => {
    if (!user || !id) return
    if (!form.content.trim()) { setMsg('请写几句评价'); return }
    setSubmitting(true)
    setMsg('')
    try {
      await api.createReview({ productId: id, userId: user.id, rating: form.rating, content: form.content.trim() })
      setForm({ rating: 5, content: '' })
      setShowForm(false)
      loadReviews()
      setMsg('评价成功，感谢您的反馈！')
    } catch (err: any) {
      setMsg(err.message || '评价失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!p) {
    if (error) return <div className="detail-page"><div style={{textAlign:'center',padding:'90px 0',color:'var(--text-muted)'}}><div style={{fontSize:48,marginBottom:12}}>😵</div><div style={{fontSize:16,marginBottom:8}}>商品不存在</div><Link to="/products" className="btn btn-ghost" style={{display:'inline-block',padding:'8px 20px',border:'1px solid var(--line)',borderRadius:'var(--radius)'}}>← 返回列表</Link></div></div>
    return <div className="detail-page"><div style={{textAlign:'center',padding:'120px 0',color:'var(--text-muted)'}}><div className="loading">加载中…</div></div></div>
  }

  const price = p.discountedPrice ?? p.originalPrice
  const save = p.discountedPrice ? p.originalPrice - price : 0

  return (
    <div className="detail-page">
      <Link to="/products" className="back">← 返回列表</Link>
      <div className="detail-card">
        <div className="detail-img" style={{ backgroundImage: `url(${p.image})` }} />
        <div className="detail-info">
          <div className="detail-tags">
            {(p.tags || []).map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          <h1 className="detail-name">{p.name}</h1>
          <p className="detail-cat">分类：{categoryName}</p>
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
            cartActions.add({ id: p.id, name: p.name, image: p.image, price, originalPrice: p.originalPrice, stock: p.stock })
          }}>加入购物车</button>
        </div>
      </div>

      {/* 评价区 */}
      <div className="detail-reviews">
        <h3 className="reviews-title">用户评价 ({stats.total})</h3>

        {stats.total > 0 && (
          <div className="review-summary">
            <div className="summary-left">
              <span className="summary-avg">{stats.avg.toFixed(1)}</span>
              <Stars value={Math.round(stats.avg)} />
              <span className="summary-count">{stats.total} 条评价</span>
            </div>
            <div className="summary-dist">
              {[5, 4, 3, 2, 1].map(n => (
                <div key={n} className="dist-row">
                  <span className="dist-label">{n}星</span>
                  <div className="dist-bar">
                    <div className="dist-fill" style={{ width: `${stats.total ? (stats.dist[n - 1] / stats.total * 100) : 0}%` }} />
                  </div>
                  <span className="dist-count">{stats.dist[n - 1]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {msg && <div className="review-msg">{msg}</div>}

        {user ? (
          showForm ? (
            <div className="review-form">
              <div className="form-rating">
                <span>评分：</span>
                <div className="star-picker">
                  {[1, 2, 3, 4, 5].map(n => (
                    <span
                      key={n}
                      className={`star ${(hover || form.rating) >= n ? 'on' : ''}`}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setForm(f => ({ ...f, rating: n }))}
                    >★</span>
                  ))}
                </div>
              </div>
              <textarea
                className="form-textarea"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="说说你对这个商品的使用感受..."
                rows={4}
                maxLength={500}
              />
              <div className="form-actions">
                <button className="btn-submit" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? '提交中...' : '提交评价'}
                </button>
                <button className="btn-cancel" onClick={() => { setShowForm(false); setMsg('') }}>取消</button>
              </div>
            </div>
          ) : (
            !msg && <button className="btn-write-review" onClick={() => { setShowForm(true); setMsg('') }}>写评价</button>
          )
        ) : (
          !msg && (
            <div className="review-login-hint">
              <Link to={`/auth?from=/products/${id}`}>登录</Link> 后可以写评价
            </div>
          )
        )}

        <div className="review-list">
          {reviews.length === 0 && <div className="review-empty">暂无评价，快来抢沙发吧</div>}
          {reviews.map(r => (
            <div key={r.id} className="review-card">
              <div className="review-header">
                <div className="review-avatar">{(r.nickname || r.username).charAt(0)}</div>
                <div className="review-meta">
                  <span className="review-name">{r.nickname || r.username}</span>
                  <Stars value={r.rating} />
                </div>
                <span className="review-date">{(r.createdAt || '').slice(0, 10)}</span>
              </div>
              <p className="review-content">{r.content}</p>
              {r.images && r.images.length > 0 && (
                <div className="review-images">
                  {r.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="review-img" />
                  ))}
                </div>
              )}
              {r.reply && (
                <div className="review-reply">
                  <span className="reply-label">商家回复：</span>
                  <span className="reply-text">{r.reply}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stars({ value }: { value: number }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={n <= value ? 'star on' : 'star'}>★</span>
      ))}
    </span>
  )
}
