import { Task } from '../types'

const today = new Date()
const formatDate = (d: Date) => d.toISOString().split('T')[0]
const addDays = (d: Date, n: number) => {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

export const mockTasks: Task[] = [
  {
    id: 't1',
    title: '每日阅读30分钟',
    type: 'reading',
    description: '读课外书或绘本，至少30分钟，并能复述故事内容',
    points: 10,
    bonusPoints: 30,
    bonusDays: 7,
    deadline: formatDate(addDays(today, 1)),
    reminder: '19:00',
    createdAt: formatDate(today),
    assignedTo: ['c1', 'c2'],
    status: 'pending',
    photo: undefined
  },
  {
    id: 't2',
    title: '整理自己的房间',
    type: 'tidying',
    description: '收拾玩具、整理床铺、擦拭桌面',
    points: 8,
    bonusPoints: 24,
    bonusDays: 7,
    deadline: formatDate(addDays(today, 1)),
    reminder: '20:00',
    createdAt: formatDate(today),
    assignedTo: ['c1'],
    status: 'checking',
    photo: 'https://picsum.photos/id/582/600/400'
  },
  {
    id: 't3',
    title: '完成数学作业',
    type: 'homework',
    description: '课本第15-17页，全部做完并检查',
    points: 15,
    bonusPoints: 50,
    bonusDays: 5,
    deadline: formatDate(addDays(today, 1)),
    reminder: '18:30',
    createdAt: formatDate(today),
    assignedTo: ['c1'],
    status: 'done',
    checkedAt: formatDate(today),
    checkedBy: 'm1',
    remark: '全部正确，字迹工整！'
  },
  {
    id: 't4',
    title: '户外跑步1公里',
    type: 'exercise',
    description: '在小区或公园慢跑，注意安全',
    points: 12,
    bonusPoints: 40,
    bonusDays: 7,
    deadline: formatDate(addDays(today, 1)),
    reminder: '17:00',
    createdAt: formatDate(today),
    assignedTo: ['c1', 'c2'],
    status: 'done',
    checkedAt: formatDate(today),
    checkedBy: 'm2'
  },
  {
    id: 't5',
    title: '练习书法',
    type: 'other',
    description: '练习楷书2页，注意笔顺和结构',
    points: 10,
    bonusPoints: 20,
    bonusDays: 10,
    deadline: formatDate(addDays(today, 1)),
    reminder: '20:30',
    createdAt: formatDate(today),
    assignedTo: ['c2'],
    status: 'rejected',
    remark: '字太潦草，请重新认真写',
    photo: 'https://picsum.photos/id/3/600/400'
  },
  {
    id: 't6',
    title: '帮妈妈洗碗',
    type: 'other',
    description: '晚饭后把餐具洗干净并摆放好',
    points: 5,
    bonusPoints: 15,
    bonusDays: 10,
    deadline: formatDate(addDays(today, 1)),
    reminder: '19:30',
    createdAt: formatDate(today),
    assignedTo: ['c2'],
    status: 'pending'
  },
  {
    id: 't7',
    title: '背唐诗3首',
    type: 'reading',
    description: '背诵并默写《静夜思》《春晓》《登鹳雀楼》',
    points: 12,
    bonusPoints: 36,
    bonusDays: 7,
    deadline: formatDate(addDays(today, 2)),
    reminder: '19:00',
    createdAt: formatDate(addDays(today, -1)),
    assignedTo: ['c1', 'c2'],
    status: 'pending'
  },
  {
    id: 't8',
    title: '跳绳200个',
    type: 'exercise',
    description: '分组完成，每组50个，休息30秒',
    points: 8,
    bonusPoints: 24,
    bonusDays: 7,
    deadline: formatDate(addDays(today, 1)),
    reminder: '17:30',
    createdAt: formatDate(today),
    assignedTo: ['c1', 'c2'],
    status: 'pending'
  }
]
