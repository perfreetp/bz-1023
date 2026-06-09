import React, { useState, useMemo } from 'react'
import { View, Text, Button, Input, Textarea, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { formatDate } from '../../utils'
import EmptyState from '../../components/EmptyState'

type FilterType = 'all' | 'active' | 'pending' | 'broken'

const filterTabs: { key: FilterType; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '进行中' },
  { key: 'pending', label: '待签署' },
  { key: 'broken', label: '已违约' }
]

const statusConfig: Record<string, { label: string }> = {
  active: { label: '进行中' },
  pending: { label: '待签署' },
  broken: { label: '已违约' }
}

const PromisePage: React.FC = () => {
  const {
    promises,
    familyMembers,
    currentMemberId,
    currentRole,
    addPromise,
    signPromise
  } = useAppStore()

  const [filter, setFilter] = useState<FilterType>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [selectedSignatories, setSelectedSignatories] = useState<string[]>([])

  const activeCount = useMemo(
    () => promises.filter((p) => p.status === 'active').length,
    [promises]
  )

  const pendingCount = useMemo(
    () => promises.filter((p) => p.status === 'pending').length,
    [promises]
  )

  const filteredPromises = useMemo(() => {
    if (filter === 'all') return promises
    return promises.filter((p) => p.status === filter)
  }, [promises, filter])

  const getMemberById = (id: string) => familyMembers.find((m) => m.id === id)

  const handleSign = (promiseId: string) => {
    signPromise(promiseId, currentMemberId)
    Taro.showToast({ title: '签署成功！', icon: 'success' })
  }

  const handleDelete = (promiseId: string) => {
    Taro.showModal({
      title: '确认删除',
      content: '确定要删除这个约定吗？删除后无法恢复。',
      confirmColor: '#FF6B6B',
      success: (res) => {
        if (res.confirm) {
          const store = useAppStore.getState()
          ;(useAppStore as any).setState({
            promises: store.promises.filter((p) => p.id !== promiseId)
          })
          Taro.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }

  const toggleSignatory = (id: string) => {
    setSelectedSignatories((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleCreate = () => {
    if (!newTitle.trim()) {
      Taro.showToast({ title: '请输入约定标题', icon: 'none' })
      return
    }
    if (!newContent.trim()) {
      Taro.showToast({ title: '请输入约定内容', icon: 'none' })
      return
    }
    if (selectedSignatories.length === 0) {
      Taro.showToast({ title: '请选择签署人', icon: 'none' })
      return
    }

    addPromise({
      title: newTitle.trim(),
      content: newContent.trim(),
      signatories: selectedSignatories
    })

    Taro.showToast({ title: '约定已创建', icon: 'success' })
    setShowCreateModal(false)
    setNewTitle('')
    setNewContent('')
    setSelectedSignatories([])
  }

  return (
    <ScrollView scrollY className={styles.wrapper}>
      <View className={styles.statsHeader}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{activeCount}</Text>
            <Text className={styles.statLabel}>进行中</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{pendingCount}</Text>
            <Text className={styles.statLabel}>待签署</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNum}>{familyMembers.length}</Text>
            <Text className={styles.statLabel}>家庭成员</Text>
          </View>
        </View>
        <View className={styles.avatarGroup}>
          {familyMembers.map((m) => (
            <View key={m.id} className={styles.avatarItem}>
              <Image src={m.avatar} mode="aspectFill" />
            </View>
          ))}
        </View>
      </View>

      <View className={styles.filterTabs}>
        {filterTabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(styles.filterTab, filter === tab.key && styles.active)}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </View>

      {filteredPromises.length === 0 ? (
        <EmptyState
          icon="📜"
          title="暂无约定"
          desc="点击右下角按钮创建一个亲子约定吧~"
        />
      ) : (
        filteredPromises.map((promise) => {
          const isSignedByMe = promise.signatures.some(
            (s) => s.memberId === currentMemberId
          )
          const amISignatory = promise.signatories.includes(currentMemberId)
          const showSignBtn = amISignatory && !isSignedByMe

          return (
            <View key={promise.id} className={styles.promiseCard}>
              <View className={styles.cardHeader}>
                <View
                  className={classnames(
                    styles.statusBadge,
                    styles[promise.status]
                  )}
                >
                  {statusConfig[promise.status].label}
                </View>
                {currentRole === 'parent' && (
                  <View
                    className={styles.deleteBtn}
                    onClick={() => handleDelete(promise.id)}
                  >
                    🗑️
                  </View>
                )}
              </View>

              <Text className={styles.promiseTitle}>{promise.title}</Text>

              <View className={styles.parchmentBg}>
                <Text className={styles.promiseContent}>{promise.content}</Text>
              </View>

              <View className={styles.signSection}>
                <Text className={styles.signTitle}>签署人</Text>
                <View className={styles.signList}>
                  {promise.signatories.map((sid) => {
                    const member = getMemberById(sid)
                    const signature = promise.signatures.find(
                      (s) => s.memberId === sid
                    )
                    const signed = !!signature

                    if (!member) return null

                    return (
                      <View
                        key={sid}
                        className={classnames(
                          styles.signItem,
                          signed ? styles.signed : styles.pending
                        )}
                      >
                        <View className={styles.signAvatarWrap}>
                          <View className={styles.signAvatar}>
                            <Image src={member.avatar} mode="aspectFill" />
                          </View>
                          {signed && (
                            <View className={styles.signedMark}>✓</View>
                          )}
                        </View>
                        <Text className={styles.signName}>{member.name}</Text>
                        {signed ? (
                          <Text className={styles.signedTime}>
                            {formatDate(signature!.signedAt, 'MM-DD')}
                          </Text>
                        ) : (
                          <Text className={styles.pendingText}>待签署</Text>
                        )}
                      </View>
                    )
                  })}
                </View>
              </View>

              {showSignBtn && (
                <Button
                  className={styles.signBtn}
                  onClick={() => handleSign(promise.id)}
                >
                  ✍️ 我同意并签署
                </Button>
              )}
            </View>
          )
        })
      )}

      {currentRole === 'parent' && (
        <View
          className={styles.fabBtn}
          onClick={() => setShowCreateModal(true)}
        >
          +
        </View>
      )}

      {showCreateModal && (
        <View
          className={styles.createModal}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false)
          }}
        >
          <View className={styles.modalContent}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>📜 新建约定</Text>
              <View
                className={styles.modalClose}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </View>
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>约定标题</Text>
              <Input
                className={styles.modalInput}
                placeholder="例如：学习时间约定"
                value={newTitle}
                onInput={(e) => setNewTitle(e.detail.value)}
                maxlength={30}
              />
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>约定内容</Text>
              <Textarea
                className={styles.modalTextarea}
                placeholder="请输入约定的具体内容，每行一条..."
                value={newContent}
                onInput={(e) => setNewContent(e.detail.value)}
                maxlength={500}
              />
            </View>

            <View className={styles.modalFormItem}>
              <Text className={styles.modalLabel}>
                签署人（{selectedSignatories.length}/{familyMembers.length}）
              </Text>
              <View className={styles.signatorySelector}>
                {familyMembers.map((m) => (
                  <View
                    key={m.id}
                    className={classnames(
                      styles.signatoryChip,
                      selectedSignatories.includes(m.id) && styles.active
                    )}
                    onClick={() => toggleSignatory(m.id)}
                  >
                    <Image
                      className={styles.chipAvatar}
                      src={m.avatar}
                      mode="aspectFill"
                    />
                    <Text className={styles.chipName}>{m.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            <Button
              className={styles.createBtn}
              onClick={handleCreate}
            >
              ✨ 创建约定
            </Button>
          </View>
        </View>
      )}
    </ScrollView>
  )
}

export default PromisePage
