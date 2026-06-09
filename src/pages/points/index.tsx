import React, { useMemo, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { pointTypeConfig, formatRelative } from '../../utils'
import PointsChart from '../../components/Chart'
import EmptyState from '../../components/EmptyState'

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'earn', label: '赚取' },
  { key: 'bonus', label: '奖励' },
  { key: 'deduct', label: '扣除' }
]

const PointsPage: React.FC = () => {
  const {
    familyMembers,
    pointRecords,
    monthlyPoints,
    currentMemberId,
    setCurrentMember,
    adjustPoints
  } = useAppStore()

  const [typeFilter, setTypeFilter] = useState('all')

  const childMembers = familyMembers.filter((m) => m.role === 'child')
  const currentMember = familyMembers.find((m) => m.id === currentMemberId) || childMembers[0]

  const memberRecords = useMemo(
    () =>
      pointRecords.filter(
        (r) => r.memberId === currentMemberId && (typeFilter === 'all' || r.type === typeFilter)
      ),
    [pointRecords, currentMemberId, typeFilter]
  )

  const summary = useMemo(() => {
    const memberAllRecords = pointRecords.filter((r) => r.memberId === currentMemberId)
    return {
      earn: memberAllRecords.filter((r) => r.type === 'earn').reduce((s, r) => s + r.amount, 0),
      bonus: memberAllRecords.filter((r) => r.type === 'bonus').reduce((s, r) => s + r.amount, 0),
      reward: memberAllRecords.filter((r) => r.type === 'reward').reduce((s, r) => s + r.amount, 0),
      deduct: memberAllRecords.filter((r) => r.type === 'deduct').reduce((s, r) => s + r.amount, 0)
    }
  }, [pointRecords, currentMemberId])

  const handleAdjust = (type: 'reward' | 'deduct') => {
    Taro.showModal({
      title: type === 'reward' ? '发放临时奖励' : '扣除积分',
      editable: true,
      placeholderText: '请输入调整原因',
      success: (res) => {
        if (res.confirm && res.content) {
          const desc = res.content
          Taro.showModal({
            title: '请输入积分数量',
            editable: true,
            placeholderText: '请输入数字',
            success: (res2) => {
              if (res2.confirm && res2.content) {
                const amount = parseInt(res2.content, 10)
                if (!isNaN(amount) && amount > 0) {
                  adjustPoints(currentMemberId, amount, desc, type)
                  Taro.showToast({ title: '操作成功', icon: 'success' })
                }
              }
            }
          })
        }
      }
    })
  }

  const goDetail = () => {
    Taro.navigateTo({ url: '/pages/points-detail/index' })
  }

  return (
    <ScrollView className="page-container" scrollY enableBackToTop>
      <View className={styles.header}>
        <View className={styles.memberSwitch}>
          {childMembers.map((m) => (
            <View
              key={m.id}
              className={classnames(styles.memberChip, currentMemberId === m.id && styles.active)}
              onClick={() => setCurrentMember(m.id)}
            >
              <Image className={styles.chipAvatar} src={m.avatar} mode="aspectFill" />
              <Text>{m.name}</Text>
            </View>
          ))}
        </View>

        <View className={styles.pointsHeader}>
          <View className={styles.label}>💰 当前积分余额</View>
          <View className={styles.pointsValue}>
            <Text className={styles.pointsNum}>{currentMember?.points || 0}</Text>
            <Text className={styles.pointsUnit}>积分</Text>
          </View>
        </View>

        <View className={styles.quickStats}>
          <View className={styles.quickStat}>
            <Text className={styles.quickNum}>🔥 {currentMember?.streak || 0}</Text>
            <Text className={styles.quickLabel}>连续打卡</Text>
          </View>
          <View className={styles.quickDivider} />
          <View className={styles.quickStat}>
            <Text className={styles.quickNum}>{pointRecords.filter((r) => r.memberId === currentMemberId).length}</Text>
            <Text className={styles.quickLabel}>累计记录</Text>
          </View>
          <View className={styles.quickDivider} />
          <View className={styles.quickStat}>
            <Text className={styles.quickNum}>#{childMembers.findIndex((m) => m.id === currentMemberId) + 1}</Text>
            <Text className={styles.quickLabel}>排行榜</Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.card}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📈 积分趋势</Text>
          </View>
          <PointsChart data={monthlyPoints} />
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.card}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📊 收支统计</Text>
          </View>
          <View className={styles.summaryCards}>
            <View className={styles.summaryItem}>
              <View className={styles.summaryIcon}>✅</View>
              <View className={styles.summaryNum} style={{ color: '#00B894' }}>
                +{summary.earn}
              </View>
              <View className={styles.summaryLabel}>任务赚取</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryIcon}>🎁</View>
              <View className={styles.summaryNum} style={{ color: '#FFD93D' }}>
                +{summary.bonus}
              </View>
              <View className={styles.summaryLabel}>连续奖励</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryIcon}>⭐</View>
              <View className={styles.summaryNum} style={{ color: '#FF9F43' }}>
                +{summary.reward}
              </View>
              <View className={styles.summaryLabel}>临时奖励</View>
            </View>
            <View className={styles.summaryItem}>
              <View className={styles.summaryIcon}>⚠️</View>
              <View className={styles.summaryNum} style={{ color: '#FF6B6B' }}>
                -{summary.deduct}
              </View>
              <View className={styles.summaryLabel}>扣除积分</View>
            </View>
          </View>

          <View className={styles.actionBtns}>
            <View className={styles.actionBtn} onClick={() => handleAdjust('reward')}>
              <View
                className={styles.actionIcon}
                style={{ background: 'linear-gradient(135deg, #FFE8CC, #FFD93D)' }}
              >
                ⭐
              </View>
              <Text className={styles.actionLabel}>奖励</Text>
            </View>
            <View className={styles.actionBtn} onClick={() => handleAdjust('deduct')}>
              <View
                className={styles.actionIcon}
                style={{ background: 'linear-gradient(135deg, #FFE0E0, #FF6B6B)' }}
              >
                ⚠️
              </View>
              <Text className={styles.actionLabel}>扣除</Text>
            </View>
            <View
              className={styles.actionBtn}
              onClick={() => Taro.navigateTo({ url: '/pages/reward-approval/index' })}
            >
              <View
                className={styles.actionIcon}
                style={{ background: 'linear-gradient(135deg, #E8F4FF, #54A0FF)' }}
              >
                📋
              </View>
              <Text className={styles.actionLabel}>审批</Text>
            </View>
            <View className={styles.actionBtn} onClick={goDetail}>
              <View
                className={styles.actionIcon}
                style={{ background: 'linear-gradient(135deg, #E5F8F2, #00B894)' }}
              >
                📜
              </View>
              <Text className={styles.actionLabel}>明细</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.card}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>🕐 最近记录</Text>
            <Text className={styles.sectionAction} onClick={goDetail}>
              查看全部 →
            </Text>
          </View>

          <View className={styles.typeFilter}>
            {typeFilters.map((t) => (
              <View
                key={t.key}
                className={classnames(styles.typeBtn, typeFilter === t.key && styles.active)}
                onClick={() => setTypeFilter(t.key)}
              >
                {t.label}
              </View>
            ))}
          </View>

          {memberRecords.length === 0 ? (
            <EmptyState icon="💳" title="暂无记录" desc="还没有积分变动记录哦" />
          ) : (
            <View className={styles.recordsList}>
              {memberRecords.slice(0, 10).map((record) => {
                const conf = pointTypeConfig[record.type]
                const bgColor =
                  record.type === 'deduct'
                    ? 'rgba(255, 107, 107, 0.12)'
                    : record.type === 'bonus'
                    ? 'rgba(255, 217, 61, 0.18)'
                    : record.type === 'reward'
                    ? 'rgba(255, 159, 67, 0.15)'
                    : 'rgba(0, 184, 148, 0.12)'
                const iconMap: Record<string, string> = {
                  earn: '✅',
                  bonus: '🎁',
                  reward: '⭐',
                  deduct: '⚠️'
                }
                return (
                  <View key={record.id} className={styles.recordItem}>
                    <View className={styles.recordIcon} style={{ background: bgColor }}>
                      {iconMap[record.type]}
                    </View>
                    <View className={styles.recordInfo}>
                      <View className={styles.recordTitle}>{record.description}</View>
                      <View className={styles.recordTime}>
                        {conf.label} · {formatRelative(record.createdAt)}
                      </View>
                    </View>
                    <View
                      className={styles.recordAmount}
                      style={{ color: conf.color }}
                    >
                      {conf.prefix}
                      {record.amount}
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

export default PointsPage
