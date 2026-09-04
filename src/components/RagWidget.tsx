import { useState, useRef, useEffect } from 'react'
import './RagWidget.css'

const RAG_URL = import.meta.env.VITE_RAG_URL || 'http://localhost:8000'

interface Message {
  role: 'user' | 'ai'
  text: string
  sources?: { doc: string; score: number; text: string }[]
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
      setMsgs(m => [...m, { role: 'ai', text: data.answer || '（无回答）', sources: data.sources }])
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
                  {['有什么商品推荐', '运费怎么算', '支持退换货吗'].map(s => (
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
                  {m.sources && m.sources.length > 0 && (
                    <div className="rag-sources">
                      {m.sources.map((s, j) => (
                        <div key={j} className="rag-source">
                          <span className="rag-source-tag">{s.doc}</span>
                          <span className="rag-source-text">{s.text.length > 80 ? s.text.slice(0, 80) + '…' : s.text}</span>
                        </div>
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
            <button className="rag-send" onClick={ask} disabled={loading || !input.trim()}>
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
