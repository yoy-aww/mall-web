import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { setLogin, logout } from '../auth'
import './Auth.css'

type Mode = 'login' | 'register'

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login')
  const [form, setForm] = useState({ username: '', password: '', nickname: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const from = params.get('from') || '/'

  useEffect(() => {
    if (from === 'checkout') setSuccessMsg('登录后继续下单')
  }, [from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const d = await api.login(form.username, form.password)
        const result = (d as any).data || d
        setLogin(result.token, result.user)
        navigate(from)
      } else {
        await api.register(form.username, form.password, form.nickname, form.phone)
        setMode('login')
        setSuccessMsg('注册成功，请登录')
      }
    } catch (err: any) {
      setError(err.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login')
    setForm({ username: '', password: '', nickname: '', phone: '' })
    setError('')
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2 className="auth-title">{mode === 'login' ? '登录' : '注册'}</h2>
        <p className="auth-sub">道地本草 · 中药材商城</p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <>
              <label>
                <span>昵称</span>
                <input value={form.nickname} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} placeholder="用户昵称" />
              </label>
              <label>
                <span>手机号</span>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="手机号（可选）" />
              </label>
            </>
          )}

          <label>
            <span>用户名</span>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="用户名（至少 3 位）"
              required
              minLength={3}
            />
          </label>

          <label>
            <span>密码</span>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder={mode === 'login' ? '密码' : '密码（至少 6 位）'}
              required
              minLength={6}
            />
          </label>

          {error && <div className="auth-error">{error}</div>}
          {successMsg && <div className="auth-success">{successMsg}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '处理中...' : (mode === 'login' ? '登 录' : '注 册')}
          </button>
        </form>

        <div className="auth-switch">
          {mode === 'login' ? (
            <span onClick={switchMode}>还没有账号？立即注册</span>
          ) : (
            <span onClick={switchMode}>已有账号？去登录</span>
          )}
        </div>
      </div>
    </div>
  )
}
