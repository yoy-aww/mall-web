// Profile 页面共享工具
// 状态标签、颜色、错误提示等

import { useEffect, useState } from 'react'

export type Tab = 'info' | 'addresses' | 'aftersales' | 'orders' | 'notifications'

export interface Order {
  id: string
  status: string
  items: any[]
  totalAmount: number
  subtotal?: number
  shippingFee?: number
  shippingMethod?: string
  shipTracking?: string
  shippingAddress: string
  receiverName: string
  receiverPhone: string
  remark?: string
  createdAt: string
  paidAt?: string
  shippedAt?: string
  completedAt?: string
  cancelledAt?: string
  cancelledReason?: string
}

export const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: '待付款', color: '#999' },
  paid:      { label: '已付款', color: '#1677ff' },
  shipped:   { label: '已发货', color: '#13c2c2' },
  delivered: { label: '已签收', color: '#52c41a' },
  completed: { label: '已完成', color: '#52c41a' },
  cancelled: { label: '已取消', color: '#ff4d4f' },
}

export const AFTERSALE_STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: '待审核', color: '#fa8c16' },
  approved: { label: '已同意', color: '#52c41a' },
  rejected: { label: '已拒绝', color: '#ff4d4f' },
}

/**
 * 消息/错误提示 hook：message 成功后 2.5s 自动清空
 */
export function useMessage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(''), 2500)
    return () => clearTimeout(t)
  }, [message])

  return { message, setMessage, error, setError }
}
