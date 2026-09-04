import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, Product, Address, AfterSale, Notification } from '../api'
import { getUser, setLogin } from '../auth'
import './Profile.css'

type Tab = 'info' | 'addresses' | 'aftersales' | 'orders' | 'notifications'

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

const AFTERSALE_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: '#fa8c16' },
  approved: { label: '已同意', color: '#52c41a' },
  rejected: { label: '已拒绝', color: '#ff4d4f' },
}

export default function Profile() {
  const [tab, setTab] = useState<Tab>('info')
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)
  const [addrForm, setAddrForm] = useState({ label: '', name: '', phone: '', province: '', city: '', address: '' })
  const [addrMode, setAddrMode] = useState<'add' | 'edit'>('add')
  const [addrEditingId, setAddrEditingId] = useState('')

  // 售后状态
  const [aftersales, setAftersales] = useState<AfterSale[]>([])
  const [loadingAftersales, setLoadingAftersales] = useState(false)
  const [showAfterForm, setShowAfterForm] = useState(false)
  const [afterForm, setAfterForm] = useState({ orderId: '', reason: '', description: '', reasonOptions: ['口味不符', '漏发', '物流破损', '质量问题', '其他'] as const })

  // 通知
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loadingNotif, setLoadingNotif] = useState(false)

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
    if (tab === 'addresses' && user) loadAddresses()
    if (tab === 'aftersales' && user) loadAftersales()
    if (tab === 'notifications' && user) loadNotifications()
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

  const loadAddresses = async () => {
    setLoadingAddresses(true)
    try {
      const d = await api.addresses()
      setAddresses((d as any).data || (Array.isArray(d) ? d : []))
    } catch {
      setAddresses([])
    } finally {
      setLoadingAddresses(false)
    }
  }

  const loadAftersales = async () => {
    setLoadingAftersales(true)
    try {
      const d = await api.aftersales()
      setAftersales((d as any).data || (Array.isArray(d) ? d : []))
    } catch {
      setAftersales([])
    } finally {
      setLoadingAftersales(false)
    }
  }

  const loadNotifications = async () => {
    setLoadingNotif(true)
    try {
      const d = await api.getNotifications()
      const res = (d as any).data || d
      setNotifications(Array.isArray(res.list) ? res.list : [])
    } catch {
      setNotifications([])
    } finally {
      setLoadingNotif(false)
    }
  }

  const markRead = async (id: string) => {
    try {
      await api.markRead(id)
      setNotifications(list => list.map(n => n.id === id ? { ...n, read: 1 } : n))
    } catch { /* ignore */ }
  }

  const markAllRead = async () => {
    try {
      await api.markAllRead()
      setNotifications(list => list.map(n => ({ ...n, read: 1 })))
    } catch { /* ignore */ }
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

  const handleTab = (t: Tab) => {
    setTab(t)
    if (t === 'orders' && user) loadOrders()
    if (t === 'addresses' && user) loadAddresses()
    if (t === 'aftersales' && user) loadAftersales()
  }

  const openAddrAdd = () => {
    setAddrMode('add')
    setAddrEditingId('')
    setAddrForm({ label: '', name: '', phone: '', province: '', city: '', address: '' })
  }
  const openAddrEdit = (a: Address) => {
    setAddrMode('edit')
    setAddrEditingId(a.id)
    setAddrForm({ label: a.label, name: a.receiverName, phone: a.receiverPhone, province: a.province, city: a.city, address: a.address })
  }
  const handleAddrSubmit = async () => {
    if (!addrForm.name || !addrForm.phone || !addrForm.address) { setError('姓名/手机/地址为必填'); return }
    try {
      if (addrMode === 'edit' && addrEditingId) {
        await api.updateAddress(addrEditingId, {
          label: addrForm.label || '默认',
          receiverName: addrForm.name,
          receiverPhone: addrForm.phone,
          province: addrForm.province,
          city: addrForm.city,
          address: addrForm.address,
        })
      } else {
        await api.createAddress({
          label: addrForm.label || '默认',
          receiverName: addrForm.name,
          receiverPhone: addrForm.phone,
          province: addrForm.province,
          city: addrForm.city,
          address: addrForm.address,
        })
      }
      loadAddresses()
      setAddrMode('add')
      setAddrEditingId('')
      setAddrForm({ label: '', name: '', phone: '', province: '', city: '', address: '' })
    } catch (err: any) {
      setError(err.message || '操作失败')
    }
  }
  const handleAddrDelete = async (id: string) => {
    if (!confirm('确定删除此地址？')) return
    try {
      await api.deleteAddress(id)
      loadAddresses()
    } catch {
      setError('删除失败')
    }
  }

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
            <button className={`tab ${tab === 'addresses' ? 'active' : ''}`} onClick={() => handleTab('addresses')}>收货地址</button>
            <button className={`tab ${tab === 'aftersales' ? 'active' : ''}`} onClick={() => handleTab('aftersales')}>售后</button>
            <button className={`tab ${tab === 'orders' ? 'active' : ''}`} onClick={() => handleTab('orders')}>我的订单</button>
            <button className={`tab ${tab === 'notifications' ? 'active' : ''}`} onClick={() => handleTab('notifications')}>消息通知</button>
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

            {tab === 'addresses' && (
              <div className="profile-section">
                {error && <div className="msg error">{error}</div>}

                <div className="addr-header">
                  <h3>收货地址</h3>
                  <button className="btn btn-primary" onClick={openAddrAdd}>＋ 新建</button>
                </div>

                {loadingAddresses && <p>加载中...</p>}

                {!loadingAddresses && addresses.length === 0 && (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>暂无收货地址</p>
                )}

                {addresses.map(a => (
                  <div key={a.id} className="addr-card">
                    <div className="addr-card-top">
                      <span className="addr-label">{a.label}</span>
                      {a.isDefault && <span className="addr-badge">默认</span>}
                    </div>
                    <div className="addr-main">
                      <b>{a.receiverName}</b> <span>{a.receiverPhone}</span>
                      <br/>
                      <span>{a.province} {a.city} {a.address}</span>
                    </div>
                    <div className="addr-card-actions">
                      <button className="btn btn-ghost" onClick={() => openAddrEdit(a)}>编辑</button>
                      <button className="btn btn-ghost" style={{ color: '#ff4d4f' }} onClick={() => handleAddrDelete(a.id)}>删除</button>
                    </div>
                  </div>
                ))}

                {(addrMode === 'add' || (addrMode === 'edit' && addrEditingId)) && (
                  <form className="edit-form" style={{ marginTop: 16 }}>
                    <div className="form-row">
                      <label>标签 <input value={addrForm.label} onChange={e => setAddrForm(f => ({ ...f, label: e.target.value }))} placeholder="如：家 / 公司" /></label>
                      <label>姓名 <input value={addrForm.name} onChange={e => setAddrForm(f => ({ ...f, name: e.target.value }))} placeholder="收件人" /></label>
                      <label>手机 <input value={addrForm.phone} onChange={e => setAddrForm(f => ({ ...f, phone: e.target.value }))} placeholder="手机号" /></label>
                      <label>省份 <input value={addrForm.province} onChange={e => setAddrForm(f => ({ ...f, province: e.target.value }))} placeholder="省" /></label>
                      <label>城市 <input value={addrForm.city} onChange={e => setAddrForm(f => ({ ...f, city: e.target.value }))} placeholder="市" /></label>
                      <label>详细地址 <input value={addrForm.address} onChange={e => setAddrForm(f => ({ ...f, address: e.target.value }))} placeholder="街道/小区/门牌" /></label>
                    </div>
                    <div className="form-actions">
                      <button type="button" className="btn btn-primary" onClick={handleAddrSubmit}>
                        {addrMode === 'edit' ? '保存修改' : '添加地址'}
                      </button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setAddrMode('add'); setAddrEditingId(''); setError('') }}>取消</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {tab === 'aftersales' && (
              <div className="profile-section">
                <div className="addr-header">
                  <h3>售后服务</h3>
                  <button className="btn btn-primary" onClick={() => setShowAfterForm(!showAfterForm)}>
                    {showAfterForm ? '取消' : '＋ 申请售后'}
                  </button>
                </div>

                {loadingAftersales && <p>加载中...</p>}

                {!loadingAftersales && aftersales.length === 0 && (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>暂无售后记录</p>
                )}

                {aftersales.map(a => (
                  <div key={a.id} className="addr-card">
                    <div className="addr-card-top">
                      <span className="addr-label">{a.reason}</span>
                      <span className="af-status" style={{
                        backgroundColor: AFTERSALE_STATUS[a.status]?.color + '20' || '#f0f0f0',
                        color: AFTERSALE_STATUS[a.status]?.color || '#666',
                        padding: '2px 8px', borderRadius: 4, fontSize: 11,
                      }}>
                        {AFTERSALE_STATUS[a.status]?.label || a.status}
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
                ))}

                {showAfterForm && (
                  <form className="edit-form" style={{ marginTop: 16 }} onSubmit={e => {
                    e.preventDefault()
                    if (!afterForm.reason || !afterForm.description) { setError('原因为必填'); return }
                    api.createAfterSale({
                      orderId: afterForm.orderId,
                      items: [],
                      reason: afterForm.reason,
                      description: afterForm.description,
                    }).then(() => {
                      loadAftersales()
                      setShowAfterForm(false)
                      setAfterForm({ ...afterForm, orderId: '', reason: '', description: '' })
                    }).catch((err: any) => setError(err.message || '申请失败'))
                  }}>
                    <div className="form-row">
                      <label>订单号 <input value={afterForm.orderId} onChange={e => setAfterForm(f => ({ ...f, orderId: e.target.value }))} placeholder="输入订单号" /></label>
                      <label>售后原因
                        <select value={afterForm.reason} onChange={e => setAfterForm(f => ({ ...f, reason: e.target.value }))}>
                          <option value="">请选择</option>
                          <option value="口味不符">口味不符</option>
                          <option value="漏发">漏发</option>
                          <option value="物流破损">物流破损</option>
                          <option value="质量问题">质量问题</option>
                          <option value="其他">其他</option>
                        </select>
                      </label>
                      <label className="full">说明 <textarea value={afterForm.description} onChange={e => setAfterForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="详细描述问题" style={{ fontFamily: 'inherit', resize: 'vertical' }} /></label>
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">提交申请</button>
                      <button type="button" className="btn btn-ghost" onClick={() => { setShowAfterForm(false); setError('') }}>取消</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {tab === 'notifications' && (
              <div className="profile-section">
                <div className="addr-header">
                  <h3>消息通知</h3>
                  {notifications.length > 0 && (
                    <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={markAllRead}>全部已读</button>
                  )}
                </div>
                {loadingNotif && <p>加载中...</p>}
                {!loadingNotif && notifications.length === 0 && (
                  <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>暂无消息</p>
                )}
                {notifications.map(n => (
                  <div key={n.id} className="addr-card" style={{ opacity: n.read ? 0.6 : 1, position: 'relative' }}>
                    {!n.read && <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: '#ff4d4f' }} />}
                    <div className="addr-card-top">
                      <span className="addr-label">{n.title}</span>
                      <span style={{ fontSize: 11, color: '#999' }}>{n.createdAt}</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>{n.content}</p>
                  </div>
                ))}
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
                  <OrderCard key={o.id} order={o} refresh={loadOrders} />
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

function OrderCard({ order, refresh }: { order: Order; refresh?: () => void }) {
  const navigate = useNavigate()
  const [canceling, setCanceling] = useState(false)
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

      {order.status === 'pending' && (
        <div className="order-actions">
          <button
            className="btn btn-outline order-cancel-btn"
            disabled={canceling}
            onClick={async () => {
              if (!confirm('确定取消此订单？')) return
              setCanceling(true)
              try {
                const token = getToken()
                const res = await fetch(`/api/orders/${order.id}/status`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ status: 'cancelled' }),
                })
                const data = await res.json()
                if (data.success) {
                  alert('订单已取消')
                  refresh?.()
                } else {
                  alert(data.error || '取消失败')
                }
              } catch {
                alert('网络错误，取消失败')
              } finally {
                setCanceling(false)
              }
            }}
          >
            {canceling ? '取消中...' : '取消订单'}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/pay/${order.id}`)}
          >
            去支付
          </button>
        </div>
      )}

      <div className="order-meta">
        <span>下单：{order.createdAt}</span>
        {order.paidAt && <span>· 付款：{order.paidAt}</span>}
        {order.shippedAt && <span>· 发货：{order.shippedAt}</span>}
      </div>
    </div>
  )
}
