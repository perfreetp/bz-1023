import { PointRecord, MonthlyPoint } from '../types'

const today = new Date()
const formatDate = (d: Date) => d.toISOString()
const addDays = (d: Date, n: number) => {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

export const mockPointRecords: PointRecord[] = [
  {
    id: 'p1',
    memberId: 'c1',
    type: 'earn',
    amount: 15,
    balance: 368,
    description: '完成数学作业',
    sourceId: 't3',
    sourceType: 'task',
    createdAt: formatDate(today),
    operatorId: 'm1'
  },
  {
    id: 'p2',
    memberId: 'c1',
    type: 'bonus',
    amount: 30,
    balance: 353,
    description: '连续打卡7天奖励',
    sourceType: 'bonus',
    createdAt: formatDate(today)
  },
  {
    id: 'p3',
    memberId: 'c1',
    type: 'earn',
    amount: 12,
    balance: 323,
    description: '户外跑步1公里',
    sourceId: 't4',
    sourceType: 'task',
    createdAt: formatDate(addDays(today, -1)),
    operatorId: 'm2'
  },
  {
    id: 'p4',
    memberId: 'c1',
    type: 'reward',
    amount: 20,
    balance: 311,
    description: '主动帮助邻居老奶奶拎东西',
    sourceType: 'manual',
    createdAt: formatDate(addDays(today, -2)),
    operatorId: 'm1'
  },
  {
    id: 'p5',
    memberId: 'c1',
    type: 'deduct',
    amount: 10,
    balance: 291,
    description: '和妹妹吵架，态度不好',
    sourceType: 'punishment',
    createdAt: formatDate(addDays(today, -3)),
    operatorId: 'm2'
  },
  {
    id: 'p6',
    memberId: 'c1',
    type: 'earn',
    amount: 10,
    balance: 301,
    description: '每日阅读30分钟',
    sourceId: 't1',
    sourceType: 'task',
    createdAt: formatDate(addDays(today, -4)),
    operatorId: 'm1'
  },
  {
    id: 'p7',
    memberId: 'c2',
    type: 'earn',
    amount: 8,
    balance: 245,
    description: '整理自己的房间',
    sourceId: 't2',
    sourceType: 'task',
    createdAt: formatDate(addDays(today, -1)),
    operatorId: 'm2'
  },
  {
    id: 'p8',
    memberId: 'c2',
    type: 'earn',
    amount: 12,
    balance: 237,
    description: '户外跑步1公里',
    sourceId: 't4',
    sourceType: 'task',
    createdAt: formatDate(addDays(today, -1)),
    operatorId: 'm2'
  },
  {
    id: 'p9',
    memberId: 'c2',
    type: 'bonus',
    amount: 20,
    balance: 225,
    description: '连续打卡5天奖励',
    sourceType: 'bonus',
    createdAt: formatDate(addDays(today, -2))
  },
  {
    id: 'p10',
    memberId: 'c2',
    type: 'earn',
    amount: 10,
    balance: 205,
    description: '每日阅读30分钟',
    sourceId: 't1',
    sourceType: 'task',
    createdAt: formatDate(addDays(today, -3)),
    operatorId: 'm1'
  }
]

export const mockMonthlyPoints: MonthlyPoint[] = [
  { date: '12-01', earn: 85, spend: 30 },
  { date: '12-05', earn: 120, spend: 50 },
  { date: '12-10', earn: 95, spend: 80 },
  { date: '12-15', earn: 150, spend: 60 },
  { date: '12-20', earn: 110, spend: 100 },
  { date: '12-25', earn: 180, spend: 120 },
  { date: '12-30', earn: 145, spend: 90 },
  { date: '01-04', earn: 165, spend: 70 },
  { date: '01-09', earn: 130, spend: 110 }
]
