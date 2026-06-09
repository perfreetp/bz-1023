import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { pointTypeConfig, formatDate, formatRelative } from '../../utils'
import PointsChart from '../../components/Chart'
import EmptyState from '../../components/EmptyState'

const typeFilters = [
  { key: 'all', label: '全部' },
  { key: 'earn', label: '获得' },
  { key: 'deduct', label: '消费' }
]

const earnTypes = ['earn', 'bonus', 'reward']
const deductTypes = ['deduct']

const PointsDetailPage: React.FC = () => {
  const router = useRouter()
  const routeMemberId = router.params.memberId

  const {
    familyMembers,
    pointRecords,
    monthlyPoints,
    setCurrentMember
  } = useAppStore()

  const childMembers = familyMembers.filter((m) => m.role === 'child')
  const initialMemberId = routeMemberId || childMembers[0]?.id
  const [selectedMemberId, setSelectedMemberId] = useState(initialMemberId)

  const [typeFilter, setTypeFilter] = useState('all')

  const handleMemberSwitch = (memberId: string) => {
    setSelectedMemberId(memberId)
    setCurrentMember(memberId)
  }

  const currentMember = familyMembers.find((m) => m.id === selectedMemberId) || childMembers[0]

  const monthlyStats = useMemo(() => {
    const now = new Date()
    const currentMonth = formatDate(now, 'YYYY-MM')
    const monthRecords = pointRecords.filter((r) => {
      if (r.memberId !== selectedMemberId) return false
      const recordMonth = formatDate(r.createdAt, 'YYYY-MM')
      return recordMonth === currentMonth
    })

    const earned = monthRecords
      .filter((r) => earnTypes.includes(r.type))
      .reduce((s, r) => s + r.amount, 0)
    const consumed = monthRecords
      .filter((r) => deductTypes.includes(r.type))
      .reduce((s, r) => s + r.amount, 0)

    return {
      earned,
      consumed,
      net: earned - consumed
    }
  }, [pointRecords, selectedMemberId])

  const filteredRecords = useMemo(() => {
    const memberRecords = pointRecords.filter((r) => r.memberId === selectedMemberId)
    let records = memberRecords

    if (typeFilter === 'earn') {
      records = records.filter((r) => earnTypes.includes(r.type))
    } else if (typeFilter === 'deduct') {
      records = records.filter((r) => deductTypes.includes(r.type))
    }

    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [pointRecords, selectedMemberId, typeFilter])

  const getRecordIcon = (type: string) => {
    const iconMap: Record<string, string> = {
      earn: '✅',
      bonus: '🎁',
      reward: '⭐',
      deduct: '⚠️'
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

  return (
    <ScrollView className="page-container" scrollY enableBackToTop>
      <View className={styles.memberTab}>
        {childMembers.map((m) => (
          <View
            key={m.id}
            className={classnames(styles.memberChip, selectedMemberId === m.id && styles.active)}
            onClick={() => handleMemberSwitch(m.id)}
          >
            <Image className={styles.chipAvatar} src={m.avatar} mode="aspectFill" />
            <Text className={styles.chipName}>{m.name}</Text>
            <Text className={styles.chipPoints}>{m.points}</Text>
          </View>
        ))}
      </View>

      <View className={styles.section}>
        <View className={styles.chartCard}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📈 月度积分趋势</Text>
          </View>
          <PointsChart data={monthlyPoints} />
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <View className={styles.statIcon}>📥</View>
            <View className={styles.statNum} style={{ color: '#00B894' }}>
              +{monthlyStats.earned}
            </View>
            <View className={styles.statLabel}>本月获得</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statIcon}>📤</View>
            <View className={styles.statNum} style={{ color: '#FF6B6B' }}>
              -{monthlyStats.consumed}
            </View>
            <View className={styles.statLabel}>本月消费</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statIcon}>📊</View>
            <View
              className={styles.statNum}
              style={{ color: monthlyStats.net >= 0 ? '#FF9F43' : '#FF6B6B' }}
            >
              {monthlyStats.net >= 0 ? '+' : ''}
              {monthlyStats.net}
            </View>
            <View className={styles.statLabel}>净增长</View>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.recordList}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>📜 积分流水</Text>
          </View>

          <ScrollView className={styles.filterTabs} scrollX enableFlex showScrollbar={false}>
            {typeFilters.map((t) => (
              <View
                key={t.key}
                className={classnames(styles.filterTab, typeFilter === t.key && styles.active)}
                onClick={() => setTypeFilter(t.key)}
              >
                {t.label}
              </View>
            ))}
          </ScrollView>

          {filteredRecords.length === 0 ? (
            <EmptyState icon="💳" title="暂无记录" desc="还没有积分变动记录哦" />
          ) : (
            <View>
              {filteredRecords.map((record) => {
                const conf = pointTypeConfig[record.type]
                const isEarn = earnTypes.includes(record.type)
                return (
                  <View key={record.id} className={styles.recordItem}>
                    <View
                      className={styles.recordIcon}
                      style={{ background: getRecordBgColor(record.type) }}
                    >
                      {getRecordIcon(record.type)}
                    </View>
                    <View className={styles.recordInfo}>
                      <View className={styles.recordDesc}>{record.description}</View>
                      <View className={styles.recordMeta}>
                        <View className={styles.recordTypeTag}>{conf.label}</View>
                        <Text className={styles.recordTime}>{formatRelative(record.createdAt)}</Text>
                      </View>
                    </View>
                    <View
                      className={styles.recordAmount}
                      style={{ color: isEarn ? '#00B894' : '#FF6B6B' }}
                    >
                      {isEarn ? '+' : '-'}
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

export default PointsDetailPage
