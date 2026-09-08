import { useState, useRef, useEffect } from 'react'
import './RagWidget.css'

// 走商城后端代理：key 由 server 持有，不暴露到浏览器
const RAG_URL = '/api/rag'
const MALL_API = '/api'
const SHOW_SOURCES = false

interface Product {
  id: string
  name: string
  image: string
  discountedPrice?: number
  originalPrice: number
  stock: number
}

interface Message {
  role: 'user' | 'ai'
  text: string
  sources?: { doc: string; score: number; text: string }[]
  product_ids?: string[]
  products?: Product[]
}

export default function RagWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [msgs, loading])

  const ask = async (override?: string) => {
    const q = (override || input).trim()
    if (!q || loading) return
    setInput('')
    setMsgs(m => [...m, { role: 'user', text: q }])
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${RAG_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      })
      const data = await res.json()
      // 如果有商品 ID，先查商品详情
      let items: Product[] = []
      if (data.product_ids && data.product_ids.length > 0) {
        const details = await Promise.all(
          data.product_ids.map((id: string) =>
            fetch(`${MALL_API}/products/${id}`).then(r => r.json()).catch(() => null)
          )
        )
        items = details.filter((r): r is any => r && r.success).map(r => r.data)
      }
      setMsgs(m => [...m, { role: 'ai', text: data.answer || '（无回答）', sources: data.sources, product_ids: data.product_ids, products: items }])
    } catch {
      setError('RAG 服务未响应，请检查 localhost:8000')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button className="rag-fab" onClick={() => setOpen(!open)} title="智能客服">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
      </button>

      {open && (
        <div className="rag-panel">
          <div className="rag-header">
            <span className="rag-title">智能客服</span>
            <button className="rag-close" onClick={() => setOpen(false)}>×</button>
          </div>

          <div className="rag-body" ref={listRef}>
            {msgs.length === 0 && (
              <div className="rag-welcome">
                <div className="rag-welcome-icon">🍵</div>
                <p>有任何问题，问我试试</p>
                <div className="rag-suggestions">
                  {['有什么商品推荐', '运费怎么算', '支持退换货吗', '订单查询', '退货退款'].map(s => (
                    <button key={s} className="rag-sugg" onClick={() => { setInput(s); ask(s) }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgs.map((m, i) => (
              <div key={i} className={`rag-msg rag-msg-${m.role}`}>
                <div className="rag-bubble">
                  {m.text}
                  {SHOW_SOURCES && m.sources && m.sources.length > 0 && (
                    <div className="rag-sources">
                      {m.sources.map((s, j) => (
                        <div key={j} className="rag-source">
                          <span className="rag-source-tag">{s.doc}</span>
                          <span className="rag-source-text">{s.text.length > 80 ? s.text.slice(0, 80) + '…' : s.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {m.products && m.products.length > 0 && (
                    <div className="rag-products">
                      <div className="rag-products-title">🛒 推荐商品</div>
                      {m.products.map(p => (
                        <a key={p.id} className="rag-product-card" href={`/products/${p.id}`} onClick={() => setOpen(false)}>
                          <img className="rag-product-img" src={p.image} alt={p.name} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                          <div className="rag-product-info">
                            <div className="rag-product-name">{p.name}</div>
                            <div className="rag-product-price">
                              {p.discountedPrice ? (
                                <><span>¥{p.discountedPrice}</span><del>¥{p.originalPrice}</del></>
                              ) : (
                                <span>¥{p.originalPrice}</span>
                              )}
                            </div>
                          </div>
                          <span className="rag-product-go">查看 →</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="rag-msg rag-msg-ai">
                <div className="rag-bubble rag-typing">
                  <span className="dot"/> <span className="dot"/> <span className="dot"/>
                </div>
              </div>
            )}

            {error && <div className="rag-error">{error}</div>}
          </div>

          <div className="rag-footer">
            <input
              className="rag-input"
              value={input}
              placeholder="输入问题…"
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), ask())}
            />
            <button className="rag-send" onClick={() => ask()} disabled={loading || !input.trim()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
