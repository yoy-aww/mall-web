import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { getToken } from '../auth'
import './Pay.css'

export default function Pay() {
  const { orderId } = useParams<{ orderId: string }>()
  const [countdown, setCountdown] = useState(120)
  const [step, setStep] = useState<'idle' | 'processing' | 'success' | 'timeout' | 'already'>('idle')
  const [amount, setAmount] = useState(0)
  const [orderStatus, setOrderStatus] = useState('')
  const navigate = useNavigate()

  // 加载订单
  useEffect(() => {
    if (!orderId) return
    fetch(`/api/orders/${orderId}`, {
      headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    })
      .then(r => r.json())
      .then(d => {
        const data = (d as any).data || d
        if (!data.success) return
        setAmount(data.totalAmount)
        setOrderStatus(data.status)
        if (data.status !== 'pending') {
          setStep('already')
        }
      })
      .catch(() => setStep('timeout'))
  }, [orderId])

  // 倒计时
  useEffect(() => {
    if (step !== 'idle') return
    const t = setInterval(() => {
      setCountdown(n => n - 1)
      if (countdown <= 1) {
        clearInterval(t)
        setStep('timeout')
      }
    }, 1000)
    return () => clearInterval(t)
  }, [step, countdown])

  const handlePay = async () => {
    if (!orderId) return
    setStep('processing')
    // 模拟 2 秒支付处理
    await new Promise(r => setTimeout(r, 2000))
    try {
      const res = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({}),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || '支付失败')
      setStep('success')
    } catch {
      setStep('timeout')
    }
  }

  return (
    <div className="pay-page">
      <div className="pay-card">
        {step === 'idle' && (
          <div className="pay-idle">
            <div className="pay-icon">💳</div>
            <h2>模拟支付</h2>
            <p className="pay-amount">¥{amount.toFixed(2)}</p>
            <p className="pay-sub">请确认订单金额正确</p>
            <div className="pay-methods">
              <div className="pay-method on">
                <span className="method-icon">🟢</span>
                <span>微信支付</span>
              </div>
              <div className="pay-method">
                <span className="method-icon">🔵</span>
                <span>支付宝</span>
              </div>
              <div className="pay-method">
                <span className="method-icon">🔴</span>
                <span>银行卡</span>
              </div>
            </div>
            <div className="pay-countdown">剩余支付时间 <b>{countdown}s</b></div>
            <button className="pay-btn" onClick={handlePay}>确认支付</button>
            <Link to="/profile?tab=orders" className="pay-cancel">取消支付</Link>
          </div>
        )}

        {step === 'processing' && (
          <div className="pay-processing">
            <div className="pay-spin">⏳</div>
            <h3>支付处理中...</h3>
            <p>请勿关闭页面</p>
          </div>
        )}

        {step === 'success' && (
          <div className="pay-success">
            <div className="pay-success-icon">✓</div>
            <h2>支付成功</h2>
            <p className="pay-sub">订单已进入备货流程</p>
            <div className="pay-links">
              <Link to="/profile?tab=orders" className="pay-btn">查看订单</Link>
              <Link to="/" className="pay-cancel">继续逛逛</Link>
            </div>
          </div>
        )}

        {step === 'timeout' && (
          <div className="pay-error">
            <div className="pay-icon">⚠️</div>
            <h3>支付超时</h3>
            <p>请返回订单列表重试</p>
            <div className="pay-links">
              <Link to="/profile?tab=orders" className="pay-btn">返回订单</Link>
            </div>
          </div>
        )}

        {step === 'already' && (
          <div className="pay-error">
            <div className="pay-icon">ℹ️</div>
            <h3>订单状态：{orderStatus}</h3>
            <p>该订单无需支付</p>
            <div className="pay-links">
              <Link to="/profile?tab=orders" className="pay-btn">返回订单</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
