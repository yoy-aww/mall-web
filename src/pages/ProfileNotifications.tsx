import { useEffect, useState } from 'react'
import { api, Notification } from '../api'

export default function ProfileNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const d = await api.getNotifications()
      const res = (d as any).data || d
      setNotifications(Array.isArray(res.list) ? res.list : [])
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function markRead(id: string) {
    try {
      await api.markRead(id)
      setNotifications(list => list.map(n => n.id === id ? { ...n, read: 1 } : n))
    } catch { /* ignore */ }
  }

  async function markAllRead() {
    try {
      await api.markAllRead()
      setNotifications(list => list.map(n => ({ ...n, read: 1 })))
    } catch { /* ignore */ }
  }

  return (
    <div className="profile-section">
      <div className="addr-header">
        <h3>消息通知</h3>
        {notifications.length > 0 && (
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }} onClick={markAllRead}>全部已读</button>
        )}
      </div>
      {loading && <p>加载中...</p>}
      {!loading && notifications.length === 0 && (
        <p style={{ color: '#999', textAlign: 'center', padding: '40px 0' }}>暂无消息</p>
      )}
      {notifications.map(n => (
        <div
          key={n.id}
          className="addr-card"
          style={{ opacity: n.read ? 0.6 : 1, position: 'relative', cursor: 'pointer' }}
          onClick={() => !n.read && markRead(n.id)}
        >
          {!n.read && <span style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, background: '#ff4d4f' }} />}
          <div className="addr-card-top">
            <span className="addr-label">{n.title}</span>
            <span style={{ fontSize: 11, color: '#999' }}>{n.createdAt}</span>
          </div>
          <p style={{ fontSize: 13, color: '#555', margin: '6px 0 0' }}>{n.content}</p>
        </div>
      ))}
    </div>
  )
}
