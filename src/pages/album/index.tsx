import React, { useState, useMemo } from 'react'
import { View, Text, Image, Button, Textarea, Input, ScrollView, Switch } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { formatDate } from '../../utils'
import EmptyState from '../../components/EmptyState'
import dayjs from 'dayjs'

const MILESTONE_TYPES = [
  { key: '生日', label: '生日', icon: '🎂' },
  { key: '阅读启蒙', label: '阅读启蒙', icon: '📚' },
  { key: '运动技能', label: '运动技能', icon: '⚽' },
  { key: '勇气时刻', label: '勇气时刻', icon: '💪' },
  { key: '学习进步', label: '学习进步', icon: '📝' },
  { key: '艺术天赋', label: '艺术天赋', icon: '🎨' },
  { key: '社交能力', label: '社交能力', icon: '🤝' },
  { key: '生活技能', label: '生活技能', icon: '🛠️' },
  { key: '其他', label: '其他', icon: '⭐' }
]

const MONTH_COLORS = [
  '#FF6B8A',
  '#54A0FF',
  '#4ECDC4',
  '#FF9F43',
  '#FFD93D',
  '#5F27CD',
  '#10AC84',
  '#FF6B6B',
  '#A29BFE',
  '#00B894',
  '#FD79A8',
  '#6C5CE7'
]

const getMilestoneIcon = (type?: string) => {
  const found = MILESTONE_TYPES.find((m) => m.key === type)
  return found?.icon || '🏆'
}

const AlbumPage: React.FC = () => {
  const { growthRecords, familyMembers, currentRole, addGrowthRecord } = useAppStore()

  const [activeMemberTab, setActiveMemberTab] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline')
  const [showModal, setShowModal] = useState(false)

  const [formMemberId, setFormMemberId] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formPhotos, setFormPhotos] = useState<string[]>([])
  const [formMilestone, setFormMilestone] = useState(false)
  const [formMilestoneType, setFormMilestoneType] = useState<string>('')

  const childMembers = useMemo(
    () => familyMembers.filter((m) => m.role === 'child'),
    [familyMembers]
  )

  const getMember = (id: string) => familyMembers.find((m) => m.id === id)

  const filteredRecords = useMemo(() => {
    let records = [...growthRecords]
    if (activeMemberTab !== 'all') {
      records = records.filter((r) => r.memberId === activeMemberTab)
    }
    return records.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [growthRecords, activeMemberTab])

  const groupedRecords = useMemo(() => {
    const groups: Record<string, typeof filteredRecords> = {}
    filteredRecords.forEach((r) => {
      const key = dayjs(r.createdAt).format('YYYY年M月')
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return groups
  }, [filteredRecords])

  const allPhotos = useMemo(() => {
    const photos: { url: string; recordId: string }[] = []
    filteredRecords.forEach((r) => {
      r.photos.forEach((p) => photos.push({ url: p, recordId: r.id }))
    })
    return photos
  }, [filteredRecords])

  const handlePreviewImage = (current: string, urls: string[]) => {
    Taro.previewImage({ current, urls })
  }

  const handlePreviewGridPhoto = (index: number) => {
    const urls = allPhotos.map((p) => p.url)
    Taro.previewImage({ current: urls[index], urls })
  }

  const handleChoosePhoto = async () => {
    if (formPhotos.length >= 9) {
      Taro.showToast({ title: '最多上传9张', icon: 'none' })
      return
    }
    try {
      const res = await Taro.chooseImage({
        count: 9 - formPhotos.length,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      if (res.tempFilePaths) {
        setFormPhotos((prev) => [...prev, ...res.tempFilePaths])
      }
    } catch (e) {
      console.error('[Album] chooseImage error', e)
    }
  }

  const handleRemovePhoto = (index: number) => {
    setFormPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleOpenModal = () => {
    setFormMemberId(childMembers[0]?.id || '')
    setFormTitle('')
    setFormDesc('')
    setFormPhotos([])
    setFormMilestone(false)
    setFormMilestoneType('')
    setShowModal(true)
  }

  const handleSubmit = () => {
    if (!formMemberId) {
      Taro.showToast({ title: '请选择成员', icon: 'none' })
      return
    }
    if (!formTitle.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (formMilestone && !formMilestoneType) {
      Taro.showToast({ title: '请选择里程碑类型', icon: 'none' })
      return
    }

    addGrowthRecord({
      memberId: formMemberId,
      title: formTitle.trim(),
      description: formDesc.trim(),
      photos: formPhotos,
      milestone: formMilestone,
      milestoneType: formMilestone ? formMilestoneType : undefined
    })

    Taro.showToast({ title: '发布成功', icon: 'success' })
    setShowModal(false)
  }

  const renderTimeline = () => {
    if (filteredRecords.length === 0) {
      return (
        <View style={{ padding: '80rpx 0' }}>
          <EmptyState
            icon="📷"
            title="暂无相册记录"
            desc={currentRole === 'parent' ? '点击右下角按钮，记录美好瞬间吧～' : '等待爸爸妈妈上传精彩照片哦～'}
          />
        </View>
      )
    }

    const groupKeys = Object.keys(groupedRecords)

    return (
      <View className={styles.timeline}>
        {groupKeys.map((key, groupIdx) => {
          const list = groupedRecords[key]
          const color = MONTH_COLORS[groupIdx % MONTH_COLORS.length]
          return (
            <View key={key}>
              <View className={styles.yearMonth}>
                <View className={classnames(styles.dot)} style={{ background: color, color: `${color}40` }} />
                <Text className={styles.label}>{key}</Text>
                <Text className={styles.count}>{list.length}条记录</Text>
              </View>
              {list.map((record) => {
                const member = getMember(record.memberId)
                const photoUrls = record.photos.slice(0, 3)
                const colClass =
                  photoUrls.length === 1 ? styles['cols-1'] : photoUrls.length === 2 ? styles['cols-2'] : styles['cols-3']
                return (
                  <View
                    key={record.id}
                    className={classnames(styles.timelineCard, record.milestone && styles.milestone)}
                  >
                    {record.milestone && <View className={styles.cardIcon}>{getMilestoneIcon(record.milestoneType)}</View>}
                    <View className={styles.cardHeader}>
                      <View className={styles.cardMember}>
                        {member && (
                          <>
                            <Image className={styles.avatar} src={member.avatar} mode="aspectFill" />
                            <Text className={styles.name}>{member.name}</Text>
                          </>
                        )}
                      </View>
                      <Text className={styles.cardTime}>{formatDate(record.createdAt, 'MM-DD HH:mm')}</Text>
                    </View>
                    {record.milestone && (
                      <View className={styles.milestoneBadge}>
                        <Text className={styles.badgeIcon}>{getMilestoneIcon(record.milestoneType)}</Text>
                        <Text>{record.milestoneType}</Text>
                      </View>
                    )}
                    <View className={styles.cardTitle}>{record.title}</View>
                    {record.description && <View className={styles.cardDesc}>{record.description}</View>}
                    {photoUrls.length > 0 && (
                      <View className={classnames(styles.photoGrid, colClass)}>
                        {photoUrls.map((photo, i) => (
                          <View
                            key={i}
                            className={styles.photoItem}
                            onClick={() => handlePreviewImage(photo, record.photos)}
                          >
                            <Image className={styles.photo} src={photo} mode="aspectFill" />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          )
        })}
      </View>
    )
  }

  const renderGridView = () => {
    if (allPhotos.length === 0) {
      return (
        <View style={{ padding: '80rpx 0' }}>
          <EmptyState
            icon="🖼️"
            title="暂无照片"
            desc={currentRole === 'parent' ? '点击右下角按钮上传照片吧～' : '等待爸爸妈妈上传精彩照片哦～'}
          />
        </View>
      )
    }

    return (
      <View className={styles.gridView}>
        {allPhotos.map((item, i) => (
          <View
            key={`${item.recordId}-${i}`}
            className={styles.gridPhoto}
            onClick={() => handlePreviewGridPhoto(i)}
          >
            <Image
              className={styles.photo}
              src={item.url}
              mode="widthFix"
              lazyLoad
            />
          </View>
        ))}
      </View>
    )
  }

  const renderModal = () => {
    if (!showModal) return null
    return (
      <View className={styles.modalMask} onClick={() => setShowModal(false)}>
        <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
          <View className={styles.modalHeader}>
            <Text className={styles.modalTitle}>📸 发布成长记录</Text>
            <View className={styles.modalClose} onClick={() => setShowModal(false)}>
              ✕
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>选择成员</Text>
            <View className={styles.memberOptions}>
              {childMembers.map((m) => (
                <View
                  key={m.id}
                  className={classnames(styles.memberOption, formMemberId === m.id && styles.active)}
                  onClick={() => setFormMemberId(m.id)}
                >
                  <Image className={styles.avatar} src={m.avatar} mode="aspectFill" />
                  <Text className={styles.name}>{m.name}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>标题</Text>
            <Input
              className={styles.inputBox}
              placeholder="给这个瞬间起个名字吧"
              value={formTitle}
              onInput={(e) => setFormTitle(e.detail.value)}
              maxlength={50}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>描述</Text>
            <Textarea
              className={styles.textareaBox}
              placeholder="记录一下当时的心情和故事..."
              value={formDesc}
              onInput={(e) => setFormDesc(e.detail.value)}
              maxlength={500}
            />
          </View>

          <View className={styles.formItem}>
            <Text className={styles.formLabel}>照片（{formPhotos.length}/9）</Text>
            <View className={styles.uploadArea}>
              <View className={styles.photoList}>
                {formPhotos.map((photo, i) => (
                  <View key={i} className={styles.photoItem}>
                    <Image className={styles.photo} src={photo} mode="aspectFill" />
                    <View className={styles.removeBtn} onClick={() => handleRemovePhoto(i)}>
                      ✕
                    </View>
                  </View>
                ))}
                {formPhotos.length < 9 && (
                  <View className={styles.addBtn} onClick={handleChoosePhoto}>
                    <Text className={styles.plus}>＋</Text>
                    <Text>添加照片</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.switchRow}>
              <View className={styles.switchLabel}>
                <Text className={styles.icon}>🏆</Text>
                <Text>标记为里程碑</Text>
              </View>
              <Switch
                checked={formMilestone}
                onChange={(e) => setFormMilestone(e.detail.value)}
                color="#FF6B8A"
              />
            </View>
            {formMilestone && (
              <View className={styles.milestoneOptions}>
                {MILESTONE_TYPES.map((m) => (
                  <View
                    key={m.key}
                    className={classnames(styles.milestoneOption, formMilestoneType === m.key && styles.active)}
                    onClick={() => setFormMilestoneType(m.key)}
                  >
                    <Text className={styles.optionIcon}>{m.icon}</Text>
                    <Text>{m.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <Button className={styles.submitBtn} onClick={handleSubmit}>
            发布记录
          </Button>
        </View>
      </View>
    )
  }

  return (
    <View className="page-container">
      <View className={styles.memberTabs}>
        <View
          className={classnames(styles.tabItem, activeMemberTab === 'all' && styles.active)}
          onClick={() => setActiveMemberTab('all')}
        >
          全部
        </View>
        {childMembers.map((m) => (
          <View
            key={m.id}
            className={classnames(styles.tabItem, activeMemberTab === m.id && styles.active)}
            onClick={() => setActiveMemberTab(m.id)}
          >
            {m.name}
          </View>
        ))}
      </View>

      <View className={styles.viewSwitcher}>
        <View
          className={classnames(styles.switchBtn, viewMode === 'timeline' && styles.active)}
          onClick={() => setViewMode('timeline')}
        >
          🕐 时间轴
        </View>
        <View
          className={classnames(styles.switchBtn, viewMode === 'grid' && styles.active)}
          onClick={() => setViewMode('grid')}
        >
          🔲 网格视图
        </View>
      </View>

      <ScrollView scrollY enableBackToTop style={{ height: 'calc(100vh - 220rpx)' }}>
        {viewMode === 'timeline' ? renderTimeline() : renderGridView()}
      </ScrollView>

      {currentRole === 'parent' && (
        <View className={styles.fabBtn} onClick={handleOpenModal}>
          ＋
        </View>
      )}

      {renderModal()}
    </View>
  )
}

export default AlbumPage
