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
    updateTaskMemberStatus
  } = useAppStore()

  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  const childMembers = familyMembers.filter((m) => m.role === 'child')
  const currentMember = familyMembers.find((m) => m.id === currentMemberId) || childMembers[0]

  const getMemberTaskStatus = (task: any, memberId: string) => {
    return task.perMemberStatus?.[memberId]?.status || task.status
  }

  const getMemberTaskPhoto = (task: any, memberId: string) => {
    return task.perMemberStatus?.[memberId]?.photo || task.photo
  }

  const filteredTasks = useMemo(() => {
    let list = tasks.filter((t: any) =>
      currentRole === 'parent' ? true : t.assignedTo.includes(currentMemberId)
    )
    if (filter !== 'all') {
      list = list.filter((t: any) => {
        if (currentRole === 'parent') {
          const memStatuses = Object.values(t.perMemberStatus || {}).map((s: any) => s.status)
          return memStatuses.includes(filter as any)
        } else {
          return getMemberTaskStatus(t, currentMemberId) === filter
        }
      })
    }
    return list
  }, [tasks, filter, currentMemberId, currentRole])

  const stats = useMemo(() => {
    const todayStr = formatDate(new Date())
    const todayTasks = tasks.filter((t: any) => {
      const created = new Date(t.createdAt).toISOString().split('T')[0]
      return (
        (created === todayStr || t.deadline >= todayStr) &&
        t.assignedTo.includes(currentMemberId)
      )
    })
    return {
      total: todayTasks.length,
      done: todayTasks.filter((t: any) => getMemberTaskStatus(t, currentMemberId) === 'done').length,
      checking: todayTasks.filter((t: any) => getMemberTaskStatus(t, currentMemberId) === 'checking').length
    }
  }, [tasks, currentMemberId])

  const pendingReviewTasks = useMemo(
    () =>
      tasks.filter((t: any) => {
        const memStatuses = Object.values(t.perMemberStatus || {}).map((s: any) => s.status)
        return memStatuses.includes('checking')
      }),
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
        submitTaskPhoto(taskId, currentMemberId, res.tempFilePaths[0])
        Taro.showToast({ title: '已提交审核', icon: 'success' })
      }
    } catch (e) {
      console.error('[Home] chooseImage error', e)
    }
  }

  const handleApprove = (taskId: string, memberId: string, pass: boolean) => {
    const member = familyMembers.find((m) => m.id === memberId)
    Taro.showModal({
      title: pass ? `通过 ${member?.name} 的审核` : `驳回 ${member?.name} 的任务`,
      content: pass ? '确认给这个孩子该任务的积分吗？' : '请确认要驳回此任务',
      success: (res) => {
        if (res.confirm) {
          if (pass) {
            updateTaskMemberStatus(taskId, memberId, 'done', '做得很棒！')
            Taro.showToast({ title: '已通过', icon: 'success' })
          } else {
            updateTaskMemberStatus(taskId, memberId, 'rejected', '请重新完成')
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
            {filteredTasks.map((task: any) => {
              const typeConf = taskTypeConfig[task.type]
              const childStatus = getMemberTaskStatus(task, currentMemberId)
              const statusConf = taskStatusConfig[childStatus]
              const assignees = familyMembers.filter((m) => task.assignedTo.includes(m.id))
              const memberPhoto = getMemberTaskPhoto(task, currentMemberId)

              const getStatusBadgeForMember = (mid: string) => {
                const s = task.perMemberStatus?.[mid]?.status || task.status
                const conf = taskStatusConfig[s]
                return (
                  <Text
                    style={{
                      fontSize: 20,
                      color: conf.color,
                      background: conf.bgColor,
                      padding: '2rpx 12rpx',
                      borderRadius: 16,
                      marginLeft: 8
                    }}
                  >
                    {conf.label}
                  </Text>
                )
              }

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
                      {currentRole === 'child' && (
                        <Text
                          style={{
                            fontSize: 22,
                            color: statusConf.color,
                            marginLeft: 12
                          }}
                        >
                          · {statusConf.label}
                        </Text>
                      )}
                    </View>
                    <View className={styles.pointsBadge}>
                      ⭐<Text className={styles.pointsNum}>{task.points}</Text>
                    </View>
                  </View>

                  <View className={styles.taskTitle}>{task.title}</View>
                  <View className={styles.taskDesc}>{task.description}</View>

                  {currentRole === 'child' && memberPhoto && (
                    <Image
                      className={styles.taskPhoto}
                      src={memberPhoto}
                      mode="aspectFill"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  {currentRole === 'parent' &&
                    assignees
                      .filter((a) => a.role === 'child')
                      .map((m) => {
                        const p = task.perMemberStatus?.[m.id]
                        if (p?.photo) {
                          return (
                            <View
                              key={`photo-${m.id}`}
                              style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Image
                                src={m.avatar}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  marginRight: 12
                                }}
                                mode="aspectFill"
                              />
                              <Text style={{ fontSize: 24, color: '#333', marginRight: 12 }}>
                                {m.name}的打卡照片
                              </Text>
                              {getStatusBadgeForMember(m.id)}
                              <Image
                                className={styles.taskPhoto}
                                src={p.photo}
                                mode="aspectFill"
                                style={{
                                  width: 120,
                                  height: 120,
                                  borderRadius: 16,
                                  marginLeft: 'auto'
                                }}
                              />
                            </View>
                          )
                        }
                        return null
                      })}

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
                    {currentRole === 'child' && childStatus === 'pending' && (
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
                    {currentRole === 'child' && childStatus === 'rejected' && (
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
                    {currentRole === 'child' && childStatus === 'checking' && (
                      <Button className={classnames(styles.btn, styles.btnSecondary)}>
                        ⏳ 审核中
                      </Button>
                    )}
                    {currentRole === 'parent' &&
                      assignees
                        .filter((a) => a.role === 'child')
                        .map((m) => {
                          const mStatus = getMemberTaskStatus(task, m.id)
                          return (
                            <View key={`btns-${m.id}`} style={{ width: '100%', marginTop: 8 }}>
                              <Text
                                style={{
                                  fontSize: 22,
                                  color: '#666',
                                  marginBottom: 6,
                                  display: 'block'
                                }}
                              >
                                {m.name}：
                              </Text>
                              <View
                                style={{
                                  display: 'flex',
                                  gap: 12,
                                  flexWrap: 'wrap'
                                }}
                              >
                                {mStatus === 'checking' && (
                                  <>
                                    <Button
                                      className={classnames(styles.btn, styles.btnDanger)}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleApprove(task.id, m.id, false)
                                      }}
                                    >
                                      驳回
                                    </Button>
                                    <Button
                                      className={classnames(styles.btn, styles.btnSuccess)}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleApprove(task.id, m.id, true)
                                      }}
                                    >
                                      ✅ 通过 +{task.points}
                                    </Button>
                                  </>
                                )}
                                {mStatus === 'pending' && (
                                  <Button className={classnames(styles.btn, styles.btnSecondary)}>
                                    待完成
                                  </Button>
                                )}
                                {mStatus === 'rejected' && (
                                  <Button
                                    className={classnames(styles.btn, styles.btnDanger)}
                                    style={{ opacity: 0.6 }}
                                  >
                                    已驳回
                                  </Button>
                                )}
                                {mStatus === 'done' && (
                                  <Button className={classnames(styles.btn, styles.btnSuccess)}>
                                    ✓ 已完成 +{task.points}分
                                  </Button>
                                )}
                              </View>
                            </View>
                          )
                        })}
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
