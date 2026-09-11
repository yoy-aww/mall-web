import { useState, useEffect } from 'react'
import { api, AfterSale } from '../api'
import { AFTERSALE_STATUS, useMessage } from './profile-shared'

export default function ProfileAftersales() {
  const [aftersales, setAftersales] = useState<AfterSale[]>([])
  const [loading, setLoading] = useState(false)
  const { error, setError } = useMessage()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ orderId: '', reason: '', description: '' })
  const REASON_OPTIONS = ['口味不符', '漏发', '物流破损', '质量问题', '其他']

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const d = await api.aftersales()
      const list = (d as any).data || d
      setAftersales(Array.isArray(list) ? list : [])
    } catch {
      setAftersales([])
    } finally {
      setLoading(false)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.orderId) { setError('订单号为必填'); return }
    if (!form.reason || !form.description) { setError('原因为必填'); return }
    try {
      await api.createAfterSale({
        orderId: form.orderId,
        items: [],
        reason: form.reason,
        description: form.description,
      })
      await load()
      setShowForm(false)
      setForm({ orderId: '', reason: '', description: '' })
      setError('')
    } catch (err: any) {
      setError(err.message || '申请失败')
    }
  }

  return (
    <div className="profile-section">
      {error && <div className="msg error">{error}</div>}

      <div className="addr-header">
        <h3>售后服务</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '取消' : '＋ 申请售后'}
        </button>
      </div>

      {loading && <p>加载中...</p>}
      {!loading && aftersales.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>暂无售后记录</p>
      )}

      {aftersales.map(a => {
        const st = AFTERSALE_STATUS[a.status] || { label: a.status, color: '#666' }
        return (
          <div key={a.id} className="addr-card">
            <div className="addr-card-top">
              <span className="addr-label">{a.reason}</span>
              <span className="af-status" style={{
                backgroundColor: st.color + '20',
                color: st.color,
                padding: '2px 8px', borderRadius: 4, fontSize: 11,
              }}>
                {st.label}
              </span>
            </div>
            <div className="addr-main">
              <span>订单：{a.orderId}</span><br/>
              {a.description && <span>{a.description}</span>}
            </div>
            {a.handleReason && (
              <div style={{ fontSize: 12, color: '#13c2c2', marginTop: 4 }}>
                处理：{a.handleReason}
                {a.handledAt && <span style={{ color: '#bbb', marginLeft: 8 }}>{a.handledAt}</span>}
              </div>
            )}
          </div>
        )
      })}

      {showForm && (
        <form className="edit-form" style={{ marginTop: 16 }} onSubmit={submit}>
          <div className="form-row">
            <label>订单号 <input value={form.orderId} onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))} placeholder="输入订单号" /></label>
            <label>售后原因
              <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                <option value="">请选择</option>
                {REASON_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            <label className="full">说明 <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="详细描述问题" style={{ fontFamily: 'inherit', resize: 'vertical' }} /></label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">提交申请</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setError('') }}>取消</button>
          </div>
        </form>
      )}
    </div>
  )
}
