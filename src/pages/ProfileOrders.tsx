import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { getToken } from '../auth'
import { Order, STATUS_LABELS } from './profile-shared'

export default function ProfileOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const d = await api.myOrders()
      const list = Array.isArray(d) ? d : (d as any).list || []
      setOrders(Array.isArray(list) ? list : [])
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="orders-list">
      {loading && <p className="orders-empty">加载中...</p>}
      {!loading && orders.length === 0 && (
        <div className="orders-empty">
          <div className="orders-empty-icon">📦</div>
          <p>还没有订单</p>
          <Link to="/" className="btn btn-primary">去逛逛</Link>
        </div>
      )}
      {!loading && orders.map(o => (
        <OrderCard key={o.id} order={o} refresh={load} />
      ))}
    </div>
  )
}

function OrderCard({ order, refresh }: { order: Order; refresh?: () => void }) {
  const navigate = useNavigate()
  const [canceling, setCanceling] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const s = STATUS_LABELS[order.status] || { label: order.status, color: '#999' }

  async function doAction(action: 'cancel' | 'confirm' | 'deliver', label: string) {
    if (!confirm(`确定${label}此订单？`)) return
    setBusy(action)
    try {
      const token = getToken()!
      const res = await fetch(`/api/orders/${order.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(action === 'cancel' ? { reason: '用户取消' } : {}),
      })
      const data = await res.json()
      if (data.success) {
        alert(`订单已${label}`)
        refresh?.()
      } else {
        alert(data.error || `${label}失败`)
      }
    } catch {
      alert('网络错误，操作失败')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="order-card">
      <div className="order-head">
        <span className="order-id">订单号：{order.id}</span>
        <span className="order-status" style={{ backgroundColor: s.color + '20', color: s.color }}>
          {s.label}
        </span>
      </div>

      <div className="order-items">
        {order.items.map((item: any, i: number) => (
          <div key={i} className="order-item">
            <img src={item.productImage} alt="" className="order-item-img" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            <div className="order-item-info">
              <span className="order-item-name">{item.productName}</span>
              <span className="order-item-price">¥{item.price} × {item.quantity}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="order-footer">
        <div className="order-shipping">
          <span>📍 {order.receiverName} {order.receiverPhone}</span>
          <span className="order-sep">|</span>
          <span>{order.shippingAddress}</span>
        </div>
        <div className="order-total">
          <span>合计</span>
          <span className="order-amount">¥{order.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {order.status === 'pending' && (
        <div className="order-actions">
          <button
            className="btn btn-outline order-cancel-btn"
            disabled={busy !== null}
            onClick={() => doAction('cancel', '取消')}
          >
            {busy === 'cancel' ? '取消中...' : '取消订单'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/pay/${order.id}`)}
          >
            去支付
          </button>
        </div>
      )}

      {order.status === 'shipped' && (
        <div className="order-actions">
          <button
            className="btn btn-primary"
            disabled={busy !== null}
            onClick={() => doAction('deliver', '签收')}
          >
            {busy === 'deliver' ? '处理中...' : '确认签收'}
          </button>
        </div>
      )}

      {order.status === 'delivered' && (
        <div className="order-actions">
          <button
            className="btn btn-primary"
            disabled={busy !== null}
            onClick={() => doAction('confirm', '完成')}
          >
            {busy === 'confirm' ? '处理中...' : '确认完成'}
          </button>
        </div>
      )}

      {order.status === 'cancelled' && order.cancelledReason && (
        <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
          取消原因：{order.cancelledReason}
        </div>
      )}

      {order.shipTracking && (
        <div style={{ fontSize: 12, color: '#13c2c2', marginTop: 4 }}>
          📦 物流：{order.shipTracking}
        </div>
      )}

      <div className="order-meta">
        <span>下单：{order.createdAt}</span>
        {order.paidAt && <span>· 付款：{order.paidAt}</span>}
        {order.shippedAt && <span>· 发货：{order.shippedAt}</span>}
        {order.completedAt && <span>· 完成：{order.completedAt}</span>}
      </div>
    </div>
  )
}
