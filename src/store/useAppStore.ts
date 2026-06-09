import { create } from 'zustand'
import {
  FamilyMember,
  Task,
  PointRecord,
  Reward,
  ExchangeRecord,
  GrowthRecord,
  RuleTemplate,
  PromiseItem,
  BlacklistWord,
  TaskType,
  TaskStatus
} from '../types'
import { mockFamilyMembers } from '../data/family'
import { mockTasks } from '../data/tasks'
import { mockPointRecords, mockMonthlyPoints } from '../data/points'
import { mockRewards, mockExchangeRecords } from '../data/rewards'
import {
  mockGrowthRecords,
  mockRuleTemplates,
  mockPromises,
  mockBlacklistWords
} from '../data/growth'
import { generateId } from '../utils'

export interface PerMemberTaskState {
  status: TaskStatus
  photo?: string
  checkedAt?: string
  checkedBy?: string
  remark?: string
  submittedAt?: string
}

export interface CurrentRuleSettings {
  readingPoints: number
  homeworkPoints: number
  exercisePoints: number
  tidyingPoints: number
  otherPoints: number
  bonusDays: number
  bonusMultiplier: number
}

const defaultRuleSettings: CurrentRuleSettings = {
  readingPoints: 10,
  homeworkPoints: 15,
  exercisePoints: 12,
  tidyingPoints: 8,
  otherPoints: 10,
  bonusDays: 7,
  bonusMultiplier: 3
}

const initPerMemberStatus = (task: Task) => {
  const status: Record<string, PerMemberTaskState> = {}
  task.assignedTo.forEach((mid) => {
    status[mid] = {
      status: task.status,
      photo: task.photo,
      checkedAt: task.checkedAt,
      checkedBy: task.checkedBy,
      remark: task.remark
    }
  })
  return status
}

const initTasksWithPerMember = (tasks: Task[]) => {
  return tasks.map((t) => ({
    ...t,
    perMemberStatus: (t as any).perMemberStatus || initPerMemberStatus(t)
  }))
}

interface AppState {
  currentMemberId: string
  currentRole: 'parent' | 'child'
  familyMembers: FamilyMember[]
  tasks: (Task & { perMemberStatus?: Record<string, PerMemberTaskState> })[]
  pointRecords: PointRecord[]
  monthlyPoints: typeof mockMonthlyPoints
  rewards: Reward[]
  exchangeRecords: ExchangeRecord[]
  growthRecords: GrowthRecord[]
  ruleTemplates: RuleTemplate[]
  promises: PromiseItem[]
  blacklistWords: BlacklistWord[]
  currentRule: CurrentRuleSettings

  setCurrentMember: (id: string) => void
  switchRole: () => void
  addFamilyMember: (data: { name: string; avatar: string; role: 'parent' | 'child'; color?: string }) => FamilyMember

  addTask: (task: Partial<Task>) => void
  submitTaskPhoto: (taskId: string, memberId: string, photo: string) => void
  updateTaskMemberStatus: (
    taskId: string,
    memberId: string,
    status: TaskStatus,
    remark?: string
  ) => void
  updateTaskStatus: (id: string, status: TaskStatus, remark?: string) => void

  addPointRecord: (record: Partial<PointRecord>) => void
  adjustPoints: (memberId: string, amount: number, description: string, type: 'earn' | 'deduct' | 'reward' | 'bonus') => void

  createExchange: (rewardId: string, memberId: string, quantity?: number) => boolean
  approveExchange: (id: string, approved: boolean, remark?: string) => void

  addGrowthRecord: (record: Partial<GrowthRecord>) => void
  addPromise: (promise: Partial<PromiseItem>) => void
  signPromise: (id: string, memberId: string) => void
  addBlacklistWord: (word: string) => void
  removeBlacklistWord: (id: string) => void

  saveCurrentRule: (rule: Partial<CurrentRuleSettings>) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentMemberId: 'c1',
  currentRole: 'parent',
  familyMembers: mockFamilyMembers,
  tasks: initTasksWithPerMember(mockTasks),
  pointRecords: mockPointRecords,
  monthlyPoints: mockMonthlyPoints,
  rewards: mockRewards,
  exchangeRecords: mockExchangeRecords,
  growthRecords: mockGrowthRecords,
  ruleTemplates: mockRuleTemplates,
  promises: mockPromises,
  blacklistWords: mockBlacklistWords,
  currentRule: defaultRuleSettings,

  setCurrentMember: (id) => set({ currentMemberId: id }),
  switchRole: () =>
    set((state) => ({
      currentRole: state.currentRole === 'parent' ? 'child' : 'parent'
    })),

  addFamilyMember: (data) => {
    const colorPool = ['#54A0FF', '#4ECDC4', '#FFD93D', '#FF9F43', '#A29BFE', '#00B894', '#E17055', '#FD79A8']
    const newMember: FamilyMember = {
      id: 'm' + generateId(),
      name: data.name.trim(),
      avatar: data.avatar || `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 1}/200/200`,
      role: data.role,
      points: 0,
      streak: 0,
      color: data.color || colorPool[Math.floor(Math.random() * colorPool.length)]
    }
    set((state) => ({
      familyMembers: [...state.familyMembers, newMember]
    }))
    return newMember
  },

  addTask: (task) => {
    const newId = generateId()
    const assignedTo = task.assignedTo || []
    const perMemberStatus: Record<string, PerMemberTaskState> = {}
    assignedTo.forEach((mid) => {
      perMemberStatus[mid] = { status: 'pending' as TaskStatus }
    })
    const type = (task.type as TaskType) || 'other'
    set((state) => {
      const newTask = {
        id: newId,
        title: task.title || '',
        type,
        description: task.description || '',
        points: task.points !== undefined ? task.points : state.currentRule[`${type}Points` as keyof CurrentRuleSettings] as number || 10,
        bonusPoints: task.bonusPoints !== undefined ? task.bonusPoints : (state.currentRule[`${type}Points` as keyof CurrentRuleSettings] as number || 10) * state.currentRule.bonusMultiplier,
        bonusDays: task.bonusDays !== undefined ? task.bonusDays : state.currentRule.bonusDays,
        deadline: task.deadline || new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
        reminder: task.reminder || '',
        createdAt: new Date().toISOString(),
        assignedTo,
        status: 'pending' as TaskStatus,
        perMemberStatus
      }
      return {
        tasks: [newTask as any, ...state.tasks]
      }
    })
  },

  submitTaskPhoto: (taskId, memberId, photo) =>
    set((state) => {
      const newTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const perMember = { ...(t.perMemberStatus || {}) }
          perMember[memberId] = {
            ...perMember[memberId],
            status: 'checking' as TaskStatus,
            photo,
            submittedAt: new Date().toISOString()
          }
          return {
            ...t,
            status: 'checking' as TaskStatus,
            photo,
            perMemberStatus: perMember
          }
        }
        return t
      })
      return { tasks: newTasks }
    }),

  updateTaskMemberStatus: (taskId, memberId, status, remark) =>
    set((state) => {
      let updatedMembers = state.familyMembers
      const newRecords: PointRecord[] = []

      const newTasks = state.tasks.map((t) => {
        if (t.id === taskId) {
          const perMember = { ...(t.perMemberStatus || {}) }
          const oldState = perMember[memberId] || { status: 'pending' as TaskStatus }

          perMember[memberId] = {
            ...oldState,
            status,
            remark,
            checkedAt: new Date().toISOString(),
            checkedBy: state.currentMemberId
          }

          // 审核通过时，给该成员单独加分
          if (status === 'done' && oldState.status !== 'done') {
            const member = state.familyMembers.find((m) => m.id === memberId)
            if (member && member.role === 'child') {
              const bonusPoints =
                member.streak > 0 && (member.streak + 1) % t.bonusDays === 0
                  ? t.bonusPoints
                  : 0
              const totalPoints = t.points + bonusPoints

              newRecords.push({
                id: generateId(),
                memberId,
                type: 'earn',
                amount: t.points,
                balance: member.points + totalPoints,
                description: `完成${t.title}`,
                sourceId: t.id,
                sourceType: 'task',
                createdAt: new Date().toISOString(),
                operatorId: state.currentMemberId
              })

              if (bonusPoints > 0) {
                newRecords.push({
                  id: generateId(),
                  memberId,
                  type: 'bonus',
                  amount: bonusPoints,
                  balance: member.points + totalPoints,
                  description: `连续打卡${member.streak + 1}天奖励`,
                  sourceType: 'bonus',
                  createdAt: new Date().toISOString()
                })
              }

              updatedMembers = updatedMembers.map((m) =>
                m.id === memberId
                  ? { ...m, points: m.points + totalPoints, streak: m.streak + 1 }
                  : m
              )
            }
          }

          // 计算该任务的总体状态
          const memberStatuses = Object.values(perMember).map((s) => s.status)
          let overallStatus: TaskStatus = t.status
          if (memberStatuses.every((s) => s === 'done')) overallStatus = 'done'
          else if (memberStatuses.some((s) => s === 'checking')) overallStatus = 'checking'
          else if (memberStatuses.every((s) => s === 'rejected')) overallStatus = 'rejected'
          else overallStatus = 'pending'

          return {
            ...t,
            status: overallStatus,
            perMemberStatus: perMember
          }
        }
        return t
      })

      return {
        tasks: newTasks,
        familyMembers: updatedMembers,
        pointRecords: [...newRecords, ...state.pointRecords]
      }
    }),

  updateTaskStatus: (id, status, remark) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task) return state

      // 向后兼容：同时更新所有分配成员的状态
      if (!task.perMemberStatus && status === 'done') {
        const newRecords: PointRecord[] = []
        const updatedMembers = state.familyMembers.map((m) => {
          if (task.assignedTo.includes(m.id) && m.role === 'child') {
            const bonusPoints =
              m.streak > 0 && (m.streak + 1) % task.bonusDays === 0
                ? task.bonusPoints
                : 0
            const totalPoints = task.points + bonusPoints

            newRecords.push({
              id: generateId(),
              memberId: m.id,
              type: 'earn',
              amount: task.points,
              balance: m.points + totalPoints,
              description: `完成${task.title}`,
              sourceId: task.id,
              sourceType: 'task',
              createdAt: new Date().toISOString(),
              operatorId: state.currentMemberId
            })

            if (bonusPoints > 0) {
              newRecords.push({
                id: generateId(),
                memberId: m.id,
                type: 'bonus',
                amount: bonusPoints,
                balance: m.points + totalPoints,
                description: `连续打卡${m.streak + 1}天奖励`,
                sourceType: 'bonus',
                createdAt: new Date().toISOString()
              })
            }

            return {
              ...m,
              points: m.points + totalPoints,
              streak: m.streak + 1
            }
          }
          return m
        })

        const perMemberStatus: Record<string, PerMemberTaskState> = {}
        task.assignedTo.forEach((mid) => {
          perMemberStatus[mid] = {
            status,
            remark,
            checkedAt: new Date().toISOString(),
            checkedBy: state.currentMemberId
          }
        })

        const updatedTasks = state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                remark,
                checkedAt: new Date().toISOString(),
                checkedBy: state.currentMemberId,
                perMemberStatus
              }
            : t
        )

        return {
          tasks: updatedTasks,
          familyMembers: updatedMembers,
          pointRecords: [...newRecords, ...state.pointRecords]
        }
      }

      // 默认：只更新任务本身状态（兼容旧代码）
      const perMemberStatus: Record<string, PerMemberTaskState> = task.perMemberStatus || {}
      task.assignedTo.forEach((mid) => {
        perMemberStatus[mid] = {
          ...(perMemberStatus[mid] || { status: 'pending' as TaskStatus }),
          status,
          remark,
          checkedAt: new Date().toISOString(),
          checkedBy: state.currentMemberId
        }
      })

      return {
        tasks: state.tasks.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                remark,
                checkedAt: new Date().toISOString(),
                checkedBy: state.currentMemberId,
                perMemberStatus
              }
            : t
        )
      }
    }),

  addPointRecord: (record) =>
    set((state) => ({
      pointRecords: [
        {
          id: generateId(),
          memberId: record.memberId || state.currentMemberId,
          type: record.type || 'earn',
          amount: record.amount || 0,
          balance: record.balance || 0,
          description: record.description || '',
          sourceType: record.sourceType,
          createdAt: new Date().toISOString(),
          operatorId: state.currentMemberId
        },
        ...state.pointRecords
      ]
    })),

  adjustPoints: (memberId, amount, description, type) =>
    set((state) => {
      const member = state.familyMembers.find((m) => m.id === memberId)
      if (!member) return state

      const newBalance = type === 'deduct' ? member.points - amount : member.points + amount

      return {
        familyMembers: state.familyMembers.map((m) =>
          m.id === memberId ? { ...m, points: newBalance } : m
        ),
        pointRecords: [
          {
            id: generateId(),
            memberId,
            type,
            amount,
            balance: newBalance,
            description,
            sourceType: type === 'deduct' ? 'punishment' : 'manual',
            createdAt: new Date().toISOString(),
            operatorId: state.currentMemberId
          },
          ...state.pointRecords
        ]
      }
    }),

  createExchange: (rewardId, memberId, quantity = 1) => {
    const state = get()
    const reward = state.rewards.find((r) => r.id === rewardId)
    const member = state.familyMembers.find((m) => m.id === memberId)

    if (!reward || !member) return false
    if (reward.stock < quantity) return false
    const totalCost = reward.price * quantity
    if (member.points < totalCost) return false

    set((s) => ({
      familyMembers: s.familyMembers.map((m) =>
        m.id === memberId ? { ...m, points: m.points - totalCost } : m
      ),
      rewards: s.rewards.map((r) =>
        r.id === rewardId
          ? {
              ...r,
              stock: r.stock - quantity,
              sold: r.sold + quantity,
              status: r.stock - quantity === 0 ? 'soldout' : r.status
            }
          : r
      ),
      exchangeRecords: [
        {
          id: generateId(),
          rewardId,
          rewardName: reward.name,
          rewardImage: reward.image,
          memberId,
          memberName: member.name,
          points: totalCost,
          quantity,
          status: reward.needApproval ? 'pending' : 'approved',
          createdAt: new Date().toISOString()
        },
        ...s.exchangeRecords
      ],
      pointRecords: [
        {
          id: generateId(),
          memberId,
          type: 'deduct',
          amount: totalCost,
          balance: member.points - totalCost,
          description: `兑换${reward.name}（兑换申请中）`,
          sourceType: 'reward',
          createdAt: new Date().toISOString()
        },
        ...s.pointRecords
      ]
    }))

    return true
  },

  approveExchange: (id, approved, remark) =>
    set((state) => {
      const exchange = state.exchangeRecords.find((e) => e.id === id)
      if (!exchange || exchange.status !== 'pending') return state

      let updatedMembers = state.familyMembers
      let updatedRewards = state.rewards
      let extraRecords: PointRecord[] = []

      if (!approved) {
        // 驳回：退还积分、恢复库存和销量
        const member = state.familyMembers.find((m) => m.id === exchange.memberId)
        if (member) {
          const returnedBalance = member.points + exchange.points
          updatedMembers = updatedMembers.map((m) =>
            m.id === exchange.memberId ? { ...m, points: returnedBalance } : m
          )
          extraRecords.push({
            id: generateId(),
            memberId: exchange.memberId,
            type: 'reward',
            amount: exchange.points,
            balance: returnedBalance,
            description: `兑换${exchange.rewardName}被驳回，积分退还${remark ? '：' + remark : ''}`,
            sourceType: 'bonus',
            createdAt: new Date().toISOString(),
            operatorId: state.currentMemberId
          })
        }

        updatedRewards = updatedRewards.map((r) => {
          if (r.id === exchange.rewardId) {
            const newStock = r.stock + exchange.quantity
            const newSold = Math.max(0, r.sold - exchange.quantity)
            return {
              ...r,
              stock: newStock,
              sold: newSold,
              status: newStock > 0 && r.status === 'soldout' ? 'online' : r.status
            }
          }
          return r
        })
      }

      return {
        exchangeRecords: state.exchangeRecords.map((e) =>
          e.id === id
            ? {
                ...e,
                status: approved ? 'approved' : 'rejected',
                approvedAt: new Date().toISOString(),
                approvedBy: state.currentMemberId,
                remark
              }
            : e
        ),
        familyMembers: updatedMembers,
        rewards: updatedRewards,
        pointRecords: extraRecords.length > 0 ? [...extraRecords, ...state.pointRecords] : state.pointRecords
      }
    }),

  addGrowthRecord: (record) =>
    set((state) => ({
      growthRecords: [
        {
          id: generateId(),
          memberId: record.memberId || state.currentMemberId,
          title: record.title || '',
          description: record.description || '',
          photos: record.photos || [],
          milestone: record.milestone || false,
          milestoneType: record.milestoneType,
          createdAt: new Date().toISOString(),
          height: record.height,
          weight: record.weight
        },
        ...state.growthRecords
      ]
    })),

  addPromise: (promise) =>
    set((state) => ({
      promises: [
        {
          id: generateId(),
          title: promise.title || '',
          content: promise.content || '',
          signatories: promise.signatories || [],
          signatures: [],
          createdAt: new Date().toISOString(),
          status: 'pending'
        },
        ...state.promises
      ]
    })),

  signPromise: (id, memberId) =>
    set((state) => {
      const updated = state.promises.map((p) => {
        if (p.id === id) {
          const alreadySigned = p.signatures.some((s) => s.memberId === memberId)
          const newSignatures = alreadySigned
            ? p.signatures
            : [...p.signatures, { memberId, signedAt: new Date().toISOString() }]
          const allSigned = p.signatories.every((sid) =>
            newSignatures.some((s) => s.memberId === sid)
          )
          return {
            ...p,
            signatures: newSignatures,
            status: allSigned ? 'active' : 'pending'
          }
        }
        return p
      })
      return { promises: updated }
    }),

  addBlacklistWord: (word) =>
    set((state) => {
      if (state.blacklistWords.some((w) => w.word === word)) return state
      return {
        blacklistWords: [
          {
            id: generateId(),
            word,
            count: 0,
            createdAt: new Date().toISOString()
          },
          ...state.blacklistWords
        ]
      }
    }),

  removeBlacklistWord: (id) =>
    set((state) => ({
      blacklistWords: state.blacklistWords.filter((w) => w.id !== id)
    })),

  saveCurrentRule: (rule) =>
    set((state) => ({
      currentRule: {
        ...state.currentRule,
        ...rule
      }
    }))
}))
