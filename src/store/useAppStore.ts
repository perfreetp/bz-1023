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

interface AppState {
  currentMemberId: string
  currentRole: 'parent' | 'child'
  familyMembers: FamilyMember[]
  tasks: Task[]
  pointRecords: PointRecord[]
  monthlyPoints: typeof mockMonthlyPoints
  rewards: Reward[]
  exchangeRecords: ExchangeRecord[]
  growthRecords: GrowthRecord[]
  ruleTemplates: RuleTemplate[]
  promises: PromiseItem[]
  blacklistWords: BlacklistWord[]

  setCurrentMember: (id: string) => void
  switchRole: () => void

  addTask: (task: Partial<Task>) => void
  updateTaskStatus: (id: string, status: TaskStatus, remark?: string) => void
  submitTaskPhoto: (id: string, photo: string) => void

  addPointRecord: (record: Partial<PointRecord>) => void
  adjustPoints: (memberId: string, amount: number, description: string, type: 'earn' | 'deduct' | 'reward' | 'bonus') => void

  createExchange: (rewardId: string, memberId: string, quantity?: number) => boolean
  approveExchange: (id: string, approved: boolean, remark?: string) => void

  addGrowthRecord: (record: Partial<GrowthRecord>) => void
  addPromise: (promise: Partial<PromiseItem>) => void
  signPromise: (id: string, memberId: string) => void
  addBlacklistWord: (word: string) => void
  removeBlacklistWord: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentMemberId: 'c1',
  currentRole: 'parent',
  familyMembers: mockFamilyMembers,
  tasks: mockTasks,
  pointRecords: mockPointRecords,
  monthlyPoints: mockMonthlyPoints,
  rewards: mockRewards,
  exchangeRecords: mockExchangeRecords,
  growthRecords: mockGrowthRecords,
  ruleTemplates: mockRuleTemplates,
  promises: mockPromises,
  blacklistWords: mockBlacklistWords,

  setCurrentMember: (id) => set({ currentMemberId: id }),
  switchRole: () =>
    set((state) => ({
      currentRole: state.currentRole === 'parent' ? 'child' : 'parent'
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [
        {
          id: generateId(),
          title: task.title || '',
          type: (task.type as TaskType) || 'other',
          description: task.description || '',
          points: task.points || 10,
          bonusPoints: task.bonusPoints || 0,
          bonusDays: task.bonusDays || 7,
          deadline: task.deadline || new Date().toISOString(),
          reminder: task.reminder || '',
          createdAt: new Date().toISOString(),
          assignedTo: task.assignedTo || [],
          status: 'pending'
        },
        ...state.tasks
      ]
    })),

  updateTaskStatus: (id, status, remark) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (!task) return state

      const updatedTasks = state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              remark,
              checkedAt: new Date().toISOString(),
              checkedBy: state.currentMemberId
            }
          : t
      )

      if (status === 'done') {
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

        return {
          tasks: updatedTasks,
          familyMembers: updatedMembers,
          pointRecords: [...newRecords, ...state.pointRecords]
        }
      }

      return { tasks: updatedTasks }
    }),

  submitTaskPhoto: (id, photo) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status: 'checking' as TaskStatus, photo } : t
      )
    })),

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
          description: `兑换${reward.name}`,
          sourceType: 'reward',
          createdAt: new Date().toISOString()
        },
        ...s.pointRecords
      ]
    }))

    return true
  },

  approveExchange: (id, approved, remark) =>
    set((state) => ({
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
      familyMembers: approved
        ? state.familyMembers
        : state.familyMembers.map((m) => {
            const exchange = state.exchangeRecords.find((e) => e.id === id)
            if (exchange && exchange.memberId === m.id) {
              return { ...m, points: m.points + exchange.points }
            }
            return m
          })
    })),

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
    }))
}))
