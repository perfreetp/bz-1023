import React, { useState } from 'react'
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
    updateTaskStatus
  } = useAppStore()

  const task = tasks.find((t) => t.id === taskId)
  const [remark, setRemark] = useState('')
  const [uploading, setUploading] = useState(false)

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
  const statusConfig = taskStatusConfig[task.status]
  const typeIcon = taskTypeIconMap[task.type] || '✨'

  const assignedMembers = familyMembers.filter((m) => task.assignedTo.includes(m.id))
  const isParent = currentRole === 'parent'
  const isChild = currentRole === 'child'
  const isMyTask = task.assignedTo.includes(currentMemberId)

  const checkedByMember = task.checkedBy
    ? familyMembers.find((m) => m.id === task.checkedBy)
    : null

  const handleUploadPhoto = () => {
    if (uploading) return
    setUploading(true)
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        submitTaskPhoto(task.id, tempFilePath)
        Taro.showToast({ title: '打卡成功，等待审核', icon: 'success' })
      },
      fail: () => {
        Taro.showToast({ title: '已取消', icon: 'none' })
      },
      complete: () => {
        setUploading(false)
      }
    })
  }

  const handleApprove = () => {
    updateTaskStatus(task.id, 'done', remark.trim() || undefined)
    Taro.showToast({ title: '已通过', icon: 'success' })
  }

  const handleReject = () => {
    if (!remark.trim()) {
      Taro.showToast({ title: '请填写驳回理由', icon: 'none' })
      return
    }
    updateTaskStatus(task.id, 'rejected', remark.trim())
    Taro.showToast({ title: '已驳回', icon: 'none' })
  }

  const showChildUpload = isChild && isMyTask && task.status === 'pending'
  const showParentReview = isParent && task.status === 'checking'

  const renderActionBar = () => {
    if (isParent) {
      if (task.status === 'checking') {
        return (
          <View className={styles.actionBar}>
            <Button className={styles.secondaryBtn} onClick={handleReject}>
              ✋ 驳回
            </Button>
            <Button className={styles.primaryBtn} onClick={handleApprove}>
              ✅ 通过
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

    if (isChild) {
      if (task.status === 'pending' && isMyTask) {
        return (
          <View className={styles.actionBar}>
            <Button
              className={styles.fullWidthBtn}
              onClick={handleUploadPhoto}
            >
              📸 立即打卡
            </Button>
          </View>
        )
      }
      if (task.status === 'rejected' && isMyTask) {
        return (
          <View className={styles.actionBar}>
            <Button
              className={styles.fullWidthBtn}
              onClick={handleUploadPhoto}
            >
              📸 重新打卡
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

    return null
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
              style={{ background: `${statusConfig.color}15`, color: statusConfig.color }}
            >
              {statusConfig.label}
            </View>
          </View>

          <View className={styles.taskTitle}>{task.title}</View>
          {task.description && (
            <View className={styles.taskDesc}>{task.description}</View>
          )}

          {task.status === 'rejected' && task.remark && (
            <View className={styles.remarkBox}>
              <View className={styles.remarkLabel}>驳回原因</View>
              <View className={styles.remarkText}>{task.remark}</View>
            </View>
          )}

          {task.status === 'done' && checkedByMember && (
            <View className={styles.approvedInfo}>
              <Text className={styles.approvedText}>
                ✅ {checkedByMember.name} 于 {formatDateTime(task.checkedAt!)} 审核通过
              </Text>
            </View>
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

        <View className={styles.card}>
          <View className={styles.formTitle}>👤 执行人</View>
          <View className={styles.memberList}>
            {assignedMembers.map((m) => (
              <View key={m.id} className={styles.memberItem}>
                <Image
                  className={styles.memberAvatar}
                  src={m.avatar}
                  mode="aspectFill"
                />
                <View className={styles.memberInfo}>
                  <Text className={styles.memberName}>{m.name}</Text>
                  <Text className={styles.memberStreak}>🔥 连续打卡 {m.streak} 天</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className={styles.photoSection}>
          <View className={styles.formTitle}>📸 打卡照片</View>

          {task.photo ? (
            <View>
              <Image
                className={styles.photoImage}
                src={task.photo}
                mode="aspectFill"
                onClick={() => {
                  Taro.previewImage({
                    urls: [task.photo!],
                    current: task.photo
                  })
                }}
              />
              {task.status === 'checking' && (
                <View className={styles.photoTime}>
                  打卡时间：{formatDateTime(task.createdAt)}
                </View>
              )}
            </View>
          ) : showChildUpload ? (
            <Button className={styles.uploadBtn} onClick={handleUploadPhoto}>
              <Text className={styles.uploadIcon}>📷</Text>
              <Text>点击上传打卡照片</Text>
            </Button>
          ) : (
            <View className={styles.emptyPhoto}>
              <Text className={styles.emptyPhotoIcon}>🖼️</Text>
              <Text>暂无打卡照片</Text>
            </View>
          )}
        </View>

        {showParentReview && (
          <View className={styles.reviewSection}>
            <View className={styles.formTitle}>✅ 家长审核</View>
            <Textarea
              className={styles.reviewTextarea}
              placeholder="填写审核评论（驳回必填，通过可选）"
              value={remark}
              onInput={(e) => setRemark(e.detail.value)}
              maxlength={200}
            />
            <View className={styles.reviewBtns}>
              <Button className={styles.rejectBtn} onClick={handleReject}>
                ✋ 驳回
              </Button>
              <Button className={styles.approveBtn} onClick={handleApprove}>
                ✅ 通过
              </Button>
            </View>
          </View>
        )}
      </View>

      {renderActionBar()}
    </View>
  )
}

export default TaskDetailPage
