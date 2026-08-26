import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCartStore, cartActions, cartSummary, type CartItem } from '../cart'
import './Cart.css'

export default function Cart() {
  const items = useCartStore()
  const { total, count } = cartSummary(items)

  if (items.length === 0) return <CartEmpty />

  return (
    <div className="cart-page">
      <div className="page-head-row">
        <h1 className="page-title">购物车</h1>
        <span className="page-sub">共 {count} 件商品</span>
      </div>
      <table className="cart-table">
        <thead>
          <tr>
            <th className="c-check"></th>
            <th className="c-item">商品</th>
            <th className="c-price">单价</th>
            <th className="c-qty">数量</th>
            <th className="c-sub">小计</th>
            <th className="c-op">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <CartItemRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>

      <div className="cart-total-bar">
        <div className="total-line">
          <span className="total-label">合计（{count} 件）</span>
          <span className="total-price">¥{total.toFixed(2)}</span>
        </div>
        <div className="total-actions">
          <button className="btn btn-ghost" onClick={() => { if (window.confirm('确定清空购物车？')) cartActions.clear() }}>清空</button>
          <Link to="/checkout" className="btn btn-primary">去结算</Link>
        </div>
      </div>
    </div>
  )
}

function CartItemRow({ item }: { item: CartItem }) {
  const [qty, setQty] = useState(item.quantity)
  const sub = item.price * item.quantity
  return (
    <tr>
      <td className="c-check"><span className="dot" /></td>
      <td className="c-item">
        <img src={item.image} alt={item.name} className="cart-thumb" />
        <span className="cart-name">{item.name}</span>
      </td>
      <td className="c-price">¥{item.price.toFixed(2)}</td>
      <td className="c-qty">
        <div className="qty-box">
          <button className="qty-btn" onClick={() => { const q = qty - 1; setQty(q); cartActions.setQuantity(item.id, q, item.stock) }}>-</button>
          <span>{qty}</span>
          <button className="qty-btn" onClick={() => { const q = qty + 1; setQty(q); cartActions.setQuantity(item.id, q, item.stock) }}>+</button>
        </div>
        <span className="stock-hint">库存 {item.stock}</span>
      </td>
      <td className="c-sub">¥{sub.toFixed(2)}</td>
      <td className="c-op"><button className="del-btn" onClick={() => cartActions.remove(item.id)}>删除</button></td>
    </tr>
  )
}

function CartEmpty() {
  return (
    <div className="cart-page">
      <div className="empty">
        <div className="empty-icon">🛒</div>
        <p>购物车还是空的</p>
        <p className="empty-sub">去挑点道地好草本吧</p>
        <Link to="/" className="btn btn-primary">逛逛首页</Link>
      </div>
    </div>
  )
}
