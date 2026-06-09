import React, { useState, useMemo } from 'react'
import { View, Text, Image, Button, Textarea } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { taskTypeConfig, taskStatusConfig, formatDate, formatDateTime } from '../../utils'

const taskTypeIconMap: Record<string, string> = {
  reading: '📚',
  homework: '📝',
  exercise: '🏃',
  tidying: '🧹',
  other: '✨'
}

const TaskDetailPage: React.FC = () => {
  const router = useRouter()
  const taskId = router.params.taskId || ''

  const {
    tasks,
    familyMembers,
    currentRole,
    currentMemberId,
    submitTaskPhoto,
    updateTaskMemberStatus
  } = useAppStore()

  const task = tasks.find((t) => t.id === taskId)
  const [memberRemarks, setMemberRemarks] = useState<Record<string, string>>({})
  const [uploadingMemberId, setUploadingMemberId] = useState<string | null>(null)

  if (!task) {
    return (
      <View className={styles.wrapper}>
        <View className={styles.card}>
          <Text>任务不存在或已删除</Text>
        </View>
      </View>
    )
  }

  const typeConfig = taskTypeConfig[task.type] || taskTypeConfig.other
  const typeIcon = taskTypeIconMap[task.type] || '✨'

  const assignedMembers = familyMembers.filter((m) => task.assignedTo.includes(m.id))
  const isParent = currentRole === 'parent'
  const isChild = currentRole === 'child'

  const aggregatedStatus = useMemo(() => {
    const perMember = task.perMemberStatus || {}
    const statuses = task.assignedTo.map(
      (mid) => perMember[mid]?.status || 'pending'
    )
    if (statuses.every((s) => s === 'done')) return 'done'
    if (statuses.some((s) => s === 'checking')) return 'checking'
    if (statuses.every((s) => s === 'rejected')) return 'rejected'
    return 'pending'
  }, [task.perMemberStatus, task.assignedTo])

  const aggregatedStatusConfig = taskStatusConfig[aggregatedStatus]

  const getMemberStatus = (memberId: string) => {
    return task.perMemberStatus?.[memberId] || { status: 'pending' as const }
  }

  const handleUploadPhoto = (memberId: string) => {
    if (uploadingMemberId) return
    setUploadingMemberId(memberId)
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        submitTaskPhoto(task.id, memberId, tempFilePath)
        Taro.showToast({ title: '打卡成功，等待审核', icon: 'success' })
      },
      fail: () => {
        Taro.showToast({ title: '已取消', icon: 'none' })
      },
      complete: () => {
        setUploadingMemberId(null)
      }
    })
  }

  const handleApprove = (memberId: string) => {
    const remark = memberRemarks[memberId]?.trim() || undefined
    updateTaskMemberStatus(task.id, memberId, 'done', remark)
    Taro.showToast({ title: '已通过', icon: 'success' })
    setMemberRemarks((prev) => ({ ...prev, [memberId]: '' }))
  }

  const handleReject = (memberId: string) => {
    const remark = memberRemarks[memberId]?.trim()
    if (!remark) {
      Taro.showToast({ title: '请填写驳回理由', icon: 'none' })
      return
    }
    updateTaskMemberStatus(task.id, memberId, 'rejected', remark)
    Taro.showToast({ title: '已驳回', icon: 'none' })
    setMemberRemarks((prev) => ({ ...prev, [memberId]: '' }))
  }

  const currentMember = familyMembers.find((m) => m.id === currentMemberId)
  const isCurrentMemberAssigned = task.assignedTo.includes(currentMemberId)
  const currentMemberState = isCurrentMemberAssigned ? getMemberStatus(currentMemberId) : null
  const showCurrentChildUploadAtBottom =
    isChild &&
    isCurrentMemberAssigned &&
    currentMemberState &&
    (currentMemberState.status === 'pending' || currentMemberState.status === 'rejected')

  const renderActionBar = () => {
    if (showCurrentChildUploadAtBottom) {
      return (
        <View className={styles.actionBar}>
          <Button
            className={styles.fullWidthBtn}
            onClick={() => handleUploadPhoto(currentMemberId)}
          >
            📸 {currentMemberState?.status === 'rejected' ? '重新打卡' : '立即打卡'}
          </Button>
        </View>
      )
    }
    return (
      <View className={styles.actionBar}>
        <Button
          className={styles.fullWidthBtn}
          onClick={() => Taro.navigateBack()}
        >
          ← 返回列表
        </Button>
      </View>
    )
  }

  return (
    <View>
      <View className={styles.wrapper}>
        <View className={styles.headerSection}>
          <View className={styles.headerRow}>
            <View
              className={styles.typeTag}
              style={{ background: typeConfig.bgColor, color: typeConfig.color }}
            >
              <Text style={{ marginRight: '8rpx' }}>{typeIcon}</Text>
              <Text>{typeConfig.label}</Text>
            </View>
            <View
              className={styles.statusBadge}
              style={{ background: `${aggregatedStatusConfig.color}15`, color: aggregatedStatusConfig.color }}
            >
              {aggregatedStatusConfig.label}
            </View>
          </View>

          <View className={styles.taskTitle}>{task.title}</View>
          {task.description && (
            <View className={styles.taskDesc}>{task.description}</View>
          )}
        </View>

        <View className={styles.card}>
          <View className={styles.formTitle}>⭐ 积分与时间</View>

          <View className={styles.infoRow}>
            <View className={styles.infoLabel}>🎯 基础积分</View>
            <View className={classnames(styles.infoValue, styles.pointsHighlight)}>
              +{task.points} 分
            </View>
          </View>

          <View className={styles.infoRow}>
            <View className={styles.infoLabel}>🔥 连续奖励</View>
            <View className={classnames(styles.infoValue, styles.bonusHighlight)}>
              每{task.bonusDays}天 +{task.bonusPoints}分
            </View>
          </View>

          <View className={styles.infoRow}>
            <View className={styles.infoLabel}>📅 截止日期</View>
            <View className={styles.infoValue}>{formatDate(task.deadline)}</View>
          </View>

          <View className={styles.infoRow}>
            <View className={styles.infoLabel}>⏰ 提醒时间</View>
            <View className={styles.infoValue}>
              {task.reminder ? task.reminder : '无提醒'}
            </View>
          </View>

          <View className={styles.infoRow}>
            <View className={styles.infoLabel}>📝 创建时间</View>
            <View className={styles.infoValue}>{formatDate(task.createdAt)}</View>
          </View>
        </View>

        <View className={styles.formTitle} style={{ marginTop: 0, marginBottom: 24 }}>
          👤 孩子打卡状态
        </View>

        {assignedMembers.map((member) => {
          const memberState = getMemberStatus(member.id)
          const statusConfig = taskStatusConfig[memberState.status]
          const isCurrentMember = member.id === currentMemberId
          const showChildUpload =
            isChild && isCurrentMember &&
            (memberState.status === 'pending' || memberState.status === 'rejected')
          const showParentReview = isParent && memberState.status === 'checking'
          const checkedByMember = memberState.checkedBy
            ? familyMembers.find((m) => m.id === memberState.checkedBy)
            : null

          return (
            <View key={member.id} className={styles.card}>
              <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <View style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <Image
                    src={member.avatar}
                    mode="aspectFill"
                    style={{ width: 96, height: 96, borderRadius: 48, flexShrink: 0 }}
                  />
                  <View style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Text style={{ fontSize: 30, fontWeight: 600, color: '#1a1a2e' }}>
                      {member.name}
                    </Text>
                    <Text style={{ fontSize: 22, color: '#FF9F43', fontWeight: 600 }}>
                      🔥 连续打卡 {member.streak} 天
                    </Text>
                  </View>
                </View>
                <View
                  className={styles.statusBadge}
                  style={{ background: `${statusConfig.color}15`, color: statusConfig.color, marginLeft: 0 }}
                >
                  {statusConfig.label}
                </View>
              </View>

              {(memberState.status === 'pending' || memberState.status === 'checking') && (
                <View style={{ marginTop: -8, marginBottom: 16 }}>
                  {(() => {
                    const nextStreak = member.streak + 1
                    const isBonusDay = nextStreak % task.bonusDays === 0
                    if (isBonusDay) {
                      return (
                        <Text style={{ fontSize: 22, color: '#00B894' }}>
                          🔥 本次完成将触发连续奖励 +{task.bonusPoints}分
                        </Text>
                      )
                    } else {
                      const daysLeft = task.bonusDays - ((nextStreak % task.bonusDays) || task.bonusDays)
                      return (
                        <Text style={{ fontSize: 22, color: '#999' }}>
                          还差 {daysLeft} 天触发连续 +{task.bonusPoints}分奖励
                        </Text>
                      )
                    }
                  })()}
                </View>
              )}

              {memberState.status === 'rejected' && memberState.remark && (
                <View className={styles.remarkBox}>
                  <View className={styles.remarkLabel}>驳回原因</View>
                  <View className={styles.remarkText}>{memberState.remark}</View>
                </View>
              )}

              {memberState.status === 'done' && checkedByMember && memberState.checkedAt && (
                <View className={styles.approvedInfo}>
                  <Text className={styles.approvedText}>
                    ✅ {checkedByMember.name} 于 {formatDateTime(memberState.checkedAt)} 审核通过
                  </Text>
                  <View style={{ marginTop: 8 }}>
                    {(() => {
                      const earnedPoints = memberState.earnedPoints || 0
                      const bonusPoints = memberState.bonusPoints || 0
                      const bonusTriggered = memberState.bonusTriggered
                      const total = earnedPoints + bonusPoints
                      return (
                        <Text style={{ fontSize: 24, color: '#FF9F43', fontWeight: 600 }}>
                          💸 获得 基础分 +{earnedPoints}
                          {bonusTriggered && bonusPoints > 0 && (
                            <> 🎁 +{bonusPoints} 连续奖励</>
                          )}
                          {' '}= +{total} 分
                        </Text>
                      )
                    })()}
                  </View>
                </View>
              )}

              {memberState.photo ? (
                <View style={{ marginTop: 16 }}>
                  <Image
                    className={styles.photoImage}
                    src={memberState.photo}
                    mode="aspectFill"
                    onClick={() => {
                      Taro.previewImage({
                        urls: [memberState.photo!],
                        current: memberState.photo
                      })
                    }}
                  />
                  {memberState.submittedAt && (
                    <View className={styles.photoTime}>
                      打卡时间：{formatDateTime(memberState.submittedAt)}
                    </View>
                  )}
                </View>
              ) : null}

              {showChildUpload && (
                <View style={{ marginTop: 16 }}>
                  <Button
                    className={styles.uploadBtn}
                    onClick={() => handleUploadPhoto(member.id)}
                  >
                    <Text className={styles.uploadIcon}>📷</Text>
                    <Text>
                      {memberState.status === 'rejected' ? '重新上传打卡照片' : '点击上传打卡照片'}
                    </Text>
                  </Button>
                </View>
              )}

              {showParentReview && (
                <View className={styles.reviewSection} style={{ marginTop: 16, padding: 0, boxShadow: 'none', marginBottom: 0, background: 'transparent' }}>
                  <View className={styles.formTitle}>✅ 家长审核</View>
                  <Textarea
                    className={styles.reviewTextarea}
                    placeholder="填写审核评论（驳回必填，通过可选）"
                    value={memberRemarks[member.id] || ''}
                    onInput={(e) => setMemberRemarks((prev) => ({ ...prev, [member.id]: e.detail.value }))}
                    maxlength={200}
                  />
                  <View className={styles.reviewBtns}>
                    <Button className={styles.rejectBtn} onClick={() => handleReject(member.id)}>
                      ✋ 驳回
                    </Button>
                    <Button className={styles.approveBtn} onClick={() => handleApprove(member.id)}>
                      ✅ 通过 +{task.points}分
                    </Button>
                  </View>
                </View>
              )}
            </View>
          )
        })}
      </View>

      {renderActionBar()}
    </View>
  )
}

export default TaskDetailPage
