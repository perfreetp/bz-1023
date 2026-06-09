import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import dayjs from 'dayjs'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import {
  formatDate,
  formatRelative,
  taskTypeConfig,
  taskStatusConfig,
  pointTypeConfig
} from '../../utils'
import EmptyState from '../../components/EmptyState'

const earnTypes = ['earn', 'bonus', 'reward']
const deductTypes = ['deduct']

const taskTypeEmoji: Record<string, string> = {
  reading: '📖',
  tidying: '🧹',
  exercise: '🏃',
  homework: '📝',
  other: '📌'
}

const sectionTabs = [
  { key: 'report', label: '📊 月报' },
  { key: 'task', label: '任务' },
  { key: 'points', label: '积分' },
  { key: 'exchange', label: '兑换' },
  { key: 'growth', label: '成长' }
]

const ChildProfilePage: React.FC = () => {
  const router = useRouter()
  const routeMemberId = router.params.memberId

  const {
    familyMembers,
    tasks,
    pointRecords,
    exchangeRecords,
    growthRecords,
    setCurrentMember
  } = useAppStore()

  const childMembers = familyMembers.filter((m) => m.role === 'child')
  const initialMemberId = routeMemberId || childMembers[0]?.id
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId)
  const [activeTab, setActiveTab] = useState('report')
  const [reportMonth, setReportMonth] = useState(dayjs())

  const handleMemberSwitch = (memberId: string) => {
    setSelectedMemberId(memberId)
    setCurrentMember(memberId)
  }

  const currentMember = familyMembers.find((m) => m.id === selectedMemberId) || childMembers[0]

  const joinDays = useMemo(() => {
    if (!currentMember?.createdAt) return 1
    const start = dayjs((currentMember as any).createdAt)
    return Math.max(1, dayjs().diff(start, 'day') + 1)
  }, [currentMember])

  const now = dayjs()
  const currentMonthStr = formatDate(now.toDate(), 'YYYY-MM')

  const stats = useMemo(() => {
    const memberTasks = tasks.filter((t) => {
      const memberStatus = t.perMemberStatus?.[selectedMemberId]
      if (!memberStatus) return false
      const taskMonth = formatDate(t.createdAt, 'YYYY-MM')
      return memberStatus.status === 'done' && taskMonth === currentMonthStr
    })

    const monthPoints = pointRecords
      .filter((r) => {
        if (r.memberId !== selectedMemberId) return false
        const recordMonth = formatDate(r.createdAt, 'YYYY-MM')
        return recordMonth === currentMonthStr
      })
      .filter((r) => earnTypes.includes(r.type))
      .reduce((s, r) => s + r.amount, 0)

    const approvedExchanges = exchangeRecords.filter(
      (e) => e.memberId === selectedMemberId && e.status !== 'rejected'
    ).length

    const photoCount = growthRecords
      .filter((g) => g.memberId === selectedMemberId)
      .reduce((s, g) => s + g.photos.length, 0)

    return {
      monthlyTasks: memberTasks.length,
      monthlyPoints,
      approvedExchanges,
      photoCount
    }
  }, [tasks, pointRecords, exchangeRecords, growthRecords, selectedMemberId, currentMonthStr])

  const memberTasks = useMemo(() => {
    return tasks
      .filter((t) => t.assignedTo.includes(selectedMemberId) && t.perMemberStatus?.[selectedMemberId])
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 20)
  }, [tasks, selectedMemberId])

  const memberPointRecords = useMemo(() => {
    return pointRecords
      .filter((r) => r.memberId === selectedMemberId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [pointRecords, selectedMemberId])

  const pointsSummary = useMemo(() => {
    const totalEarn = memberPointRecords
      .filter((r) => earnTypes.includes(r.type))
      .reduce((s, r) => s + r.amount, 0)
    const totalSpend = memberPointRecords
      .filter((r) => deductTypes.includes(r.type))
      .reduce((s, r) => s + r.amount, 0)
    return {
      totalEarn,
      totalSpend,
      net: totalEarn - totalSpend
    }
  }, [memberPointRecords])

  const memberExchanges = useMemo(() => {
    return exchangeRecords
      .filter((e) => e.memberId === selectedMemberId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [exchangeRecords, selectedMemberId])

  const memberGrowth = useMemo(() => {
    return growthRecords
      .filter((g) => g.memberId === selectedMemberId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  }, [growthRecords, selectedMemberId])

  const reportMonthStr = formatDate(reportMonth.toDate(), 'YYYY-MM')

  const reportStats = useMemo(() => {
    const monthStart = reportMonth.startOf('month').toDate().getTime()
    const monthEnd = reportMonth.endOf('month').toDate().getTime()

    const inMonth = (dateStr: string) => {
      const t = new Date(dateStr).getTime()
      return t >= monthStart && t <= monthEnd
    }

    const doneTasks = tasks.filter((t) => {
      const ms = t.perMemberStatus?.[selectedMemberId]
      if (!ms || ms.status !== 'done') return false
      return inMonth(ms.checkedAt || t.createdAt)
    })

    const monthPointRecords = pointRecords.filter(
      (r) => r.memberId === selectedMemberId && inMonth(r.createdAt)
    )

    const basePoints = monthPointRecords
      .filter((r) => r.type === 'earn' && r.sourceType === 'task')
      .reduce((s, r) => s + r.amount, 0)

    const bonusPoints = monthPointRecords
      .filter((r) => r.type === 'bonus')
      .reduce((s, r) => s + r.amount, 0)

    const rewardPoints = monthPointRecords
      .filter((r) => r.type === 'reward')
      .reduce((s, r) => s + r.amount, 0)

    const monthExchanges = exchangeRecords.filter(
      (e) =>
        e.memberId === selectedMemberId &&
        inMonth(e.createdAt) &&
        (e.status === 'pending' || e.status === 'approved' || e.status === 'delivered')
    )
    const exchangeCost = monthExchanges.reduce((s, e) => s + e.points, 0)

    const photoCount = growthRecords
      .filter((g) => g.memberId === selectedMemberId && inMonth(g.createdAt))
      .reduce((s, g) => s + g.photos.length, 0)

    const netGrowth = basePoints + bonusPoints + rewardPoints - exchangeCost

    return {
      doneCount: doneTasks.length,
      basePoints,
      bonusPoints,
      exchangeCost,
      photoCount,
      netGrowth,
      doneTasks,
      monthExchanges
    }
  }, [
    tasks,
    pointRecords,
    exchangeRecords,
    growthRecords,
    selectedMemberId,
    reportMonthStr
  ])

  const handlePrevMonth = () => setReportMonth(reportMonth.subtract(1, 'month'))
  const handleNextMonth = () => {
    const next = reportMonth.add(1, 'month')
    if (next.isAfter(dayjs(), 'month')) return
    setReportMonth(next)
  }

  const goTaskDetail = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?taskId=${taskId}` })
  }

  const goRewardDetail = (rewardId: string) => {
    Taro.navigateTo({ url: `/pages/reward-detail/index?rewardId=${rewardId}` })
  }

  const goExchangeDetail = (exchangeId: string) => {
    Taro.navigateTo({ url: `/pages/reward-approval/index?exchangeId=${exchangeId}` })
  }

  const getRecordIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      earn: '✅',
      bonus: '🎁',
      reward: '✨',
      deduct: '💸'
    }
    return iconMap[type] || '📌'
  }

  const getRecordBgColor = (type: string) => {
    const bgMap: Record<string, string> = {
      earn: 'rgba(0, 184, 148, 0.12)',
      bonus: 'rgba(255, 217, 61, 0.18)',
      reward: 'rgba(255, 159, 67, 0.15)',
      deduct: 'rgba(255, 107, 107, 0.12)'
    }
    return bgMap[type] || 'rgba(99, 110, 114, 0.12)'
  }

  const getExchangeStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: '待审批',
      approved: '已通过',
      rejected: '已驳回',
      delivered: '已发放'
    }
    return map[status] || status
  }

  return (
    <ScrollView className="page-container" scrollY enableBackToTop>
      <View className={styles.wrapper}>
        <View className={styles.profileHeader}>
          <View className={styles.avatarLarge}>
            <Image src={currentMember?.avatar} mode="aspectFill" />
          </View>
          <Text className={styles.nameText}>{currentMember?.name}</Text>
          <View className={styles.metaRow}>
            <View className={styles.metaBadge}>🔥 连胜{currentMember?.streak || 0}天</View>
            <View className={styles.metaBadge}>⭐ 当前{currentMember?.points || 0}积分</View>
            <View className={styles.metaBadge}>📅 加入{joinDays}天</View>
          </View>
        </View>

        <ScrollView className={styles.memberTabs} scrollX enableFlex showScrollbar={false}>
          {childMembers.map((m) => (
            <View
              key={m.id}
              className={classnames(styles.memberChip, selectedMemberId === m.id && styles.active)}
              onClick={() => handleMemberSwitch(m.id)}
            >
              <Image className={styles.chipAvatar} src={m.avatar} mode="aspectFill" />
              <Text className={styles.chipName}>{m.name}</Text>
            </View>
          ))}
        </ScrollView>

        <View className={styles.statsGrid}>
          <View className={styles.statsCard}>
            <View className={styles.statsIcon}>✅</View>
            <View className={styles.statsNum}>{stats.monthlyTasks}</View>
            <View className={styles.statsLabel}>本月完成任务</View>
          </View>
          <View className={styles.statsCard}>
            <View className={styles.statsIcon}>💰</View>
            <View className={styles.statsNum}>{stats.monthlyPoints}</View>
            <View className={styles.statsLabel}>本月获得积分</View>
          </View>
          <View className={styles.statsCard}>
            <View className={styles.statsIcon}>🎁</View>
            <View className={styles.statsNum}>{stats.approvedExchanges}</View>
            <View className={styles.statsLabel}>累计兑换奖励</View>
          </View>
          <View className={styles.statsCard}>
            <View className={styles.statsIcon}>📷</View>
            <View className={styles.statsNum}>{stats.photoCount}</View>
            <View className={styles.statsLabel}>成长照片数量</View>
          </View>
        </View>

        <View className={styles.sectionTab}>
          {sectionTabs.map((t) => (
            <View
              key={t.key}
              className={classnames(styles.sectionTabItem, activeTab === t.key && styles.active)}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </View>
          ))}
        </View>

        <View className={styles.sectionTabContent}>
          {activeTab === 'report' && (
            <View>
              <View className={styles.monthSwitcher}>
                <View
                  className={styles.monthArrow}
                  onClick={handlePrevMonth}
                >
                  ←
                </View>
                <Text className={styles.monthText}>
                  {reportMonth.format('YYYY年M月')}
                </Text>
                <View
                  className={classnames(
                    styles.monthArrow,
                    reportMonth.isSame(dayjs(), 'month') && styles.disabled
                  )}
                  onClick={handleNextMonth}
                >
                  →
                </View>
              </View>

              {reportStats.doneCount === 0 &&
              reportStats.exchangeCost === 0 &&
              reportStats.photoCount === 0 ? (
                <EmptyState icon="📊" title="本月暂无记录" />
              ) : (
                <View>
                  <View className={styles.reportStatsGrid}>
                    <View className={styles.reportStatsCard}>
                      <View className={styles.reportStatsIcon}>✅</View>
                      <View className={styles.reportStatsNum}>
                        {reportStats.doneCount}
                      </View>
                      <View className={styles.reportStatsLabel}>
                        完成任务数
                      </View>
                    </View>
                    <View className={styles.reportStatsCard}>
                      <View className={styles.reportStatsIcon}>💰</View>
                      <View className={styles.reportStatsNum}>
                        {reportStats.basePoints}
                      </View>
                      <View className={styles.reportStatsLabel}>
                        基础分合计
                      </View>
                    </View>
                    <View className={styles.reportStatsCard}>
                      <View className={styles.reportStatsIcon}>🎁</View>
                      <View className={styles.reportStatsNum}>
                        {reportStats.bonusPoints}
                      </View>
                      <View className={styles.reportStatsLabel}>
                        连续奖励合计
                      </View>
                    </View>
                    <View className={styles.reportStatsCard}>
                      <View className={styles.reportStatsIcon}>🛍️</View>
                      <View className={styles.reportStatsNum}>
                        {reportStats.exchangeCost}
                      </View>
                      <View className={styles.reportStatsLabel}>
                        兑换消耗
                      </View>
                    </View>
                    <View className={styles.reportStatsCard}>
                      <View className={styles.reportStatsIcon}>📷</View>
                      <View className={styles.reportStatsNum}>
                        {reportStats.photoCount}
                      </View>
                      <View className={styles.reportStatsLabel}>
                        成长照片
                      </View>
                    </View>
                    <View className={styles.reportStatsCard}>
                      <View className={styles.reportStatsIcon}>📈</View>
                      <View
                        className={styles.reportStatsNum}
                        style={{
                          color:
                            reportStats.netGrowth >= 0
                              ? '#00B894'
                              : '#FF6B6B'
                        }}
                      >
                        {reportStats.netGrowth >= 0 ? '+' : ''}
                        {reportStats.netGrowth}
                      </View>
                      <View className={styles.reportStatsLabel}>
                        净增长
                      </View>
                    </View>
                  </View>

                  {reportStats.doneTasks.length > 0 && (
                    <View>
                      <View className={styles.reportSectionTitle}>
                        📋 任务完成清单
                      </View>
                      {reportStats.doneTasks
                        .sort(
                          (a, b) =>
                            new Date(
                              b.perMemberStatus?.[selectedMemberId]
                                ?.checkedAt || b.createdAt
                            ).getTime() -
                            new Date(
                              a.perMemberStatus?.[selectedMemberId]
                                ?.checkedAt || a.createdAt
                            ).getTime()
                        )
                        .map((task) => {
                          const ms =
                            task.perMemberStatus?.[selectedMemberId]
                          return (
                            <View
                              key={task.id}
                              className={styles.reportTaskItem}
                              onClick={() => goTaskDetail(task.id)}
                            >
                              <View
                                className={styles.taskTypeIcon}
                                style={{
                                  background:
                                    taskTypeConfig[task.type].bgColor
                                }}
                              >
                                {taskTypeEmoji[task.type] || '📌'}
                              </View>
                              <View className={styles.taskContent}>
                                <Text className={styles.taskTitle}>
                                  {task.title}
                                </Text>
                                <View className={styles.taskMeta}>
                                  <Text className={styles.taskPoints}>
                                    +{ms?.earnedPoints || task.points}
                                  </Text>
                                  {ms?.bonusTriggered &&
                                    ms.bonusPoints &&
                                    ms.bonusPoints > 0 && (
                                      <Text
                                        className={styles.taskBonusPoints}
                                      >
                                        🎁 +{ms.bonusPoints}
                                      </Text>
                                    )}
                                  <Text className={styles.taskTime}>
                                    {formatDate(
                                      ms?.checkedAt || task.createdAt,
                                      'MM-DD HH:mm'
                                    )}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )
                        })}
                    </View>
                  )}

                  {reportStats.monthExchanges.length > 0 && (
                    <View>
                      <View className={styles.reportSectionTitle}>
                        🛍️ 兑换消耗清单
                      </View>
                      {reportStats.monthExchanges
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .map((exchange) => (
                          <View
                            key={exchange.id}
                            className={styles.reportExchangeItem}
                            onClick={() => goExchangeDetail(exchange.id)}
                          >
                            <View className={styles.reportExchangeImage}>
                              <Image
                                src={exchange.rewardImage}
                                mode="aspectFill"
                              />
                            </View>
                            <View className={styles.exchangeInfo}>
                              <Text className={styles.exchangeName}>
                                {exchange.rewardName}
                              </Text>
                              <View className={styles.exchangeMeta}>
                                <View
                                  className={classnames(
                                    styles.exchangeStatusBadge,
                                    exchange.status
                                  )}
                                >
                                  {getExchangeStatusLabel(
                                    exchange.status
                                  )}
                                </View>
                                <Text>
                                  {formatDate(
                                    exchange.createdAt,
                                    'MM-DD HH:mm'
                                  )}
                                </Text>
                              </View>
                            </View>
                            <View className={styles.exchangePoints}>
                              -{exchange.points}
                            </View>
                          </View>
                        ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {activeTab === 'task' && (
            <View>
              {memberTasks.length === 0 ? (
                <EmptyState icon="📋" title="暂无任务" desc="还没有参与的任务哦" />
              ) : (
                memberTasks.map((task) => {
                  const memberStatus = task.perMemberStatus?.[selectedMemberId]
                  const statusConf = memberStatus ? taskStatusConfig[memberStatus.status] : taskStatusConfig[task.status]
                  const typeConf = taskTypeConfig[task.type]
                  const isDone = memberStatus?.status === 'done'
                  const earnedPoints = memberStatus?.earnedPoints ?? task.points
                  const bonusPoints = memberStatus?.bonusPoints ?? 0
                  return (
                    <View key={task.id} className={styles.taskItem}>
                      <View
                        className={styles.taskTypeIcon}
                        style={{ background: typeConf.bgColor }}
                      >
                        {taskTypeEmoji[task.type] || '📌'}
                      </View>
                      <View className={styles.taskContent}>
                        <Text className={styles.taskTitle}>{task.title}</Text>
                        <View className={styles.taskMeta}>
                          <View
                            className={styles.taskStatusBadge}
                            style={{ background: `${statusConf.color}20`, color: statusConf.color }}
                          >
                            {statusConf.label}
                          </View>
                          {isDone && (
                            <>
                              <Text className={styles.taskPoints}>+{earnedPoints}</Text>
                              {bonusPoints > 0 && (
                                <Text className={styles.taskBonusPoints}>
                                  🎁 +{bonusPoints}
                                </Text>
                              )}
                            </>
                          )}
                          <Text className={styles.taskTime}>
                            {formatRelative(memberStatus?.checkedAt || task.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )
                })
              )}
            </View>
          )}

          {activeTab === 'points' && (
            <View>
              <View className={styles.pointsSummary}>
                <View className={styles.pointsSummaryItem}>
                  <View className={classnames(styles.pointsSummaryNum, 'earn')}>
                    +{pointsSummary.totalEarn}
                  </View>
                  <View className={styles.pointsSummaryLabel}>累计获得</View>
                </View>
                <View className={styles.pointsSummaryItem}>
                  <View className={classnames(styles.pointsSummaryNum, 'spend')}>
                    -{pointsSummary.totalSpend}
                  </View>
                  <View className={styles.pointsSummaryLabel}>累计消费</View>
                </View>
                <View className={styles.pointsSummaryItem}>
                  <View
                    className={classnames(
                      styles.pointsSummaryNum,
                      'net'
                    )}
                    style={{ color: pointsSummary.net >= 0 ? '#FF9F43' : '#FF6B6B' }}
                  >
                    {pointsSummary.net >= 0 ? '+' : ''}
                    {pointsSummary.net}
                  </View>
                  <View className={styles.pointsSummaryLabel}>净增长</View>
                </View>
              </View>

              {memberPointRecords.length === 0 ? (
                <EmptyState icon="💳" title="暂无记录" desc="还没有积分变动记录哦" />
              ) : (
                memberPointRecords.map((record) => {
                  const conf = pointTypeConfig[record.type]
                  const isEarn = earnTypes.includes(record.type)
                  return (
                    <View key={record.id} className={styles.flowItem}>
                      <View
                        className={styles.flowIcon}
                        style={{ background: getRecordBgColor(record.type) }}
                      >
                        {getRecordIcon(record.type)}
                      </View>
                      <View className={styles.flowInfo}>
                        <View className={styles.flowDesc}>{record.description}</View>
                        <View className={styles.flowTime}>
                          {formatRelative(record.createdAt)}
                        </View>
                      </View>
                      <View
                        className={classnames(
                          styles.flowAmount,
                          isEarn ? 'earn' : 'deduct'
                        )}
                      >
                        {conf.prefix}
                        {record.amount}
                      </View>
                    </View>
                  )
                })
              )}
            </View>
          )}

          {activeTab === 'exchange' && (
            <View>
              {memberExchanges.length === 0 ? (
                <EmptyState icon="🛍️" title="暂无兑换" desc="快去商城兑换喜欢的礼物吧" />
              ) : (
                memberExchanges.map((exchange) => (
                  <View key={exchange.id} className={styles.exchangeItem}>
                    <View className={styles.exchangeImage}>
                      <Image src={exchange.rewardImage} mode="aspectFill" />
                    </View>
                    <View className={styles.exchangeInfo}>
                      <Text className={styles.exchangeName}>{exchange.rewardName}</Text>
                      <View className={styles.exchangeMeta}>
                        <Text>×{exchange.quantity}</Text>
                        <View
                          className={classnames(
                            styles.exchangeStatusBadge,
                            exchange.status
                          )}
                        >
                          {getExchangeStatusLabel(exchange.status)}
                        </View>
                        <Text>{formatRelative(exchange.createdAt)}</Text>
                      </View>
                    </View>
                    <View className={styles.exchangePoints}>
                      -{exchange.points}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'growth' && (
            <View>
              {memberGrowth.length === 0 ? (
                <EmptyState icon="🌱" title="暂无成长记录" desc="记录孩子的每一个成长瞬间吧" />
              ) : (
                memberGrowth.map((record) => (
                  <View key={record.id} className={styles.timelineItem}>
                    <View className={styles.timelineDot} />
                    <View className={styles.timelineContent}>
                      <View className={styles.timelineTime}>
                        {formatDate(record.createdAt, 'YYYY-MM-DD HH:mm')}
                      </View>
                      <View className={styles.timelineTitle}>
                        <Text>{record.title}</Text>
                        {record.milestone && (
                          <View className={styles.milestoneBadge}>🏆 里程碑</View>
                        )}
                      </View>
                      {record.description && (
                        <View className={styles.timelineDesc}>{record.description}</View>
                      )}
                      {record.photos.length > 0 && (
                        <View className={styles.timelinePhotos}>
                          {record.photos.slice(0, 3).map((photo, idx) => (
                            <View key={idx} className={styles.timelinePhoto}>
                              <Image src={photo} mode="aspectFill" />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default ChildProfilePage
