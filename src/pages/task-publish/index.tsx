import React, { useState, useMemo } from 'react'
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { taskTypeConfig, validateBlacklistWords } from '../../utils'
import { TaskType } from '../../types'

const taskTypeOptions: { key: TaskType; icon: string; label: string }[] = [
  { key: 'reading', icon: '📚', label: '阅读' },
  { key: 'homework', icon: '📝', label: '作业' },
  { key: 'exercise', icon: '🏃', label: '运动' },
  { key: 'tidying', icon: '🧹', label: '整理' },
  { key: 'other', icon: '✨', label: '其他' }
]

const reminderOptions = ['08:00', '12:00', '17:00', '18:30', '19:00', '20:00', '无提醒']

const TaskPublishPage: React.FC = () => {
  const { familyMembers, addTask, blacklistWords, currentRule } = useAppStore()

  const getDefaultPointsForType = (t: TaskType) => {
    const map: Record<TaskType, number> = {
      reading: currentRule.readingPoints,
      homework: currentRule.homeworkPoints,
      exercise: currentRule.exercisePoints,
      tidying: currentRule.tidyingPoints,
      other: currentRule.otherPoints
    }
    return map[t]
  }

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TaskType>('reading')
  const [points, setPoints] = useState(getDefaultPointsForType('reading'))
  const [bonusDays, setBonusDays] = useState(currentRule.bonusDays)
  const [bonusPoints, setBonusPoints] = useState(
    getDefaultPointsForType('reading') * currentRule.bonusMultiplier
  )
  const [reminder, setReminder] = useState('19:00')
  const [assignedTo, setAssignedTo] = useState<string[]>([])

  const childMembers = familyMembers.filter((m) => m.role === 'child')

  const handleTypeChange = (t: TaskType) => {
    setType(t)
    const pts = getDefaultPointsForType(t)
    setPoints(pts)
    setBonusPoints(pts * currentRule.bonusMultiplier)
  }

  const wordAlert = useMemo(() => {
    const text = `${title} ${description}`
    const found = validateBlacklistWords(text, blacklistWords.map((w) => w.word))
    return found.length > 0 ? found : null
  }, [title, description, blacklistWords])

  const toggleMember = (id: string) => {
    setAssignedTo((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    if (!title.trim()) {
      Taro.showToast({ title: '请输入任务名称', icon: 'none' })
      return
    }
    if (assignedTo.length === 0) {
      Taro.showToast({ title: '请选择任务执行人', icon: 'none' })
      return
    }

    addTask({
      title: title.trim(),
      type,
      description: description.trim(),
      points,
      bonusDays,
      bonusPoints,
      reminder: reminder === '无提醒' ? '' : reminder,
      deadline: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      assignedTo
    })

    Taro.showToast({ title: '任务已发布', icon: 'success' })
    setTimeout(() => Taro.navigateBack(), 800)
  }

  return (
    <View>
      <View className={styles.wrapper}>
        <View className={styles.formCard}>
          <View className={styles.formTitle}>📋 任务基本信息</View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>任务类型</View>
            <View className={styles.typeGrid}>
              {taskTypeOptions.map((opt) => (
                <View
                  key={opt.key}
                  className={classnames(styles.typeItem, type === opt.key && styles.active)}
                  onClick={() => handleTypeChange(opt.key)}
                >
                  <Text className={styles.typeIcon}>{opt.icon}</Text>
                  <Text className={styles.typeName}>{opt.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>任务名称</View>
            <Input
              className={styles.formInput}
              placeholder="例如：每日阅读30分钟"
              value={title}
              onInput={(e) => setTitle(e.detail.value)}
              maxlength={30}
            />
            {wordAlert && (
              <View className={styles.wordAlert}>
                ⚠️ 检测到敏感词：{wordAlert.join('、')}，建议修改
              </View>
            )}
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>任务描述（可选）</View>
            <Textarea
              className={styles.formTextarea}
              placeholder="描述任务的具体要求和验收标准..."
              value={description}
              onInput={(e) => setDescription(e.detail.value)}
              maxlength={200}
            />
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>⭐ 积分设置</View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>基础积分</View>
            <View className={styles.pointsRow}>
              <View className={styles.pointsStepper}>
                <Button
                  className={styles.stepperBtn}
                  onClick={() => setPoints((p) => Math.max(1, p - 1))}
                >
                  −
                </Button>
                <Text className={styles.stepperValue}>{points}</Text>
                <Button
                  className={styles.stepperBtn}
                  onClick={() => setPoints((p) => p + 1)}
                >
                  +
                </Button>
              </View>
              <View style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <View className={styles.quickPoints}>
                  {[5, 10, 15, 20].map((v) => (
                    <View
                      key={v}
                      className={classnames(styles.quickPoint, points === v && styles.active)}
                      onClick={() => setPoints(v)}
                    >
                      {v}分
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: '11px', color: '#999', paddingLeft: '4px' }}>
                  ✨ 规则建议 {getDefaultPointsForType(type)}分
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>连续打卡奖励</View>
            <View className={styles.bonusRow}>
              <View className={styles.bonusRowItem}>
                <View className={styles.bonusRowLabel}>连续天数</View>
                <View className={styles.bonusRowValue}>
                  <Button
                    className={styles.bonusStepperBtn}
                    onClick={() => setBonusDays((d) => Math.max(1, d - 1))}
                  >
                    −
                  </Button>
                  <Text className={styles.bonusStepperValue}>{bonusDays}天</Text>
                  <Button
                    className={styles.bonusStepperBtn}
                    onClick={() => setBonusDays((d) => d + 1)}
                  >
                    +
                  </Button>
                </View>
              </View>
              <View className={styles.bonusRowItem}>
                <View className={styles.bonusRowLabel}>奖励积分</View>
                <View className={styles.bonusRowValue}>
                  <Button
                    className={styles.bonusStepperBtn}
                    onClick={() => setBonusPoints((p) => Math.max(0, p - 5))}
                  >
                    −
                  </Button>
                  <Text className={styles.bonusStepperValue}>+{bonusPoints}</Text>
                  <Button
                    className={styles.bonusStepperBtn}
                    onClick={() => setBonusPoints((p) => p + 5)}
                  >
                    +
                  </Button>
                </View>
              </View>
            </View>
          </View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>📊 奖励预览表</View>
            <View style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {[3, 7, 14, 30, 100].map((D) => {
                const remainder = D % bonusDays
                const isMultiple = remainder === 0
                const multiplier = D / bonusDays
                const daysToNext = bonusDays - (remainder || bonusDays)
                const nextMilestone = D + daysToNext
                const nextMultiplier = Math.ceil(D / bonusDays)

                return (
                  <View
                    key={D}
                    style={{
                      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <Text style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                      节点 {D}天
                    </Text>
                    {isMultiple ? (
                      <Text style={{ fontSize: '13px', color: '#00B894', fontWeight: 600 }}>
                        满{D}天：+{bonusPoints} × {multiplier}分
                      </Text>
                    ) : (
                      <Text style={{ fontSize: '12px', color: '#54A0FF' }}>
                        再{daysToNext}天，满{nextMilestone}天 +{bonusPoints} × {nextMultiplier}分
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        </View>

        <View className={styles.formCard}>
          <View className={styles.formTitle}>👤 分配与提醒</View>

          <View className={styles.formItem}>
            <View className={styles.formLabel}>
              分配给（{assignedTo.length}/{childMembers.length}）
            </View>
            <View className={styles.memberSelector}>
              {childMembers.map((m) => (
                <View
                  key={m.id}
                  className={classnames(
                    styles.memberChip,
                    assignedTo.includes(m.id) && styles.active
                  )}
                  onClick={() => toggleMember(m.id)}
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

          <View className={styles.formItem}>
            <View className={styles.formLabel}>提醒时间</View>
            <View className={styles.reminderRow}>
              {reminderOptions.map((r) => (
                <View
                  key={r}
                  className={classnames(styles.reminderItem, reminder === r && styles.active)}
                  onClick={() => setReminder(r)}
                >
                  {r}
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <View className={styles.footer}>
        <Button className={styles.submitBtn} onClick={handleSubmit}>
          🚀 发布任务
        </Button>
      </View>
    </View>
  )
}

export default TaskPublishPage
