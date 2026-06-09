import React, { useMemo, useState } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { formatDate, formatDateTime } from '../../utils'
import EmptyState from '../../components/EmptyState'

const GrowthPage: React.FC = () => {
  const { growthRecords, familyMembers, currentMemberId, setCurrentMember, addGrowthRecord } =
    useAppStore()

  const childMembers = familyMembers.filter((m) => m.role === 'child')

  const memberRecords = useMemo(
    () =>
      growthRecords
        .filter((r) => r.memberId === currentMemberId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [growthRecords, currentMemberId]
  )

  const currentMember = familyMembers.find((m) => m.id === currentMemberId) || childMembers[0]

  const stats = useMemo(() => ({
    total: memberRecords.length,
    milestone: memberRecords.filter((r) => r.milestone).length,
    photos: memberRecords.reduce((s, r) => s + r.photos.length, 0)
  }), [memberRecords])

  const handleAddRecord = async () => {
    try {
      const res = await Taro.chooseImage({ count: 3 })
      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        addGrowthRecord({
          memberId: currentMemberId,
          title: '新的成长瞬间',
          description: '记录美好时光',
          photos: res.tempFilePaths,
          milestone: false
        })
        Taro.showToast({ title: '已添加记录', icon: 'success' })
      }
    } catch (e) {
      console.error('[Growth] chooseImage error', e)
    }
  }

  const goAlbum = () => Taro.navigateTo({ url: '/pages/album/index' })
  const goCalendar = () => Taro.navigateTo({ url: '/pages/calendar/index' })

  return (
    <ScrollView className="page-container" scrollY enableBackToTop>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>🌱 成长记录</Text>
        <View className={styles.headerSub}>记录每一个值得珍藏的瞬间</View>

        <View className={styles.memberBar}>
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
      </View>

      <View className={styles.statsRow}>
        <View className={styles.statBox}>
          <View className={styles.statNum}>{stats.total}</View>
          <View className={styles.statLabel}>条记录</View>
        </View>
        <View className={styles.statBox}>
          <View className={styles.statNum} style={{ color: '#FF9F43' }}>
            {stats.milestone}
          </View>
          <View className={styles.statLabel}>个里程碑</View>
        </View>
        <View className={styles.statBox}>
          <View className={styles.statNum} style={{ color: $color-primary }}>
            {stats.photos}
          </View>
          <View className={styles.statLabel}>张照片</View>
        </View>
      </View>

      <View className={styles.quickGrid}>
        <View className={styles.quickItem} onClick={handleAddRecord}>
          <View
            className={styles.quickIcon}
            style={{ background: 'linear-gradient(135deg, #FFE8ED, #FF6B8A)' }}
          >
            ✏️
          </View>
          <Text className={styles.quickLabel}>写记录</Text>
        </View>
        <View className={styles.quickItem} onClick={goAlbum}>
          <View
            className={styles.quickIcon}
            style={{ background: 'linear-gradient(135deg, #E8F4FF, #54A0FF)' }}
          >
            📸
          </View>
          <Text className={styles.quickLabel}>成长相册</Text>
        </View>
        <View className={styles.quickItem} onClick={goCalendar}>
          <View
            className={styles.quickIcon}
            style={{ background: 'linear-gradient(135deg, #FFE8CC, #FFD93D)' }}
          >
            📅
          </View>
          <Text className={styles.quickLabel}>亲子日历</Text>
        </View>
        <View className={styles.quickItem} onClick={() => Taro.showToast({ title: '测量记录开发中', icon: 'none' })}>
          <View
            className={styles.quickIcon}
            style={{ background: 'linear-gradient(135deg, #E5F8F2, #4ECDC4)' }}
          >
            📏
          </View>
          <Text className={styles.quickLabel}>身高体重</Text>
        </View>
      </View>

      <View className={styles.section}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>
            📖 {currentMember?.name}的成长故事
          </Text>
          <Text className={styles.sectionAction} onClick={handleAddRecord}>
            + 记录
          </Text>
        </View>

        {memberRecords.length === 0 ? (
          <EmptyState
            icon="🌱"
            title="暂无成长记录"
            desc="点击上方「写记录」开始记录美好瞬间吧"
          />
        ) : (
          <View className={styles.timeline}>
            {memberRecords.slice(0, 10).map((record) => (
              <View key={record.id} className={styles.timelineItem}>
                <View
                  className={classnames(
                    styles.timelineDot,
                    record.milestone && styles.milestone
                  )}
                />
                <View className={styles.timelineContent}>
                  <View className={styles.timelineHeader}>
                    <View style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Text className={styles.timelineTitle}>{record.title}</Text>
                      {record.milestone && (
                        <Text className={styles.milestoneTag}>
                          🏆 {record.milestoneType}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View className={styles.timelineTime}>
                    {formatDateTime(record.createdAt)}
                    {(record.height || record.weight) && (
                      <Text style={{ marginLeft: 16 }}>
                        {record.height && `身高${record.height}cm`}
                        {record.weight && `  体重${record.weight}kg`}
                      </Text>
                    )}
                  </View>
                  <View className={styles.timelineDesc}>{record.description}</View>
                  {record.photos.length > 0 && (
                    <View className={styles.photoRow}>
                      {record.photos.slice(0, 3).map((photo, i) => (
                        <View key={i} className={styles.photoItem}>
                          <Image
                            className={styles.photoPreview}
                            src={photo}
                            mode="aspectFill"
                          />
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  )
}

export default GrowthPage
