import { useSearchParams } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { getUser } from '../auth'
import { Tab } from './profile-shared'
import './Profile.css'
import ProfileInfo from './ProfileInfo'
import ProfileAddresses from './ProfileAddresses'
import ProfileAftersales from './ProfileAftersales'
import ProfileNotifications from './ProfileNotifications'
import ProfileOrders from './ProfileOrders'

export default function Profile() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) || 'info'
  const user = getUser()

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <p>请先 <Link to="/auth?from=/profile">登录</Link></p>
        </div>
      </div>
    )
  }

  const handleTab = (t: Tab) => setSearchParams({ tab: t }, { replace: true })

  return (
    <div className="profile-page">
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
        {tab === 'info' && <ProfileInfo user={user} />}
        {tab === 'addresses' && <ProfileAddresses />}
        {tab === 'aftersales' && <ProfileAftersales />}
        {tab === 'orders' && <ProfileOrders />}
        {tab === 'notifications' && <ProfileNotifications />}
      </div>
    </div>
  )
}
