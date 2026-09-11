import { useState, useEffect } from 'react'
import { api, Address } from '../api'
import { useMessage } from './profile-shared'

export default function ProfileAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(false)
  const { error, setError } = useMessage()
  const [form, setForm] = useState({ label: '', name: '', phone: '', province: '', city: '', address: '' })
  const [mode, setMode] = useState<'add' | 'edit'>('add')
  const [editingId, setEditingId] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const d = await api.addresses()
      const list = (d as any).data || d
      setAddresses(Array.isArray(list) ? list : [])
    } catch {
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  async function openAdd() {
    setMode('add')
    setEditingId('')
    setForm({ label: '', name: '', phone: '', province: '', city: '', address: '' })
  }

  function openEdit(a: Address) {
    setMode('edit')
    setEditingId(a.id)
    setForm({ label: a.label, name: a.receiverName, phone: a.receiverPhone, province: a.province, city: a.city, address: a.address })
  }

  async function submit() {
    if (!form.name || !form.phone || !form.address) { setError('姓名/手机/地址为必填'); return }
    try {
      if (mode === 'edit' && editingId) {
        await api.updateAddress(editingId, {
          label: form.label || '默认',
          receiverName: form.name,
          receiverPhone: form.phone,
          province: form.province,
          city: form.city,
          address: form.address,
        })
      } else {
        await api.createAddress({
          label: form.label || '默认',
          receiverName: form.name,
          receiverPhone: form.phone,
          province: form.province,
          city: form.city,
          address: form.address,
        })
      }
      await load()
      setMode('add')
      setEditingId('')
      setForm({ label: '', name: '', phone: '', province: '', city: '', address: '' })
      setError('')
    } catch (err: any) {
      setError(err.message || '操作失败')
    }
  }

  async function del(id: string) {
    if (!confirm('确定删除此地址？')) return
    try {
      await api.deleteAddress(id)
      await load()
    } catch {
      setError('删除失败')
    }
  }

  return (
    <div className="profile-section">
      {error && <div className="msg error">{error}</div>}

      <div className="addr-header">
        <h3>收货地址</h3>
        <button className="btn btn-primary" onClick={openAdd}>＋ 新建</button>
      </div>

      {loading && <p>加载中...</p>}
      {!loading && addresses.length === 0 && (
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
            <button className="btn btn-ghost" onClick={() => openEdit(a)}>编辑</button>
            <button className="btn btn-ghost" style={{ color: '#ff4d4f' }} onClick={() => del(a.id)}>删除</button>
          </div>
        </div>
      ))}

      {(mode === 'add' || (mode === 'edit' && editingId)) && (
        <form className="edit-form" style={{ marginTop: 16 }}>
          <div className="form-row">
            <label>标签 <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="如：家 / 公司" /></label>
            <label>姓名 <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="收件人" /></label>
            <label>手机 <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="手机号" /></label>
            <label>省份 <input value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} placeholder="省" /></label>
            <label>城市 <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="市" /></label>
            <label>详细地址 <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="街道/小区/门牌" /></label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={submit}>
              {mode === 'edit' ? '保存修改' : '添加地址'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setMode('add'); setEditingId(''); setError('') }}>取消</button>
          </div>
        </form>
      )}
    </div>
  )
}
