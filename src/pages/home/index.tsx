import React, { useMemo, useState } from 'react'
import { View, Text, Image, Button, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { taskTypeConfig, taskStatusConfig, formatDate } from '../../utils'
import EmptyState from '../../components/EmptyState'

const filterOptions = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待完成' },
  { key: 'checking', label: '待审核' },
  { key: 'done', label: '已完成' }
]

const HomePage: React.FC = () => {
  const {
    tasks,
    familyMembers,
    currentMemberId,
    setCurrentMember,
    currentRole,
    switchRole,
    submitTaskPhoto,
    updateTaskStatus
  } = useAppStore()

  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const childMembers = familyMembers.filter((m) => m.role === 'child')
  const currentMember = familyMembers.find((m) => m.id === currentMemberId) || childMembers[0]

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t) =>
      currentRole === 'parent' ? true : t.assignedTo.includes(currentMemberId)
    )
    if (filter !== 'all') {
      list = list.filter((t) => t.status === filter)
    }
    return list
  }, [tasks, filter, currentMemberId, currentRole])

  const stats = useMemo(() => {
    const todayStr = formatDate(new Date())
    const todayTasks = tasks.filter(
      (t) => t.createdAt === todayStr && t.assignedTo.includes(currentMemberId)
    )
    return {
      total: todayTasks.length,
      done: todayTasks.filter((t) => t.status === 'done').length,
      checking: tasks.filter((t) => t.status === 'checking').length
    }
  }, [tasks, currentMemberId])

  const pendingReviewTasks = useMemo(
    () => tasks.filter((t) => t.status === 'checking'),
    [tasks]
  )

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  const handleCheckIn = async (taskId: string) => {
    try {
      const res = await Taro.chooseImage({ count: 1 })
      if (res.tempFilePaths && res.tempFilePaths[0]) {
        submitTaskPhoto(taskId, res.tempFilePaths[0])
        Taro.showToast({ title: '已提交审核', icon: 'success' })
      }
    } catch (e) {
      console.error('[Home] chooseImage error', e)
    }
  }

  const handleApprove = (taskId: string, pass: boolean) => {
    Taro.showModal({
      title: pass ? '通过审核' : '驳回任务',
      content: pass ? '确认给孩子此任务的积分吗？' : '请确认要驳回此任务',
      success: (res) => {
        if (res.confirm) {
          if (pass) {
            updateTaskStatus(taskId, 'done', '做得很棒！')
            Taro.showToast({ title: '已通过', icon: 'success' })
          } else {
            updateTaskStatus(taskId, 'rejected', '请重新完成')
            Taro.showToast({ title: '已驳回', icon: 'none' })
          }
        }
      }
    })
  }

  const goPublish = () => {
    Taro.navigateTo({ url: '/pages/task-publish/index' })
  }

  const goTaskDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?taskId=${id}` })
  }

  return (
    <ScrollView
      className="page-container"
      scrollY
      enableBackToTop
      refresherEnabled
      refresherTriggered={refreshing}
      onRefresherRefresh={handleRefresh}
    >
      <View className={styles.header}>
        <View className={styles.headerTop}>
          <View>
            <Text className={styles.greeting}>
              {currentRole === 'parent' ? '👨‍👩‍👧‍👦 欢迎回来' : `嗨，${currentMember?.name}！`}
            </Text>
            <View className={styles.dateText}>
              {formatDate(new Date(), 'YYYY年MM月DD日 dddd')}
            </View>
          </View>
          <View className={styles.roleSwitch} onClick={switchRole}>
            {currentRole === 'parent' ? '切换到孩子' : '切换到家长'}
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statCard}>
            <View className={styles.statValue}>{stats.total}</View>
            <View className={styles.statLabel}>今日任务</View>
          </View>
          <View className={styles.statCard}>
            <View className={styles.statValue} style={{ color: '#00B894' }}>
              {stats.done}
            </View>
            <View className={styles.statLabel}>已完成</View>
          </View>
          <View className={styles.statCard}>
            <View className={styles.statValue} style={{ color: '#54A0FF' }}>
              {stats.checking}
            </View>
            <View className={styles.statLabel}>待审核</View>
          </View>
        </View>

        {currentMember?.role === 'child' && (
          <View className={styles.streakCard}>
            <View className={styles.streakInfo}>
              <View className={styles.streakTitle}>🔥 连续打卡</View>
              <View>
                <Text className={styles.streakValue}>{currentMember.streak}</Text>
                <Text className={styles.streakUnit}>天</Text>
              </View>
              <View className={styles.streakReward}>
                再{Math.max(0, 7 - (currentMember.streak % 7 || 7))}天获得奖励积分
              </View>
            </View>
            <View className={styles.streakIcon}>🏆</View>
          </View>
        )}

        <View className={styles.memberSelector}>
          {childMembers.map((m) => (
            <View
              key={m.id}
              className={classnames(styles.memberTab, currentMemberId === m.id && styles.active)}
              onClick={() => setCurrentMember(m.id)}
            >
              <Image className={styles.memberAvatar} src={m.avatar} mode="aspectFill" />
              <Text>{m.name}</Text>
            </View>
          ))}
        </View>

        {currentRole === 'parent' && pendingReviewTasks.length > 0 && (
          <View className={styles.pendingReview} onClick={() => setFilter('checking')}>
            <Text className={styles.pendingText}>📋 有{pendingReviewTasks.length}个任务待审核</Text>
            <Text className={styles.pendingCount}>去处理</Text>
          </View>
        )}
      </View>

      <View className={styles.filterTabs}>
        {filterOptions.map((opt) => (
          <View
            key={opt.key}
            className={classnames(styles.filterTab, filter === opt.key && styles.active)}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </View>
        ))}
      </View>

      <View className={styles.section}>
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon="✅"
            title="暂无任务"
            desc={currentRole === 'parent' ? '点击右下角按钮发布任务吧' : '今天的任务都完成啦，真棒！'}
          />
        ) : (
          <View className={styles.taskList}>
            {filteredTasks.map((task) => {
              const typeConf = taskTypeConfig[task.type]
              const statusConf = taskStatusConfig[task.status]
              const assignees = familyMembers.filter((m) => task.assignedTo.includes(m.id))
              return (
                <View key={task.id} className={styles.taskCard} onClick={() => goTaskDetail(task.id)}>
                  <View className={styles.taskHeader}>
                    <View>
                      <View
                        className={styles.typeTag}
                        style={{ background: typeConf.bgColor, color: typeConf.color }}
                      >
                        {typeConf.label}
                      </View>
                      <Text
                        className={styles.typeTag}
                        style={{
                          background: 'transparent',
                          color: statusConf.color,
                          marginLeft: 12,
                          padding: 0
                        }}
                      >
                        · {statusConf.label}
                      </Text>
                    </View>
                    <View className={styles.pointsBadge}>
                      ⭐<Text className={styles.pointsNum}>{task.points}</Text>
                    </View>
                  </View>

                  <View className={styles.taskTitle}>{task.title}</View>
                  <View className={styles.taskDesc}>{task.description}</View>

                  {task.photo && (
                    <Image
                      className={styles.taskPhoto}
                      src={task.photo}
                      mode="aspectFill"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <View className={styles.taskMeta}>
                    <View className={styles.metaItem}>
                      <Text className={styles.metaIcon}>⏰</Text>
                      <Text>{task.reminder || '无提醒'}</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text className={styles.metaIcon}>🎁</Text>
                      <Text>连续{task.bonusDays}天+{task.bonusPoints}分</Text>
                    </View>
                    <View className={styles.metaItem}>
                      <Text className={styles.metaIcon}>👶</Text>
                      <Text>{assignees.map((a) => a.name).join('、')}</Text>
                    </View>
                  </View>

                  <View className={styles.actionBtns}>
                    {currentRole === 'child' && task.status === 'pending' && (
                      <Button
                        className={classnames(styles.btn, styles.btnPrimary)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCheckIn(task.id)
                        }}
                      >
                        📷 打卡
                      </Button>
                    )}
                    {currentRole === 'child' && task.status === 'rejected' && (
                      <Button
                        className={classnames(styles.btn, styles.btnPrimary)}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCheckIn(task.id)
                        }}
                      >
                        🔄 重新打卡
                      </Button>
                    )}
                    {currentRole === 'parent' && task.status === 'checking' && (
                      <>
                        <Button
                          className={classnames(styles.btn, styles.btnDanger)}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(task.id, false)
                          }}
                        >
                          驳回
                        </Button>
                        <Button
                          className={classnames(styles.btn, styles.btnSuccess)}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleApprove(task.id, true)
                          }}
                        >
                          ✅ 通过
                        </Button>
                      </>
                    )}
                    {task.status === 'done' && (
                      <Button className={classnames(styles.btn, styles.btnSecondary)}>
                        ✓ 已完成 +{task.points}分
                      </Button>
                    )}
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </View>

      {currentRole === 'parent' && (
        <View className={styles.fab} onClick={goPublish}>
          <Text className={styles.fabIcon}>+</Text>
        </View>
      )}
    </ScrollView>
  )
}

export default HomePage
