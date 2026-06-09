export type TaskType = 'reading' | 'tidying' | 'exercise' | 'homework' | 'other'
export type TaskStatus = 'pending' | 'checking' | 'done' | 'rejected'
export type PointType = 'reward' | 'earn' | 'deduct' | 'bonus'
export type RewardStatus = 'online' | 'offline' | 'soldout'
export type ExchangeStatus = 'pending' | 'approved' | 'rejected' | 'delivered'
export type MemberRole = 'parent' | 'child'

export interface FamilyMember {
  id: string
  name: string
  avatar: string
  role: MemberRole
  points: number
  streak: number
  color: string
}

export interface Task {
  id: string
  title: string
  type: TaskType
  description: string
  points: number
  bonusPoints: number
  bonusDays: number
  deadline: string
  reminder: string
  createdAt: string
  assignedTo: string[]
  status: TaskStatus
  photo?: string
  checkedAt?: string
  checkedBy?: string
  remark?: string
}

export interface PointRecord {
  id: string
  memberId: string
  type: PointType
  amount: number
  balance: number
  description: string
  sourceId?: string
  sourceType?: 'task' | 'reward' | 'bonus' | 'punishment' | 'manual'
  createdAt: string
  operatorId?: string
}

export interface Reward {
  id: string
  name: string
  description: string
  image: string
  price: number
  originalPrice?: number
  stock: number
  sold: number
  category: string
  status: RewardStatus
  needApproval: boolean
  createdAt: string
}

export interface ExchangeRecord {
  id: string
  rewardId: string
  rewardName: string
  rewardImage: string
  memberId: string
  memberName: string
  points: number
  quantity: number
  status: ExchangeStatus
  createdAt: string
  approvedAt?: string
  approvedBy?: string
  remark?: string
}

export interface GrowthRecord {
  id: string
  memberId: string
  title: string
  description: string
  photos: string[]
  milestone: boolean
  milestoneType?: string
  createdAt: string
  height?: number
  weight?: number
}

export interface RuleTemplate {
  id: string
  name: string
  description: string
  content: {
    key: string
    label: string
    value: number | string | boolean
  }[]
  preset: boolean
}

export interface PromiseItem {
  id: string
  title: string
  content: string
  signatories: string[]
  signatures: { memberId: string; signedAt: string }[]
  createdAt: string
  status: 'pending' | 'active' | 'broken'
}

export interface BlacklistWord {
  id: string
  word: string
  count: number
  createdAt: string
}

export interface MonthlyPoint {
  date: string
  earn: number
  spend: number
}

export type CalendarTask = {
  date: string
  tasks: {
    id: string
    title: string
    status: TaskStatus
  }[]
}
