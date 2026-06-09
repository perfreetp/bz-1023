import React, { useMemo } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { formatDateTime } from '../../utils'

const MinePage: React.FC = () => {
  const {
    familyMembers,
    currentMemberId,
    setCurrentMember,
    currentRole,
    switchRole,
    exchangeRecords,
    tasks
  } = useAppStore()

  const currentMember =
    familyMembers.find((m) => m.id === currentMemberId) || familyMembers[0]

  const pendingApprovals = useMemo(() => {
    return (
      exchangeRecords.filter((e) => e.status === 'pending').length +
      tasks.filter((t) => t.status === 'checking').length
    )
  }, [exchangeRecords, tasks])

  const childMembers = useMemo(
    () =>
      familyMembers
        .filter((m) => m.role === 'child')
        .sort((a, b) => b.points - a.points),
    [familyMembers]
  )

  const parentMembers = familyMembers.filter((m) => m.role === 'parent')

  const goPage = (url: string) => Taro.navigateTo({ url })

  const menuGroups = [
    {
      title: '家庭管理',
      items: [
        {
          key: 'family',
          icon: '👨‍👩‍👧‍👦',
          iconBg: 'linear-gradient(135deg, #E8F4FF, #54A0FF)',
          label: '家庭成员',
          desc: '管理家庭成员和分账设置',
          url: '/pages/family/index'
        },
        {
          key: 'rules',
          icon: '⚙️',
          iconBg: 'linear-gradient(135deg, #EDE7F6, #9575CD)',
          label: '规则设置',
          desc: '任务规则和积分规则',
          url: '/pages/rules/index',
          badge: 0
        }
      ]
    },
    {
      title: '互动功能',
      items: [
        {
          key: 'calendar',
          icon: '📅',
          iconBg: 'linear-gradient(135deg, #FFF3E0, #FFB74D)',
          label: '亲子日历',
          desc: '任务日历和提醒',
          url: '/pages/calendar/index',
          badge: 0
        },
        {
          key: 'promise',
          icon: '🤝',
          iconBg: 'linear-gradient(135deg, #FCE4EC, #F48FB1)',
          label: '亲子约定',
          desc: '保存和签署亲子约定',
          url: '/pages/promise/index',
          badge: 0
        },
        {
          key: 'album',
          icon: '📸',
          iconBg: 'linear-gradient(135deg, #E0F7FA, #4DD0E1)',
          label: '成长相册',
          desc: '全部照片和回忆',
          url: '/pages/album/index'
        }
      ]
    },
    {
      title: '审批与记录',
      items: [
        {
          key: 'approval',
          icon: '📋',
          iconBg: 'linear-gradient(135deg, #E8F5E9, #81C784)',
          label: '兑换审批',
          desc: '审核兑换申请',
          url: '/pages/reward-approval/index',
          badge: pendingApprovals
        },
        {
          key: 'points-detail',
          icon: '💰',
          iconBg: 'linear-gradient(135deg, #FFF8E1, #FFD54F)',
          label: '积分明细',
          desc: '全部积分流水记录',
          url: '/pages/points-detail/index'
        }
      ]
    }
  ]

  return (
    <ScrollView className="page-container" scrollY enableBackToTop>
      <View className={styles.profileHeader}>
        <View className={styles.profileCard}>
          <View className={styles.avatarWrap}>
            <Image className={styles.avatar} src={currentMember?.avatar} mode="aspectFill" />
            <View className={styles.roleTag}>
              {currentRole === 'parent' ? '家长' : '孩子'}
            </View>
          </View>
          <View className={styles.profileInfo}>
            <View className={styles.profileName}>
              {currentMember?.name}
              {currentMember?.role === 'child' && childMembers[0]?.id === currentMember?.id && (
                <View className={styles.rankBadge}>🏆 第1名</View>
              )}
            </View>
            <View className={styles.profileSub}>
              <Text onClick={switchRole} style={{ opacity: 1 }}>
                🔄 切换角色
              </Text>
              {currentMember?.role === 'child' && (
                <Text>
                  连续打卡 {currentMember.streak} 天
                </Text>
              )}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.familySection}>
        <View className={styles.familyHeader}>
          <Text className={styles.familyTitle}>👨‍👩‍👧‍👦 我的家庭</Text>
          <Text
            className={styles.familyManage}
            onClick={() => goPage('/pages/family/index')}
          >
            管理 →
          </Text>
        </View>

        <View className={styles.familyList}>
          {[...parentMembers, ...childMembers].map((m, index) => (
            <View
              key={m.id}
              className={styles.familyItem}
              onClick={() => m.role === 'child' && setCurrentMember(m.id)}
            >
              <Image className={styles.itemAvatar} src={m.avatar} mode="aspectFill" />
              <View className={styles.itemInfo}>
                <View className={styles.itemName}>
                  {m.name}
                  <View
                    className={classnames(
                      styles.itemRole,
                      m.role === 'parent' ? styles.itemRoleParent : styles.itemRoleChild
                    )}
                  >
                    {m.role === 'parent' ? '家长' : '孩子'}
                  </View>
                  {m.role === 'child' && childMembers.findIndex((c) => c.id === m.id) === 0 && (
                    <View
                      className={classnames(styles.itemRole)}
                      style={{ background: 'rgba(255, 217, 61, 0.2)', color: '#F9A825' }}
                    >
                      🏆 第一
                    </View>
                  )}
                </View>
                <View className={styles.itemStats}>
                  {m.role === 'child'
                    ? `连续${m.streak}天 · 排名第${childMembers.findIndex((c) => c.id === m.id) + 1}`
                    : `加入于 ${formatDateTime(m.avatar ? new Date() : new Date(), 'YYYY-MM-DD')}`}
                </View>
              </View>
              {m.role === 'child' && (
                <View className={styles.itemPoints}>
                  <Text className={styles.pointsNum}>⭐{m.points}</Text>
                  <Text className={styles.pointsLabel}>积分</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {menuGroups.map((group) => (
        <View key={group.title} className={styles.menuGroup}>
          <View className={styles.menuGroupTitle}>{group.title}</View>
          {group.items.map((item, idx) => (
            <React.Fragment key={item.key}>
              {idx > 0 && <View className={styles.divider} />}
              <View className={styles.menuItem} onClick={() => goPage(item.url)}>
                <View
                  className={styles.menuIcon}
                  style={{ background: item.iconBg }}
                >
                  {item.icon}
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuText}>{item.label}</Text>
                  <View style={{ display: 'flex', alignItems: 'center' }}>
                    {item.badge && item.badge > 0 && (
                      <View className={styles.menuBadge}>{item.badge}</View>
                    )}
                    <Text className={styles.menuArrow}>›</Text>
                  </View>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      ))}

      <View
        style={{
          textAlign: 'center',
          padding: '48rpx 0',
          fontSize: '22rpx',
          color: '#B2BEC3'
        }}
      >
        育儿积分宝 v1.0.0 · 陪伴孩子成长每一天 💝
      </View>
    </ScrollView>
  )
}

export default MinePage
