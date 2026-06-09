import React, { useState } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'

const RewardDetailPage: React.FC = () => {
  const router = useRouter()
  const rewardId = router.params.rewardId || router.params.id || ''

  const {
    rewards,
    familyMembers,
    currentMemberId,
    createExchange,
    currentRole
  } = useAppStore()

  const [quantity, setQuantity] = useState(1)
  const [showModal, setShowModal] = useState(false)

  const reward = rewards.find((r) => r.id === rewardId)

  const currentMember =
    familyMembers.find((m) => m.id === currentMemberId) ||
    familyMembers.find((m) => m.role === 'child')

  const totalPoints = reward ? reward.price * quantity : 0
  const canExchange =
    reward &&
    reward.status === 'online' &&
    reward.stock > 0 &&
    currentMember &&
    currentMember.points >= totalPoints

  const stockStatus = reward
    ? reward.stock === 0
      ? 'danger'
      : reward.stock <= 5
      ? 'warning'
      : 'normal'
    : 'normal'

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  const handleIncrease = () => {
    if (reward && quantity < reward.stock) {
      setQuantity(quantity + 1)
    }
  }

  const handleExchangeClick = () => {
    if (currentRole === 'parent') {
      Taro.showToast({ title: '请切换到孩子视角', icon: 'none' })
      return
    }
    if (!reward || reward.status !== 'online') {
      Taro.showToast({ title: '奖励已下架', icon: 'none' })
      return
    }
    if (reward.stock < quantity) {
      Taro.showToast({ title: '库存不足', icon: 'none' })
      return
    }
    if (!currentMember || currentMember.points < totalPoints) {
      Taro.showToast({ title: '积分不足', icon: 'none' })
      return
    }
    setShowModal(true)
  }

  const handleConfirmExchange = () => {
    if (!reward || !currentMember) return

    const ok = createExchange(reward.id, currentMemberId, quantity)
    setShowModal(false)

    if (ok) {
      Taro.showToast({
        title: reward.needApproval ? '已提交审批' : '兑换成功',
        icon: 'success',
        duration: 1500
      })
      setTimeout(() => {
        Taro.navigateBack()
      }, 1500)
    } else {
      Taro.showToast({ title: '兑换失败', icon: 'none' })
    }
  }

  const handleEdit = () => {
    Taro.showToast({ title: '编辑功能开发中', icon: 'none' })
  }

  const handleOffline = () => {
    Taro.showModal({
      title: '确认下架',
      content: `确定要下架「${reward?.name}」吗？`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已下架', icon: 'success' })
        }
      }
    })
  }

  if (!reward) {
    return (
      <View className={styles.page}>
        <View style={{ padding: '120rpx 32rpx', textAlign: 'center' }}>
          <Text style={{ fontSize: '28rpx', color: '#999' }}>奖励不存在或已删除</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.rewardImage}>
        <Image
          src={reward.image}
          mode="aspectFill"
          style={{ width: '100%', height: '100%' }}
        />
        {reward.status === 'soldout' && (
          <View className={styles.soldoutMask}>已售罄</View>
        )}
      </View>

      <View className={styles.infoSection}>
        <View className={styles.headerRow}>
          <Text className={styles.rewardName}>{reward.name}</Text>
          <View className={styles.categoryTag}>{reward.category}</View>
        </View>

        <View className={styles.priceSection}>
          <Text className={styles.priceValue}>{reward.price}</Text>
          <Text className={styles.priceUnit}>积分</Text>
          {reward.originalPrice && (
            <Text className={styles.originalPrice}>¥{reward.originalPrice}</Text>
          )}
        </View>

        <View className={styles.metaRow}>
          <View
            className={classnames(
              styles.stockBadge,
              stockStatus === 'warning' && styles.warning,
              stockStatus === 'danger' && styles.danger
            )}
          >
            {reward.stock > 99 ? '库存充足' : `剩余 ${reward.stock} 件`}
          </View>
          <Text className={styles.soldBadge}>已售 {reward.sold} 件</Text>
          {reward.needApproval && (
            <View className={styles.approvalBadge}>需家长审批</View>
          )}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>奖励描述</Text>
        <Text className={styles.description}>{reward.description}</Text>
      </View>

      <View className={styles.stepperSection}>
        <Text className={styles.stepperLabel}>兑换数量</Text>
        <View className={styles.stepper}>
          <View
            className={classnames(styles.stepperBtn, quantity <= 1 && styles.disabled)}
            onClick={handleDecrease}
          >
            −
          </View>
          <View className={styles.stepperValue}>{quantity}</View>
          <View
            className={classnames(
              styles.stepperBtn,
              (!reward || quantity >= reward.stock) && styles.disabled
            )}
            onClick={handleIncrease}
          >
            +
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        {currentRole === 'child' ? (
          <>
            <View className={styles.pointsInfo}>
              <View className={styles.pointsCurrent}>
                <Text className={styles.pointsCurrentLabel}>当前积分</Text>
                <Text className={styles.pointsCurrentValue}>
                  {currentMember?.points || 0}
                </Text>
                <Text className={styles.pointsCurrentUnit}>分</Text>
              </View>
              <Text
                className={classnames(
                  styles.pointsNeeded,
                  (!currentMember || currentMember.points < totalPoints) &&
                    styles.pointsInsufficient
                )}
              >
                兑换需 {totalPoints} 积分
                {currentMember && currentMember.points < totalPoints && (
                  <>（还差 {totalPoints - currentMember.points} 分）</>
                )}
              </Text>
            </View>
            <Button
              className={classnames(
                styles.exchangeBtn,
                !canExchange && styles.disabled
              )}
              onClick={handleExchangeClick}
            >
              立即兑换
            </Button>
          </>
        ) : (
          <View className={styles.parentActions}>
            <Button className={classnames(styles.actionBtn, styles.edit)} onClick={handleEdit}>
              编辑
            </Button>
            <Button
              className={classnames(styles.actionBtn, styles.offline)}
              onClick={handleOffline}
            >
              下架
            </Button>
          </View>
        )}
      </View>

      {showModal && (
        <View className={styles.modalMask} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>确认兑换</Text>
              <Text className={styles.modalSubtitle}>{reward.name}</Text>
            </View>

            <View className={styles.modalBody}>
              <View className={styles.pointsDeduct}>
                <Text className={styles.deductLabel}>将扣除积分</Text>
                <View className={styles.deductValue}>
                  <Text className={styles.deductNum}>{totalPoints}</Text>
                  <Text className={styles.deductUnit}>积分</Text>
                </View>
                <Text className={styles.deductRemain}>
                  兑换后剩余 {(currentMember?.points || 0) - totalPoints} 积分
                </Text>
              </View>

              <View className={styles.quantityRow}>
                <Text className={styles.quantityLabel}>兑换数量</Text>
                <Text className={styles.quantityValue}>× {quantity}</Text>
              </View>

              <View className={styles.quantityRow}>
                <Text className={styles.quantityLabel}>单件积分</Text>
                <Text className={styles.quantityValue}>{reward.price} 积分</Text>
              </View>

              {reward.needApproval && (
                <View className={styles.approvalTip}>
                  <Text className={styles.approvalTipIcon}>💡</Text>
                  <Text className={styles.approvalTipText}>
                    该奖励需要家长审批，提交后请耐心等待家长确认。
                  </Text>
                </View>
              )}
            </View>

            <View className={styles.modalFooter}>
              <Button
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={() => setShowModal(false)}
              >
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirm)}
                onClick={handleConfirmExchange}
              >
                确认兑换
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default RewardDetailPage
