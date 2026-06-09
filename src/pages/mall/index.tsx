import React, { useMemo, useState } from 'react'
import { View, Text, Image, ScrollView, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import EmptyState from '../../components/EmptyState'

const categories = [
  { key: 'all', label: '全部' },
  { key: '玩具', label: '🎮 玩具' },
  { key: '图书', label: '📚 图书' },
  { key: '美食', label: '🍰 美食' },
  { key: '体验', label: '🎡 体验' },
  { key: '文具', label: '✏️ 文具' },
  { key: '特权', label: '🎯 特权' },
  { key: '服饰', label: '👟 服饰' }
]

const MallPage: React.FC = () => {
  const {
    rewards,
    familyMembers,
    currentMemberId,
    createExchange,
    exchangeRecords,
    currentRole
  } = useAppStore()

  const [category, setCategory] = useState('all')

  const currentMember =
    familyMembers.find((m) => m.id === currentMemberId) ||
    familyMembers.find((m) => m.role === 'child')

  const filteredRewards = useMemo(() => {
    let list = rewards.filter((r) => r.status !== 'offline')
    if (category !== 'all') {
      list = list.filter((r) => r.category === category)
    }
    return list
  }, [rewards, category])

  const pendingCount = useMemo(
    () => exchangeRecords.filter((e) => e.status === 'pending').length,
    [exchangeRecords]
  )

  const handleExchange = (rewardId: string, reward: typeof rewards[0]) => {
    if (currentRole === 'parent') {
      Taro.showToast({ title: '请切换到孩子视角', icon: 'none' })
      return
    }
    if (!currentMember || currentMember.points < reward.price) {
      Taro.showToast({ title: '积分不足', icon: 'none' })
      return
    }
    if (reward.stock <= 0) {
      Taro.showToast({ title: '库存不足', icon: 'none' })
      return
    }

    Taro.showModal({
      title: '确认兑换',
      content: `确定使用 ${reward.price} 积分兑换「${reward.name}」吗？${reward.needApproval ? '\n（兑换后需家长审批）' : ''}`,
      success: (res) => {
        if (res.confirm) {
          const ok = createExchange(rewardId, currentMemberId)
          if (ok) {
            Taro.showToast({
              title: reward.needApproval ? '已提交审批' : '兑换成功',
              icon: 'success'
            })
          } else {
            Taro.showToast({ title: '兑换失败', icon: 'none' })
          }
        }
      }
    })
  }

  const goDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/reward-detail/index?rewardId=${id}` })
  }

  return (
    <ScrollView className="page-container" scrollY enableBackToTop>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>🎁 奖励商城</Text>
        <View className={styles.headerSub}>用努力赚取的积分，兑换喜欢的奖励吧！</View>

        <View className={styles.pointsBar}>
          <Text className={styles.pointsLabel}>
            {currentMember?.name} 的积分
          </Text>
          <View className={styles.pointsValue}>
            <Text className={styles.pointsNum}>{currentMember?.points || 0}</Text>
            <Text className={styles.pointsUnit}>积分</Text>
          </View>
        </View>
      </View>

      <View className={styles.categoryTabs}>
        {categories.map((c) => (
          <View
            key={c.key}
            className={classnames(styles.categoryTab, category === c.key && styles.active)}
            onClick={() => setCategory(c.key)}
          >
            {c.label}
          </View>
        ))}
      </View>

      <View className={styles.quickBar}>
        <View
          className={styles.quickItem}
          onClick={() => Taro.navigateTo({ url: '/pages/reward-approval/index' })}
        >
          <View
            className={styles.quickIcon}
            style={{ background: 'linear-gradient(135deg, #E8F4FF, #54A0FF)' }}
          >
            📋
          </View>
          <View className={styles.quickText}>
            <Text className={styles.quickTitle}>兑换审批</Text>
            <Text className={styles.quickSub}>
              {pendingCount > 0 ? `${pendingCount} 个待处理` : '暂无待处理'}
            </Text>
          </View>
        </View>
        <View
          className={styles.quickItem}
          onClick={() =>
            Taro.showToast({ title: '我的订单开发中', icon: 'none' })
          }
        >
          <View
            className={styles.quickIcon}
            style={{ background: 'linear-gradient(135deg, #E5F8F2, #00B894)' }}
          >
            📦
          </View>
          <View className={styles.quickText}>
            <Text className={styles.quickTitle}>我的订单</Text>
            <Text className={styles.quickSub}>查看兑换记录</Text>
          </View>
        </View>
      </View>

      {filteredRewards.length === 0 ? (
        <EmptyState icon="🛒" title="暂无商品" desc="该分类还没有奖励哦" />
      ) : (
        <View className={styles.grid}>
          {filteredRewards.map((reward) => (
            <View
              key={reward.id}
              className={styles.rewardCard}
              onClick={() => goDetail(reward.id)}
            >
              <View className={styles.rewardImage}>
                <Image
                  src={reward.image}
                  mode="aspectFill"
                  style={{ width: '100%', height: '100%' }}
                />
                {reward.status === 'soldout' && (
                  <View className={styles.soldoutMask}>已售罄</View>
                )}
                {reward.needApproval && reward.status !== 'soldout' && (
                  <View className={styles.needApprovalBadge}>需审批</View>
                )}
              </View>
              <View className={styles.rewardBody}>
                <Text className={styles.rewardCat}>{reward.category}</Text>
                <View className={styles.rewardName}>{reward.name}</View>
                <View className={styles.rewardDesc}>{reward.description}</View>
                <View className={styles.rewardFooter}>
                  <View>
                    <View className={styles.priceWrap}>
                      <Text className={styles.price}>⭐{reward.price}</Text>
                      {reward.originalPrice && (
                        <Text className={styles.originalPrice}>{reward.originalPrice}</Text>
                      )}
                    </View>
                    <View className={styles.stockText}>
                      库存 {reward.stock > 99 ? '充足' : reward.stock}
                    </View>
                  </View>
                  <Button
                    className={classnames(
                      styles.buyBtn,
                      (reward.status === 'soldout' ||
                        (currentMember && currentMember.points < reward.price)) &&
                        styles.disabled
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleExchange(reward.id, reward)
                    }}
                  >
                    兑换
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  )
}

export default MallPage
