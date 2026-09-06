import { useState } from 'react'
import { api } from '../api'
import { useMessage } from './profile-shared'

interface User {
  username: string
  nickname?: string
  phone?: string
  role?: string
}

export default function ProfileInfo({ user }: { user: User }) {
  const { message, setMessage, error, setError } = useMessage()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ nickname: '', phone: '' })
  const [changingPwd, setChangingPwd] = useState(false)
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setMessage(''); setError('')
    try {
      await api.updateMe({ nickname: editForm.nickname, phone: editForm.phone })
      setMessage('个人信息已更新')
      setEditing(false)
    } catch (err: any) {
      setError(err.message || '更新失败')
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage(''); setError('')
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

  return (
    <div className="profile-section">
      {message && <div className="msg success">{message}</div>}
      {error && <div className="msg error">{error}</div>}

      {editing ? (
        <form onSubmit={handleUpdate} className="edit-form">
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
          <button className="btn btn-outline" onClick={() => {
            setEditForm({ nickname: user.nickname || '', phone: user.phone || '' })
            setEditing(true)
          }}>编辑信息</button>
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
  )
}

export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}
