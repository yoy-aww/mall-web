import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore, cartActions, cartSummary, type CartItem } from '../cart'
import './Checkout.css'

export default function Checkout() {
  const items = useCartStore()
  const { total } = cartSummary(items)
  const [step, setStep] = useState<'fill' | 'done'>('fill')
  const [form, setForm] = useState({
    name: '', phone: '', province: '', city: '', address: '', note: '',
  })

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <h1 className="page-title">确认订单</h1>
        <div className="empty">
          <div className="empty-icon">📦</div>
          <p>购物车没有商品</p>
          <Link to="/" className="btn btn-primary">去挑选</Link>
        </div>
      </div>
    )
  }

  if (step === 'done') return <OrderDone goods={items} total={total} form={form} />

  return (
    <div className="checkout-page">
      <h1 className="page-title">确认订单</h1>
      <div className="row">
        <div className="col-left">
          <section className="panel">
            <h3 className="panel-title">收货信息</h3>
            <div className="form-grid">
              <label>姓名 <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="收货人" /></label>
              <label>手机 <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="手机号" /></label>
              <label>省份 <input value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} placeholder="省" /></label>
              <label>城市 <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="市" /></label>
            </div>
            <label className="full">详细地址 <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="街道/小区/门牌" /></label>
            <label className="full">备注 <input value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="选填" /></label>
          </section>

          <section className="panel">
            <h3 className="panel-title">配送方式</h3>
            <div className="ship-row">
              <label className="radio-label"><input type="radio" name="ship" defaultChecked /> 标准快递 · ¥8（满 ¥199 免邮）</label>
              <label className="radio-label"><input type="radio" name="ship" /> 顺丰特快 · ¥15</label>
            </div>
          </section>
        </div>

        <div className="col-right">
          <section className="panel">
            <h3 className="panel-title">商品清单</h3>
            <ul className="goods-list">
              {items.map(it => (
                <li key={it.id} className="goods-row">
                  <img src={it.image} alt={it.name} className="goods-thumb" />
                  <div className="goods-text">
                    <span className="goods-name">{it.name}</span>
                    <span className="goods-qty">×{it.quantity}</span>
                  </div>
                  <span className="goods-price">¥{(it.price * it.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel sum">
            <div className="sum-line"><span>商品小计</span><span>¥{total.toFixed(2)}</span></div>
            <div className="sum-line"><span>运费</span><span>满 ¥199 免邮，否则 ¥8</span></div>
            <div className="sum-line big"><span>应付</span><span>¥{(total >= 199 ? total : total + 8).toFixed(2)}</span></div>
          </section>

          <button className="btn btn-primary full-btn" onClick={() => {
            if (!form.name || !form.phone || !form.address) { alert('请补全收货人/手机/地址'); return }
            setStep('done')
            cartActions.clear()
          }}>提交订单</button>
        </div>
      </div>
    </div>
  )
}

function OrderDone({ goods, total, form }: { goods: CartItem[]; total: number; form: any }) {
  const id = 'GD' + Date.now().toString(36).toUpperCase()
  return (
    <div className="checkout-page">
      <div className="done">
        <div className="done-icon">✓</div>
        <h2>下单成功</h2>
        <p className="done-sub">感谢选购，订单将尽快为您配货发出</p>
        <div className="done-info">
          <div><span>订单号</span><b>{id}</b></div>
          <div><span>收货人</span><b>{form.name} {form.phone}</b></div>
          <div><span>送达</span><b>{form.province} {form.city} {form.address}</b></div>
          <div><span>商品数</span><b>{goods.reduce((s, x) => s + x.quantity, 0)} 件</b></div>
          <div><span>应付</span><b>¥{(total >= 199 ? total : total + 8).toFixed(2)}</b></div>
        </div>
        <div className="done-links">
          <Link to="/" className="btn btn-ghost">继续逛逛</Link>
          <Link to="/" className="btn btn-primary">查看订单</Link>
        </div>
      </div>
    </div>
  )
}
