import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, Product } from '../api'
import { getUser, setLogin } from '../auth'
import './Profile.css'

type Tab = 'info' | 'orders'

interface Order {
  id: string; status: string; items: any[]; totalAmount: number;
  shippingAddress: string; receiverName: string; receiverPhone: string;
  remark?: string; createdAt: string; paidAt?: string; shippedAt?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '待付款', color: '#999' },
  paid: { label: '已付款', color: '#1677ff' },
  shipped: { label: '已发货', color: '#13c2c2' },
  delivered: { label: '已签收', color: '#52c41a' },
  completed: { label: '已完成', color: '#52c41a' },
  cancelled: { label: '已取消', color: '#ff4d4f' },
}

export default function Profile() {
  const [tab, setTab] = useState<Tab>('info')
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const user = getUser()

  // 编辑表单
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ nickname: '', phone: '' })

  // 改密码表单
  const [changingPwd, setChangingPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })

  useEffect(() => {
    if (!user) { navigate('/auth?from=/profile'); return }
    setEditForm({ nickname: user.nickname || '', phone: user.phone || '' })
  }, [user])

  useEffect(() => {
    if (tab === 'orders' && user) loadOrders()
  }, [tab, user])

  const loadOrders = async () => {
    setLoadingOrders(true)
    try {
      const d = await api.myOrders()
      const list = (d as any).data || d
      setOrders(Array.isArray(list) ? list : [])
    } catch {
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await api.updateMe({ nickname: editForm.nickname, phone: editForm.phone })
      const oldUser = getUser()!
      setLogin(getUser()!.token!, { ...oldUser, nickname: editForm.nickname, phone: editForm.phone })
      setMessage('个人信息已更新')
      setEditing(false)
    } catch (err: any) {
      setError(err.message || '更新失败')
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    setError('')
    if (pwdForm.newPassword !== pwdForm.confirm) { setError('两次输入密码不一致'); return }
    if (pwdForm.newPassword.length < 6) { setError('密码至少 6 位'); return }
    try {
      await api.changePassword(pwdForm.oldPassword, pwdForm.newPassword)
      setMessage('密码已修改')
      setPwdForm({ oldPassword: '', newPassword: '', confirm: '' })
      setChangingPwd(false)
    } catch (err: any) {
      setError(err.message || '修改失败')
    }
  }

  const handleTab = (t: Tab) => { setTab(t); if (t === 'orders' && user) loadOrders() }

  return (
    <div className="profile-page">
      {!user ? (
        <div className="profile-empty">
          <p>请先 <Link to="/auth?from=/profile">登录</Link></p>
        </div>
      ) : (
        <>
          <div className="profile-header">
            <div className="profile-avatar">{(user.nickname || user.username).charAt(0)}</div>
            <div className="profile-info">
              <h2>{user.nickname || user.username}</h2>
              <p className="profile-sub">
                <span className="profile-username">{user.username}</span>
                <span className="profile-sep">·</span>
                <span>{user.phone || '未绑定手机'}</span>
                <span className="profile-sep">·</span>
                <span className="profile-role">{user.role === 'admin' ? '管理员' : '普通会员'}</span>
              </p>
            </div>
          </div>

          <div className="profile-tabs">
            <button className={`tab ${tab === 'info' ? 'active' : ''}`} onClick={() => handleTab('info')}>个人信息</button>
            <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => handleTab('orders')}>我的订单</button>
          </div>

          <div className="profile-body">
            {tab === 'info' && (
              <div className="profile-section">
                {message && <div className="msg success">{message}</div>}
                {error && <div className="msg error">{error}</div>}

                {editing ? (
                  <form onSubmit={handleUpdateProfile} className="edit-form">
                    <div className="form-row">
                      <label>昵称
                        <input value={editForm.nickname} onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))} placeholder="用户昵称" />
                      </label>
                      <label>手机
                        <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="手机号" />
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">保存</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setError(''); setMessage('') }}>取消</button>
                    </div>
                  </form>
                ) : (
                  <div className="info-list">
                    <InfoRow label="用户名" value={user.username} />
                    <InfoRow label="昵称" value={user.nickname || '—'} />
                    <InfoRow label="手机" value={user.phone || '—'} />
                    <InfoRow label="角色" value={user.role === 'admin' ? '管理员' : '普通会员'} />
                    <button className="btn btn-outline" onClick={() => setEditing(true)}>编辑信息</button>
                  </div>
                )}

                <div className="info-divider" />

                {changingPwd ? (
                  <form onSubmit={handleChangePassword} className="edit-form">
                    <div className="form-row">
                      <label>旧密码
                        <input type="password" value={pwdForm.oldPassword} onChange={e => setPwdForm(f => ({ ...f, oldPassword: e.target.value }))} />
                      </label>
                      <label>新密码
                        <input type="password" value={pwdForm.newPassword} onChange={e => setPwdForm(f => ({ ...f, newPassword: e.target.value }))} />
                      </label>
                      <label>确认新密码
                        <input type="password" value={pwdForm.confirm} onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))} />
                      </label>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">确认修改</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setChangingPwd(false); setError(''); setMessage('') }}>取消</button>
                    </div>
                  </form>
                ) : (
                  <div className="info-list">
                    <InfoRow label="登录密码" value="********" />
                    <button className="btn btn-outline" onClick={() => setChangingPwd(true)}>修改密码</button>
                  </div>
                )}
              </div>
            )}

            {tab === 'orders' && (
              <div className="orders-list">
                {loadingOrders && <p className="orders-empty">加载中...</p>}
                {!loadingOrders && orders.length === 0 && (
                  <div className="orders-empty">
                    <div className="orders-empty-icon">📦</div>
                    <p>还没有订单</p>
                    <Link to="/" className="btn btn-primary">去逛逛</Link>
                  </div>
                )}
                {!loadingOrders && orders.map(o => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const s = STATUS_LABELS[order.status] || { label: order.status, color: '#999' }
  return (
    <div className="order-card">
      <div className="order-head">
        <span className="order-id">订单号：{order.id}</span>
        <span className="order-status" style={{ backgroundColor: s.color + '20', color: s.color }}>
          {s.label}
        </span>
      </div>

      <div className="order-items">
        {order.items.map((item, i) => (
          <div key={i} className="order-item">
            <img src={item.productImage} alt="" className="order-item-img" />
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

      <div className="order-meta">
        <span>下单：{order.createdAt}</span>
        {order.paidAt && <span>· 付款：{order.paidAt}</span>}
        {order.shippedAt && <span>· 发货：{order.shippedAt}</span>}
      </div>
    </div>
  )
}
