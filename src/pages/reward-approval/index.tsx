import React, { useState, useMemo } from 'react'
import { View, Text, Image, Button, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { formatRelative, formatDate } from '../../utils'
import EmptyState from '../../components/EmptyState'

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审批' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' }
]

const statusTextMap: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  delivered: '已发放'
}

const RewardApprovalPage: React.FC = () => {
  const router = useRouter()
  const exchangeId = router.params.exchangeId

  const { exchangeRecords, approveExchange, familyMembers, currentRole } = useAppStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [currentRejectId, setCurrentRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')

  const memberAvatarMap = useMemo(() => {
    const map: Record<string, string> = {}
    familyMembers.forEach((m) => {
      map[m.name] = m.avatar
    })
    return map
  }, [familyMembers])

  const stats = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyRecords = exchangeRecords.filter((r) => {
      const d = new Date(r.createdAt)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })

    return {
      pending: exchangeRecords.filter((r) => r.status === 'pending').length,
      approved: monthlyRecords.filter((r) => r.status === 'approved' || r.status === 'delivered').length,
      rejected: monthlyRecords.filter((r) => r.status === 'rejected').length
    }
  }, [exchangeRecords])

  const filteredRecords = useMemo(() => {
    if (statusFilter === 'all') {
      return exchangeRecords.filter((r) => r.status !== 'delivered')
    }
    return exchangeRecords.filter((r) => r.status === statusFilter)
  }, [exchangeRecords, statusFilter])

  const isParent = currentRole === 'parent'

  const handleApprove = (id: string) => {
    if (!isParent) return
    approveExchange(id, true)
    Taro.showToast({ title: '已通过', icon: 'success' })
  }

  const openRejectModal = (id: string) => {
    if (!isParent) return
    setCurrentRejectId(id)
    setRejectReason('')
    setRejectModalVisible(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请输入驳回原因', icon: 'none' })
      return
    }
    approveExchange(currentRejectId, false, rejectReason.trim())
    setRejectModalVisible(false)
    setCurrentRejectId('')
    setRejectReason('')
    Taro.showToast({ title: '已驳回', icon: 'success' })
  }

  const handleCancelReject = () => {
    setRejectModalVisible(false)
    setCurrentRejectId('')
    setRejectReason('')
  }

  if (exchangeId) {
    const record = exchangeRecords.find((e) => e.id === exchangeId)

    if (!record) {
      return (
        <View className="page-container">
          <EmptyState icon="📋" title="记录不存在" desc="该兑换记录不存在或已被删除" />
        </View>
      )
    }

    return (
      <View className="page-container">
        <View className={styles.detailPage}>
          <Text className={styles.detailTitle}>兑换记录详情</Text>

          <View className={styles.detailCard}>
            <View className={styles.detailRewardHeader}>
              <Image
                className={styles.detailRewardImage}
                src={record.rewardImage}
                mode="aspectFill"
              />
              <Text className={styles.detailRewardName}>{record.rewardName}</Text>
            </View>

            <View className={styles.detailMemberRow}>
              <Image
                className={styles.detailMemberAvatar}
                src={memberAvatarMap[record.memberName] || ''}
                mode="aspectFill"
              />
              <Text className={styles.detailMemberName}>{record.memberName}</Text>
            </View>

            <View className={styles.detailInfoList}>
              <View className={styles.detailInfoItem}>
                <Text className={styles.detailInfoLabel}>兑换数量</Text>
                <Text className={styles.detailInfoValue}>×{record.quantity}</Text>
              </View>

              <View className={styles.detailInfoItem}>
                <Text className={styles.detailInfoLabel}>消耗积分</Text>
                <Text className={styles.detailPointsValue}>+{record.points}</Text>
              </View>

              <View className={styles.detailInfoItem}>
                <Text className={styles.detailInfoLabel}>审批状态</Text>
                <View className={classnames(styles.statusBadge, styles[record.status])}>
                  {statusTextMap[record.status] || record.status}
                </View>
              </View>

              {record.remark && (
                <View className={styles.detailInfoItem} style={{ alignItems: 'flex-start' }}>
                  <Text className={styles.detailInfoLabel}>驳回原因</Text>
                  <View style={{ flex: 1, maxWidth: '65%' }}>
                    <View className={styles.detailRemarkBox}>{record.remark}</View>
                  </View>
                </View>
              )}

              {record.status === 'delivered' && record.approvedAt && (
                <View className={styles.detailInfoItem}>
                  <Text className={styles.detailInfoLabel}>发放时间</Text>
                  <Text className={styles.detailDeliveredTime}>
                    {formatDate(record.approvedAt, 'YYYY-MM-DD HH:mm')}
                  </Text>
                </View>
              )}
            </View>

            <View className={styles.detailTimeRow}>
              兑换时间：{formatDate(record.createdAt, 'YYYY-MM-DD HH:mm')}
            </View>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="page-container">
      <View className={styles.statsRow}>
        <View className={styles.statsItem}>
          <Text className={classnames(styles.statsNum, styles.pending)}>{stats.pending}</Text>
          <Text className={styles.statsLabel}>待审批</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={classnames(styles.statsNum, styles.approved)}>{stats.approved}</Text>
          <Text className={styles.statsLabel}>本月已通过</Text>
        </View>
        <View className={styles.statsItem}>
          <Text className={classnames(styles.statsNum, styles.rejected)}>{stats.rejected}</Text>
          <Text className={styles.statsLabel}>本月已驳回</Text>
        </View>
      </View>

      <View className={styles.filterTabs}>
        {filterTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, statusFilter === tab.key && styles.active)}
            onClick={() => setStatusFilter(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      {filteredRecords.length === 0 ? (
        <EmptyState icon="📋" title="暂无审批记录" desc="当前筛选条件下没有记录哦" />
      ) : (
        <View>
          {filteredRecords.map((record) => (
            <View key={record.id} className={styles.approvalCard}>
              <Image
                className={styles.rewardImage}
                src={record.rewardImage}
                mode="aspectFill"
              />
              <View className={styles.cardContent}>
                <View className={styles.cardHeader}>
                  <Text className={styles.rewardName}>{record.rewardName}</Text>
                  <View className={classnames(styles.statusBadge, styles[record.status])}>
                    {statusTextMap[record.status] || record.status}
                  </View>
                </View>

                <View className={styles.exchangeInfo}>
                  <Image
                    className={styles.memberAvatar}
                    src={memberAvatarMap[record.memberName] || ''}
                    mode="aspectFill"
                  />
                  <Text className={styles.memberName}>{record.memberName}</Text>
                  <Text className={styles.quantity}>×{record.quantity}</Text>
                </View>

                <Text className={styles.exchangeTime}>
                  兑换时间：{formatRelative(record.createdAt)}
                </Text>

                <View className={styles.pointsRow}>
                  <View>
                    <Text className={styles.pointsValue}>{record.points}</Text>
                    <Text className={styles.pointsUnit}>积分</Text>
                  </View>
                </View>

                {record.status === 'pending' && isParent && (
                  <View className={styles.actionRow}>
                    <Button
                      className={styles.approveBtn}
                      onClick={() => handleApprove(record.id)}
                    >
                      通过
                    </Button>
                    <Button
                      className={styles.rejectBtn}
                      onClick={() => openRejectModal(record.id)}
                    >
                      驳回
                    </Button>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {rejectModalVisible && (
        <View className={styles.modalMask}>
          <View className={styles.modalContent}>
            <Text className={styles.modalTitle}>驳回原因</Text>
            <Textarea
              className={styles.modalTextarea}
              placeholder="请输入驳回原因..."
              value={rejectReason}
              onInput={(e) => setRejectReason(e.detail.value)}
              maxlength={200}
            />
            <View className={styles.modalActions}>
              <Button className={styles.cancelBtn} onClick={handleCancelReject}>
                取消
              </Button>
              <Button className={styles.confirmRejectBtn} onClick={handleConfirmReject}>
                确认驳回
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default RewardApprovalPage
