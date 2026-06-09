import React, { useState, useMemo } from 'react'
import { View, Text, Button, Input, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'

const templateIcons: Record<string, string> = {
  rt1: '🎒',
  rt2: '🧸',
  rt3: '🎯'
}

interface RulesForm {
  readingPoints: number
  homeworkPoints: number
  exercisePoints: number
  tidyingPoints: number
  bonusDays: number
  bonusMultiplier: number
}

interface PendingAdjust {
  amount: number
  description: string
  type: 'reward' | 'deduct'
}

const ruleConfig: { key: keyof RulesForm; label: string; step: number; min: number }[] = [
  { key: 'readingPoints', label: '阅读基础分', step: 1, min: 0 },
  { key: 'homeworkPoints', label: '作业基础分', step: 1, min: 0 },
  { key: 'exercisePoints', label: '运动基础分', step: 1, min: 0 },
  { key: 'tidyingPoints', label: '整理基础分', step: 1, min: 0 },
  { key: 'bonusDays', label: '连续打卡周期(天)', step: 1, min: 1 },
  { key: 'bonusMultiplier', label: '连续奖励倍数', step: 1, min: 1 }
]

const quickActions = {
  rewards: [
    { label: '表现优秀', amount: 20, type: 'reward' as const, icon: '🌟' },
    { label: '主动帮忙', amount: 10, type: 'reward' as const, icon: '🤝' },
    { label: '按时睡觉', amount: 5, type: 'reward' as const, icon: '😴' }
  ],
  punishes: [
    { label: '迟到', amount: 10, type: 'deduct' as const, icon: '⏰' },
    { label: '不写作业', amount: 20, type: 'deduct' as const, icon: '📝' },
    { label: '说脏话', amount: 15, type: 'deduct' as const, icon: '🚫' }
  ]
}

const RulesPage: React.FC = () => {
  const {
    ruleTemplates,
    blacklistWords,
    addBlacklistWord,
    removeBlacklistWord,
    adjustPoints,
    familyMembers
  } = useAppStore()

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(ruleTemplates[0]?.id || '')
  const [rules, setRules] = useState<RulesForm>(() => {
    const tpl = ruleTemplates[0]
    return {
      readingPoints: (tpl?.content.find((c) => c.key === 'readingPoints')?.value as number) ?? 10,
      homeworkPoints: (tpl?.content.find((c) => c.key === 'homeworkPoints')?.value as number) ?? 15,
      exercisePoints: (tpl?.content.find((c) => c.key === 'exercisePoints')?.value as number) ?? 12,
      tidyingPoints: (tpl?.content.find((c) => c.key === 'tidyingPoints')?.value as number) ?? 8,
      bonusDays: (tpl?.content.find((c) => c.key === 'bonusDays')?.value as number) ?? 7,
      bonusMultiplier: (tpl?.content.find((c) => c.key === 'bonusMultiplier')?.value as number) ?? 3
    }
  })
  const [newWord, setNewWord] = useState('')
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [pendingAdjust, setPendingAdjust] = useState<PendingAdjust | null>(null)

  const childMembers = useMemo(
    () => familyMembers.filter((m) => m.role === 'child'),
    [familyMembers]
  )

  const applyTemplate = (templateId: string) => {
    const tpl = ruleTemplates.find((t) => t.id === templateId)
    if (!tpl) return

    setSelectedTemplateId(templateId)
    const newRules: RulesForm = { ...rules }
    tpl.content.forEach((item) => {
      if (item.key in newRules) {
        ;(newRules as Record<string, number>)[item.key] = item.value as number
      }
    })
    setRules(newRules)
    Taro.showToast({ title: `已应用${tpl.name}`, icon: 'success' })
  }

  const handleStepperChange = (key: keyof RulesForm, delta: number) => {
    const config = ruleConfig.find((c) => c.key === key)!
    setRules((prev) => ({
      ...prev,
      [key]: Math.max(config.min, prev[key] + delta)
    }))
  }

  const handleAddWord = () => {
    const word = newWord.trim()
    if (!word) {
      Taro.showToast({ title: '请输入敏感词', icon: 'none' })
      return
    }
    if (blacklistWords.some((w) => w.word === word)) {
      Taro.showToast({ title: '该词已存在', icon: 'none' })
      return
    }
    addBlacklistWord(word)
    setNewWord('')
    Taro.showToast({ title: '添加成功', icon: 'success' })
  }

  const handleRemoveWord = (id: string) => {
    removeBlacklistWord(id)
    Taro.showToast({ title: '已删除', icon: 'success' })
  }

  const handleQuickAction = (action: PendingAdjust) => {
    setPendingAdjust(action)
    setShowMemberModal(true)
  }

  const handleSelectMember = (memberId: string) => {
    if (!pendingAdjust) return
    const member = familyMembers.find((m) => m.id === memberId)
    adjustPoints(
      memberId,
      pendingAdjust.amount,
      pendingAdjust.description,
      pendingAdjust.type
    )
    setShowMemberModal(false)
    setPendingAdjust(null)
    Taro.showToast({
      title: `${member?.name} ${pendingAdjust.type === 'reward' ? '+' : '-'}${pendingAdjust.amount}分`,
      icon: 'success'
    })
  }

  const handleSave = () => {
    Taro.showToast({ title: '规则已保存', icon: 'success' })
  }

  return (
    <View>
      <View className={styles.wrapper}>
        <ScrollView
          className={styles.templateScroll}
          scrollX
          enhanced
          showScrollbar={false}
        >
          {ruleTemplates.map((tpl) => (
            <View
              key={tpl.id}
              className={classnames(
                styles.templateCard,
                selectedTemplateId === tpl.id && styles.templateActive
              )}
            >
              <Text className={styles.templateIcon}>
                {templateIcons[tpl.id] || '📋'}
              </Text>
              <Text className={styles.templateName}>{tpl.name}</Text>
              <Text className={styles.templateDesc}>{tpl.description}</Text>
              <Button
                className={styles.templateApplyBtn}
                onClick={() => applyTemplate(tpl.id)}
              >
                {selectedTemplateId === tpl.id ? '✓ 已应用' : '应用模板'}
              </Button>
            </View>
          ))}
        </ScrollView>

        <View className={styles.rulesSection}>
          <View className={styles.sectionTitle}>⚙️ 当前规则设置</View>
          {ruleConfig.map((config) => (
            <View key={config.key} className={styles.ruleItem}>
              <Text className={styles.ruleLabel}>{config.label}</Text>
              <View className={styles.ruleStepper}>
                <Button
                  className={styles.stepperBtn}
                  onClick={() => handleStepperChange(config.key, -config.step)}
                >
                  −
                </Button>
                <Text className={styles.stepperValue}>{rules[config.key]}</Text>
                <Button
                  className={styles.stepperBtn}
                  onClick={() => handleStepperChange(config.key, config.step)}
                >
                  +
                </Button>
              </View>
            </View>
          ))}
        </View>

        <View className={styles.blacklistSection}>
          <View className={styles.sectionTitle}>🚫 敏感词提醒</View>
          <View className={styles.sectionDesc}>
            以下词汇在任务/约定中出现时会自动提示，帮助引导文明用语
          </View>
          <View className={styles.wordList}>
            {blacklistWords.map((w) => (
              <View key={w.id} className={styles.wordChip}>
                <Text className={styles.wordText}>{w.word}</Text>
                <Text className={styles.wordCount}>{w.count}</Text>
                <Button
                  className={styles.wordRemove}
                  onClick={() => handleRemoveWord(w.id)}
                >
                  ×
                </Button>
              </View>
            ))}
            {blacklistWords.length === 0 && (
              <Text className={styles.sectionDesc}>暂无敏感词，可添加</Text>
            )}
          </View>
          <View className={styles.addWordRow}>
            <Input
              className={styles.addWordInput}
              placeholder="输入需要提醒的敏感词"
              value={newWord}
              onInput={(e) => setNewWord(e.detail.value)}
              maxlength={10}
              confirmType="done"
              onConfirm={handleAddWord}
            />
            <Button className={styles.addWordBtn} onClick={handleAddWord}>
              添加
            </Button>
          </View>
        </View>

        <View className={styles.quickSection}>
          <View className={styles.sectionTitle}>⚡ 快捷积分调整</View>
          <View className={styles.quickBtnsGrid}>
            {quickActions.rewards.map((action, idx) => (
              <Button
                key={`reward-${idx}`}
                className={styles.rewardBtn}
                onClick={() =>
                  handleQuickAction({
                    amount: action.amount,
                    description: action.label,
                    type: action.type
                  })
                }
              >
                <Text>{action.icon}</Text>
                <Text>
                  {action.label} +{action.amount}
                </Text>
              </Button>
            ))}
            {quickActions.punishes.map((action, idx) => (
              <Button
                key={`punish-${idx}`}
                className={styles.punishBtn}
                onClick={() =>
                  handleQuickAction({
                    amount: action.amount,
                    description: action.label,
                    type: action.type
                  })
                }
              >
                <Text>{action.icon}</Text>
                <Text>
                  {action.label} -{action.amount}
                </Text>
              </Button>
            ))}
          </View>
        </View>
      </View>

      {showMemberModal && (
        <View className={styles.memberSelectModal} onClick={() => setShowMemberModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalTitle}>选择要调整的成员</View>
            <View className={styles.memberList}>
              {childMembers.map((m) => (
                <View
                  key={m.id}
                  className={styles.memberChip}
                  onClick={() => handleSelectMember(m.id)}
                >
                  <Image
                    className={styles.memberAvatar}
                    src={m.avatar}
                    mode="aspectFill"
                  />
                  <View className={styles.memberInfo}>
                    <Text className={styles.memberName}>{m.name}</Text>
                    <Text className={styles.memberPoints}>当前积分：{m.points}</Text>
                  </View>
                  <Text className={styles.memberRole}>孩子</Text>
                </View>
              ))}
            </View>
            <Button
              className={styles.cancelBtn}
              onClick={() => {
                setShowMemberModal(false)
                setPendingAdjust(null)
              }}
            >
              取消
            </Button>
          </View>
        </View>
      )}

      <View className={styles.footer}>
        <Button className={styles.saveBtn} onClick={handleSave}>
          💾 保存规则设置
        </Button>
      </View>
    </View>
  )
}

export default RulesPage
