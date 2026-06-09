import React, { useState, useMemo } from 'react'
import { View, Text, Image, Button, Input, Textarea } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { formatDate } from '../../utils'
import MemberAvatar from '../../components/MemberAvatar'

const rankEmojis = ['🥇', '🥈', '🥉']

const colorPool = [
  '#54A0FF',
  '#FF6B8A',
  '#4ECDC4',
  '#FFD93D',
  '#FF9F43',
  '#A29BFE',
  '#00B894',
  '#E17055'
]

const FamilyPage: React.FC = () => {
  const {
    familyMembers,
    tasks,
    pointRecords,
    exchangeRecords,
    adjustPoints,
    setCurrentMember,
    currentRole,
    switchRole,
    addFamilyMember
  } = useAppStore()

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustMember, setAdjustMember] = useState<string | null>(null)
  const [adjustMode, setAdjustMode] = useState<'plus' | 'minus'>('plus')
  const [adjustAmount, setAdjustAmount] = useState(10)
  const [adjustType, setAdjustType] = useState<'earn' | 'reward' | 'deduct'>('earn')
  const [adjustDesc, setAdjustDesc] = useState('')

  const [showAddModal, setShowAddModal] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberAvatar, setNewMemberAvatar] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<'parent' | 'child'>('child')

  const parentMembers = useMemo(
    () => familyMembers.filter((m) => m.role === 'parent'),
    [familyMembers]
  )

  const childMembers = useMemo(() => {
    return [...familyMembers]
      .filter((m) => m.role === 'child')
      .sort((a, b) => b.points - a.points)
  }, [familyMembers])

  const totalPoints = useMemo(
    () => childMembers.reduce((sum, m) => sum + m.points, 0),
    [childMembers]
  )

  const doneTasksCount = useMemo(
    () => tasks.filter((t) => t.status === 'done').length,
    [tasks]
  )

  const maxChildPoints = useMemo(
    () => (childMembers.length > 0 ? childMembers[0].points : 0),
    [childMembers]
  )

  const pendingReviewCount = useMemo(() => {
    let count = 0
    tasks.forEach((t: any) => {
      const perMember = t.perMemberStatus || {}
      Object.values(perMember).forEach((s: any) => {
        if (s.status === 'checking') count++
      })
    })
    count += exchangeRecords.filter((r) => r.status === 'pending').length
    return count
  }, [tasks, exchangeRecords])

  const goReviewCenter = () => {
    Taro.navigateTo({ url: '/pages/review-center/index' })
  }

  const currentMonthPoints = useMemo(() => {
    const currentMonth = formatDate(new Date(), 'YYYY-MM')
    const earnTypes = ['earn', 'bonus', 'reward']
    const map: Record<string, number> = {}
    pointRecords
      .filter((r) => {
        if (!earnTypes.includes(r.type)) return false
        const recordMonth = formatDate(r.createdAt, 'YYYY-MM')
        return recordMonth === currentMonth
      })
      .forEach((r) => {
        map[r.memberId] = (map[r.memberId] || 0) + r.amount
      })
    return map
  }, [pointRecords])

  const getRoleTag = (name: string) => {
    if (name.includes('爸') || name.includes('父')) return 'dad'
    if (name.includes('妈') || name.includes('母')) return 'mom'
    return 'dad'
  }

  const getRoleLabel = (name: string) => {
    if (name.includes('爸') || name.includes('父')) return '爸爸'
    if (name.includes('妈') || name.includes('母')) return '妈妈'
    return '家长'
  }

  const openAdjustModal = (memberId: string, mode: 'plus' | 'minus') => {
    setAdjustMember(memberId)
    setAdjustMode(mode)
    setAdjustAmount(10)
    setAdjustType(mode === 'plus' ? 'earn' : 'deduct')
    setAdjustDesc('')
    setShowAdjustModal(true)
  }

  const closeAdjustModal = () => {
    setShowAdjustModal(false)
    setAdjustMember(null)
  }

  const handleAdjustConfirm = () => {
    if (!adjustMember) return
    if (adjustAmount <= 0) {
      Taro.showToast({ title: '请输入有效积分', icon: 'none' })
      return
    }
    if (!adjustDesc.trim()) {
      Taro.showToast({ title: '请填写描述', icon: 'none' })
      return
    }

    const actualType = adjustMode === 'minus' ? 'deduct' : adjustType
    adjustPoints(adjustMember, adjustAmount, adjustDesc.trim(), actualType)

    Taro.showToast({
      title: adjustMode === 'minus' ? '扣除成功' : '发放成功',
      icon: 'success'
    })
    closeAdjustModal()
  }

  const handleStepperChange = (delta: number) => {
    setAdjustAmount((prev) => Math.max(1, Math.min(999, prev + delta)))
  }

  const goDetail = (memberId: string) => {
    setCurrentMember(memberId)
    Taro.navigateTo({ url: '/pages/points-detail/index' })
  }

  const goChildProfile = (memberId: string) => {
    Taro.navigateTo({ url: `/pages/child-profile/index?memberId=${memberId}` })
  }

  const openAddModal = () => {
    setNewMemberName('')
    setNewMemberAvatar('')
    setNewMemberRole('child')
    setShowAddModal(true)
  }

  const closeAddModal = () => {
    setShowAddModal(false)
  }

  const handleAvatarUpload = async () => {
    try {
      const res = await Taro.chooseImage({ count: 1 })
      if (res.tempFilePaths && res.tempFilePaths[0]) {
        setNewMemberAvatar(res.tempFilePaths[0])
      }
    } catch (e) {
      console.error('[Family] chooseImage error', e)
    }
  }

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      Taro.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    let finalAvatar = newMemberAvatar
    if (!finalAvatar) {
      const idPool = [1, 12, 34, 56, 78, 91, 202, 311, 421, 532, 645, 823, 903, 999]
      const randomId = idPool[Math.floor(Math.random() * idPool.length)]
      finalAvatar = `https://picsum.photos/id/${randomId}/200/200`
    }
    const idx = Math.max(0, familyMembers.length % colorPool.length)
    const color = colorPool[idx]

    addFamilyMember({
      name: newMemberName.trim(),
      avatar: finalAvatar,
      role: newMemberRole,
      color
    })

    Taro.showToast({
      title: '添加成功',
      icon: 'success'
    })
    closeAddModal()
  }

  const adjustMemberData = familyMembers.find((m) => m.id === adjustMember)

  return (
    <View className="page-container">
      <View className={styles.familyHeader}>
        <View className={styles.familyName}>🏡 幸福的一家</View>
        <View className={styles.familySubtitle}>
          共{familyMembers.length}位成员 · {currentRole === 'parent' ? '家长模式' : '孩子模式'}
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <View className={styles.statValue}>{familyMembers.length}</View>
            <View className={styles.statLabel}>成员数</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statValue}>{totalPoints}</View>
            <View className={styles.statLabel}>总积分</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statValue}>{doneTasksCount}</View>
            <View className={styles.statLabel}>完成任务</View>
          </View>
          <View className={styles.statItem}>
            <View className={styles.statValue}>{childMembers.length}</View>
            <View className={styles.statLabel}>孩子数</View>
          </View>
        </View>
      </View>

      {currentRole === 'parent' && (
        <View className={styles.reviewCenterEntry} onClick={goReviewCenter}>
          <View className={styles.reviewCenterLeft}>
            <Text className={styles.reviewCenterIcon}>📋</Text>
            <View className={styles.reviewCenterTexts}>
              <View className={styles.reviewCenterTitle}>家长审核中心</View>
              <View className={styles.reviewCenterSub}>
                {pendingReviewCount > 0
                  ? `${pendingReviewCount}项待处理`
                  : '暂无待处理事项'}
              </View>
            </View>
          </View>
          <Text className={styles.reviewCenterArrow}>›</Text>
        </View>
      )}

      <View className={styles.sectionTitle}>👨‍👩‍👧 家长</View>

      {parentMembers.map((member) => (
        <View key={member.id} className={styles.parentCard}>
          <MemberAvatar member={member} size="lg" />
          <View className={styles.parentInfo}>
            <View className={styles.parentName}>
              {member.name}
              <Text className={classnames(styles.roleTag, styles[getRoleTag(member.name)])}>
                {getRoleLabel(member.name)}
              </Text>
            </View>
            <Text className={styles.parentSub}>
              管理员 · 可发布任务、审核、管理成员
            </Text>
          </View>
          <Button className={styles.manageBtn} onClick={switchRole}>
            切换
          </Button>
        </View>
      ))}

      <View className={styles.sectionTitle}>孩子们 🏆</View>

      {childMembers.map((member, index) => {
        const progress = maxChildPoints > 0 ? (member.points / maxChildPoints) * 100 : 0
        const monthPoints = currentMonthPoints[member.id] || 0
        return (
          <View key={member.id} className={styles.childCard}>
            <View className={styles.rankBadge}>
              {index < 3 ? rankEmojis[index] : `#${index + 1}`}
            </View>
            <MemberAvatar member={member} size="lg" />
            <View className={styles.childContent} style={{ marginLeft: '16rpx' }}>
              <View className={styles.childTop}>
                <View className={styles.childNameRow}>
                  <Text className={styles.childName}>{member.name}</Text>
                  <View className={styles.streakTag}>🔥{member.streak}天</View>
                </View>
                <View className={styles.pointsBig}>
                  <Text className={styles.pointsNum}>{member.points}</Text>
                  <Text className={styles.pointsUnit}>分</Text>
                </View>
              </View>
              <View className={styles.pointsSub}>本月获得 +{monthPoints} 积分</View>
              <View className={styles.pointsBar}>
                <View
                  className={styles.pointsBarFill}
                  style={{ width: `${Math.max(4, progress)}%` }}
                />
              </View>
              <View className={styles.actionBtns}>
                <Button
                  className={classnames(styles.actionBtn, styles.plus)}
                  onClick={() => openAdjustModal(member.id, 'plus')}
                >
                  + 积分
                </Button>
                <Button
                  className={classnames(styles.actionBtn, styles.minus)}
                  onClick={() => openAdjustModal(member.id, 'minus')}
                >
                  - 积分
                </Button>
                <Button
                  className={classnames(styles.actionBtn, styles.detail)}
                  onClick={() => goChildProfile(member.id)}
                >
                  📁 成长档案
                </Button>
              </View>
            </View>
          </View>
        )
      })}

      {showAdjustModal && adjustMemberData && (
        <View className={styles.adjustModal} onClick={closeAdjustModal}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>
              {adjustMode === 'plus' ? '发放积分' : '扣除积分'}
            </View>

            <View className={styles.modalMember}>
              <MemberAvatar member={adjustMemberData} size="md" />
              <Text className={styles.modalMemberName}>{adjustMemberData.name}</Text>
            </View>

            <View className={styles.modalLabel}>积分数量</View>
            <View className={styles.pointStepper}>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepperChange(-10)}
              >
                -
              </Button>
              <Text className={styles.stepperValue}>{adjustAmount}</Text>
              <Button
                className={styles.stepperBtn}
                onClick={() => handleStepperChange(10)}
              >
                +
              </Button>
            </View>

            <View className={styles.modalLabel}>调整类型</View>
            <View className={styles.pointTypeTabs}>
              {adjustMode === 'plus' ? (
                <>
                  <Button
                    className={classnames(
                      styles.typeTab,
                      styles.earn,
                      adjustType === 'earn' && styles.active
                    )}
                    onClick={() => setAdjustType('earn')}
                  >
                    获得
                  </Button>
                  <Button
                    className={classnames(
                      styles.typeTab,
                      styles.reward,
                      adjustType === 'reward' && styles.active
                    )}
                    onClick={() => setAdjustType('reward')}
                  >
                    奖励
                  </Button>
                </>
              ) : (
                <Button
                  className={classnames(
                    styles.typeTab,
                    styles.deduct,
                    adjustType === 'deduct' && styles.active
                  )}
                  onClick={() => setAdjustType('deduct')}
                >
                  扣除
                </Button>
              )}
            </View>

            <View className={styles.modalLabel}>描述说明</View>
            <View className={styles.descInput}>
              <Textarea
                placeholder="请输入调整原因..."
                value={adjustDesc}
                onInput={(e) => setAdjustDesc(e.detail.value)}
                maxlength={100}
              />
            </View>

            <View className={styles.modalActions}>
              <Button className={classnames(styles.modalBtn, styles.cancel)} onClick={closeAdjustModal}>
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirm)}
                onClick={handleAdjustConfirm}
              >
                确认{adjustMode === 'plus' ? '发放' : '扣除'}
              </Button>
            </View>
          </View>
        </View>
      )}

      {currentRole === 'parent' && (
        <View className={styles.fabBtn} onClick={openAddModal}>
          <Text className={styles.fabIcon}>+</Text>
        </View>
      )}

      {showAddModal && (
        <View className={styles.addModal} onClick={closeAddModal}>
          <View className={styles.addContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.addHeader}>
              <Text className={styles.addTitle}>添加家庭成员</Text>
              <Text className={styles.addClose} onClick={closeAddModal}>
                ×
              </Text>
            </View>

            <View className={styles.avatarUpload} onClick={handleAvatarUpload}>
              <View className={styles.avatarPreview}>
                {newMemberAvatar ? (
                  <Image className={styles.avatarImage} src={newMemberAvatar} mode="aspectFill" />
                ) : (
                  <Text className={styles.avatarPlaceholder}>📷</Text>
                )}
              </View>
              <Text className={styles.avatarText}>点击上传头像</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>姓名</Text>
              <View className={styles.formInput}>
                <Input
                  placeholder="请输入姓名"
                  value={newMemberName}
                  onInput={(e) => setNewMemberName(e.detail.value)}
                  maxlength={10}
                />
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>角色</Text>
              <View className={styles.roleSelector}>
                <View
                  className={classnames(
                    styles.roleOption,
                    newMemberRole === 'parent' && styles.active
                  )}
                  onClick={() => setNewMemberRole('parent')}
                >
                  <Text className={styles.roleIcon}>👨‍👩‍👧</Text>
                  <Text className={styles.roleText}>家长</Text>
                  <Text className={styles.roleHint}>管理权限</Text>
                </View>
                <View
                  className={classnames(
                    styles.roleOption,
                    newMemberRole === 'child' && styles.active
                  )}
                  onClick={() => setNewMemberRole('child')}
                >
                  <Text className={styles.roleIcon}>👶</Text>
                  <Text className={styles.roleText}>孩子</Text>
                  <Text className={styles.roleHint}>做任务赚积分</Text>
                </View>
              </View>
            </View>

            <View className={styles.modalActions}>
              <Button className={classnames(styles.modalBtn, styles.cancel)} onClick={closeAddModal}>
                取消
              </Button>
              <Button
                className={classnames(styles.modalBtn, styles.confirm)}
                onClick={handleAddMember}
              >
                确认添加
              </Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}

export default FamilyPage
