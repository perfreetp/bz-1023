import React, { useState, useMemo } from 'react'
import { View, Text, Image, Button, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore, PerMemberTaskState } from '../../store/useAppStore'
import { formatRelative, taskTypeConfig } from '../../utils'
import { Task } from '../../types'
import EmptyState from '../../components/EmptyState'

const tabKeys = ['checking', 'exchange', 'resubmit'] as const
type TabKey = typeof tabKeys[number]

const tabs = [
  { key: 'checking' as TabKey, label: '待审核打卡' },
  { key: 'exchange' as TabKey, label: '待审批兑换' },
  { key: 'resubmit' as TabKey, label: '已驳回重提交' }
]

const taskTypeEmoji: Record<string, string> = {
  reading: '📚',
  tidying: '🧹',
  exercise: '🏃',
  homework: '📝',
  other: '✏️'
}

interface CheckingTaskItem {
  task: Task & { perMemberStatus?: Record<string, PerMemberTaskState> }
  memberId: string
  memberState: PerMemberTaskState
}

const ReviewCenterPage: React.FC = () => {
  const {
    tasks,
    exchangeRecords,
    familyMembers,
    currentRole,
    updateTaskMemberStatus,
    approveExchange
  } = useAppStore()

  const [activeTab, setActiveTab] = useState<TabKey>('checking')
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<{
    type: 'task' | 'exchange'
    taskId?: string
    memberId?: string
    exchangeId?: string
  } | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const memberMap = useMemo(() => {
    const map: Record<string, typeof familyMembers[0]> = {}
    familyMembers.forEach((m) => {
      map[m.id] = m
    })
    return map
  }, [familyMembers])

  const checkingTasks = useMemo<CheckingTaskItem[]>(() => {
    const list: CheckingTaskItem[] = []
    tasks.forEach((task) => {
      const perMember = task.perMemberStatus || {}
      Object.entries(perMember).forEach(([memberId, state]) => {
        if (state.status === 'checking' && !state.remark) {
          const member = memberMap[memberId]
          if (member && member.role === 'child') {
            list.push({ task, memberId, memberState: state })
          }
        }
      })
    })
    return list
  }, [tasks, memberMap])

  const resubmitTasks = useMemo<CheckingTaskItem[]>(() => {
    const list: CheckingTaskItem[] = []
    tasks.forEach((task) => {
      const perMember = task.perMemberStatus || {}
      Object.entries(perMember).forEach(([memberId, state]) => {
        if (state.status === 'checking' && state.remark) {
          const member = memberMap[memberId]
          if (member && member.role === 'child') {
            list.push({ task, memberId, memberState: state })
          }
        }
      })
    })
    return list
  }, [tasks, memberMap])

  const pendingExchanges = useMemo(
    () => exchangeRecords.filter((r) => r.status === 'pending'),
    [exchangeRecords]
  )

  const tabBadges = useMemo(() => ({
    checking: checkingTasks.length,
    exchange: pendingExchanges.length,
    resubmit: resubmitTasks.length
  }), [checkingTasks, pendingExchanges, resubmitTasks])

  const isParent = currentRole === 'parent'

  const handlePreviewImage = (url: string) => {
    if (!url) return
    Taro.previewImage({
      current: url,
      urls: [url]
    })
  }

  const handlePassTask = (taskId: string, memberId: string, points: number) => {
    if (!isParent) return
    const member = memberMap[memberId]
    Taro.showModal({
      title: `通过 ${member?.name} 的审核`,
      content: `确认给 +${points} 积分吗？`,
      success: (res) => {
        if (res.confirm) {
          updateTaskMemberStatus(taskId, memberId, 'done')
          Taro.showToast({ title: '已通过', icon: 'success' })
        }
      }
    })
  }

  const openTaskRejectModal = (taskId: string, memberId: string) => {
    if (!isParent) return
    setRejectTarget({ type: 'task', taskId, memberId })
    setRejectReason('')
    setRejectModalVisible(true)
  }

  const openExchangeRejectModal = (exchangeId: string) => {
    if (!isParent) return
    setRejectTarget({ type: 'exchange', exchangeId })
    setRejectReason('')
    setRejectModalVisible(true)
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请输入驳回原因', icon: 'none' })
      return
    }
    if (!rejectTarget) return

    if (rejectTarget.type === 'task' && rejectTarget.taskId && rejectTarget.memberId) {
      updateTaskMemberStatus(
        rejectTarget.taskId,
        rejectTarget.memberId,
        'rejected',
        rejectReason.trim()
      )
      Taro.showToast({ title: '已驳回', icon: 'none' })
    } else if (rejectTarget.type === 'exchange' && rejectTarget.exchangeId) {
      approveExchange(rejectTarget.exchangeId, false, rejectReason.trim())
      Taro.showToast({ title: '已驳回', icon: 'none' })
    }

    setRejectModalVisible(false)
    setRejectTarget(null)
    setRejectReason('')
  }

  const handleCancelReject = () => {
    setRejectModalVisible(false)
    setRejectTarget(null)
    setRejectReason('')
  }

  const handleApproveExchange = (id: string) => {
    if (!isParent) return
    Taro.showModal({
      title: '通过兑换申请',
      content: '确认通过此兑换申请吗？',
      success: (res) => {
        if (res.confirm) {
          approveExchange(id, true)
          Taro.showToast({ title: '已通过', icon: 'success' })
        }
      }
    })
  }

  const renderTaskCard = (item: CheckingTaskItem, isResubmit: boolean) => {
    const { task, memberId, memberState } = item
    const member = memberMap[memberId]
    if (!member) return null
    const emoji = taskTypeEmoji[task.type] || '📋'
    const typeConf = taskTypeConfig[task.type]

    return (
      <View key={`${task.id}-${memberId}`} className={styles.taskCard}>
        {isResubmit && <View className={styles.resubmitBadge}>🔄 重提交</View>}
        <View className={styles.taskHeader}>
          <Image
            className={styles.childAvatar}
            src={member.avatar}
            mode="aspectFill"
          />
          <View className={styles.taskHeaderInfo}>
            <View className={styles.childName}>{member.name}</View>
            <View className={styles.taskTitle}>
              <Text className={styles.taskEmoji}>{emoji}</Text>
              <Text
                className={styles.taskTitleText}
                style={{ color: typeConf?.color || '#636E72' }}
              >
                {task.title}
              </Text>
            </View>
          </View>
        </View>

        {memberState.photo && (
          <View className={styles.taskPhotoWrap}>
            <Image
              className={styles.taskPhoto}
              src={memberState.photo}
              mode="aspectFill"
              onClick={() => handlePreviewImage(memberState.photo!)}
            />
          </View>
        )}

        <View className={styles.taskMeta}>
          <View className={styles.metaRow}>
            <Text className={styles.metaIcon}>⏰</Text>
            <Text className={styles.metaText}>
              提交时间：{memberState.submittedAt ? formatRelative(memberState.submittedAt) : '刚刚'}
            </Text>
          </View>
          {memberState.remark && (
            <View className={styles.metaRow}>
              <Text className={styles.metaIcon}>📝</Text>
              <Text className={styles.metaText}>上次驳回：{memberState.remark}</Text>
            </View>
          )}
          {task.description && (
            <View className={styles.metaRow}>
              <Text className={styles.metaIcon}>📄</Text>
              <Text className={styles.metaText}>任务要求：{task.description}</Text>
            </View>
          )}
        </View>

        <View className={styles.actionRow}>
          <Button
            className={styles.rejectBtn}
            onClick={() => openTaskRejectModal(task.id, memberId)}
          >
            驳回
          </Button>
          <Button
            className={styles.passBtn}
            onClick={() => handlePassTask(task.id, memberId, task.points)}
          >
            <Text className={styles.passBtnText}>+{task.points}分通过</Text>
          </Button>
        </View>
      </View>
    )
  }

  const renderExchangeCard = (record: typeof pendingExchanges[0]) => {
    return (
      <View key={record.id} className={styles.exchangeCard}>
        <Image
          className={styles.rewardImage}
          src={record.rewardImage}
          mode="aspectFill"
        />
        <View className={styles.exchangeContent}>
          <View className={styles.exchangeHeader}>
            <Text className={styles.rewardName}>{record.rewardName}</Text>
          </View>
          <View className={styles.exchangeInfo}>
            <View className={styles.memberInfo}>
              <Text className={styles.memberName}>兑换人：{record.memberName}</Text>
            </View>
            <Text className={styles.quantity}>数量×{record.quantity}</Text>
          </View>
          <Text className={styles.exchangeTime}>
            申请时间：{formatRelative(record.createdAt)}
          </Text>
          <View className={styles.exchangeFooter}>
            <View>
              <Text className={styles.pointsValue}>{record.points}</Text>
              <Text className={styles.pointsUnit}>积分</Text>
            </View>
            {isParent && (
              <View className={styles.exchangeActions}>
                <Button
                  className={styles.exchangeRejectBtn}
                  onClick={() => openExchangeRejectModal(record.id)}
                >
                  驳回
                </Button>
                <Button
                  className={styles.exchangeApproveBtn}
                  onClick={() => handleApproveExchange(record.id)}
                >
                  通过
                </Button>
              </View>
            )}
          </View>
        </View>
      </View>
    )
  }

  const renderTabContent = () => {
    if (!isParent) {
      return <EmptyState icon="🔒" title="仅家长可操作" desc="请切换到家长角色后查看" />
    }

    if (activeTab === 'checking') {
      if (checkingTasks.length === 0) {
        return <EmptyState icon="✅" title="暂无待审核" desc="所有打卡都已处理啦" />
      }
      return checkingTasks.map((item) => renderTaskCard(item, false))
    }

    if (activeTab === 'exchange') {
      if (pendingExchanges.length === 0) {
        return <EmptyState icon="🎁" title="暂无兑换申请" desc="当前没有待审批的兑换" />
      }
      return pendingExchanges.map((record) => renderExchangeCard(record))
    }

    if (activeTab === 'resubmit') {
      if (resubmitTasks.length === 0) {
        return <EmptyState icon="🔄" title="暂无重提交" desc="没有被驳回后重新提交的内容" />
      }
      return resubmitTasks.map((item) => renderTaskCard(item, true))
    }

    return null
  }

  return (
    <View className="page-container">
      <View className={styles.segmentedTabs}>
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(
              styles.segmentItem,
              activeTab === tab.key && styles.active
            )}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tabBadges[tab.key] > 0 && (
              <View className={styles.badge}>{tabBadges[tab.key]}</View>
            )}
          </View>
        ))}
      </View>

      <View>{renderTabContent()}</View>

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

export default ReviewCenterPage
