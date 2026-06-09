import { Reward, ExchangeRecord } from '../types'

const today = new Date()
const formatDate = (d: Date) => d.toISOString()
const addDays = (d: Date, n: number) => {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

export const mockRewards: Reward[] = [
  {
    id: 'r1',
    name: '乐高积木套装',
    description: '经典创意系列，500+颗粒，锻炼动手能力',
    image: 'https://picsum.photos/id/201/600/600',
    price: 500,
    originalPrice: 600,
    stock: 3,
    sold: 5,
    category: '玩具',
    status: 'online',
    needApproval: true,
    createdAt: formatDate(addDays(today, -30))
  },
  {
    id: 'r2',
    name: '周末游乐园',
    description: '一家三口周末游乐园门票+午餐',
    image: 'https://picsum.photos/id/250/600/600',
    price: 800,
    stock: 2,
    sold: 1,
    category: '体验',
    status: 'online',
    needApproval: true,
    createdAt: formatDate(addDays(today, -20))
  },
  {
    id: 'r3',
    name: '课外读物一本',
    description: '任选一本适龄课外读物，京东自营',
    image: 'https://picsum.photos/id/24/600/600',
    price: 100,
    originalPrice: 120,
    stock: 99,
    sold: 12,
    category: '图书',
    status: 'online',
    needApproval: false,
    createdAt: formatDate(addDays(today, -45))
  },
  {
    id: 'r4',
    name: '冰淇淋套餐',
    description: '哈根达斯双球冰淇淋+小蛋糕一份',
    image: 'https://picsum.photos/id/292/600/600',
    price: 80,
    stock: 50,
    sold: 28,
    category: '美食',
    status: 'online',
    needApproval: false,
    createdAt: formatDate(addDays(today, -15))
  },
  {
    id: 'r5',
    name: '新球鞋一双',
    description: '品牌运动鞋，任选款式，500元以内',
    image: 'https://picsum.photos/id/21/600/600',
    price: 600,
    originalPrice: 700,
    stock: 0,
    sold: 3,
    category: '服饰',
    status: 'soldout',
    needApproval: true,
    createdAt: formatDate(addDays(today, -60))
  },
  {
    id: 'r6',
    name: '电影票2张',
    description: '任选院线电影，IMAX除外',
    image: 'https://picsum.photos/id/431/600/600',
    price: 150,
    stock: 20,
    sold: 8,
    category: '体验',
    status: 'online',
    needApproval: true,
    createdAt: formatDate(addDays(today, -10))
  },
  {
    id: 'r7',
    name: '延迟睡觉1小时',
    description: '周末可以比平时晚睡1小时',
    image: 'https://picsum.photos/id/62/600/600',
    price: 50,
    stock: 999,
    sold: 45,
    category: '特权',
    status: 'online',
    needApproval: true,
    createdAt: formatDate(addDays(today, -5))
  },
  {
    id: 'r8',
    name: '精美文具套装',
    description: '笔袋+钢笔+彩铅+笔记本组合',
    image: 'https://picsum.photos/id/119/600/600',
    price: 120,
    originalPrice: 150,
    stock: 8,
    sold: 6,
    category: '文具',
    status: 'online',
    needApproval: false,
    createdAt: formatDate(addDays(today, -25))
  }
]

export const mockExchangeRecords: ExchangeRecord[] = [
  {
    id: 'e1',
    rewardId: 'r3',
    rewardName: '课外读物一本',
    rewardImage: 'https://picsum.photos/id/24/600/600',
    memberId: 'c1',
    memberName: '小明',
    points: 100,
    quantity: 1,
    status: 'delivered',
    createdAt: formatDate(addDays(today, -5)),
    approvedAt: formatDate(addDays(today, -5)),
    approvedBy: 'm1'
  },
  {
    id: 'e2',
    rewardId: 'r4',
    rewardName: '冰淇淋套餐',
    rewardImage: 'https://picsum.photos/id/292/600/600',
    memberId: 'c2',
    memberName: '小红',
    points: 80,
    quantity: 1,
    status: 'approved',
    createdAt: formatDate(addDays(today, -2)),
    approvedAt: formatDate(addDays(today, -2)),
    approvedBy: 'm2'
  },
  {
    id: 'e3',
    rewardId: 'r6',
    rewardName: '电影票2张',
    rewardImage: 'https://picsum.photos/id/431/600/600',
    memberId: 'c1',
    memberName: '小明',
    points: 150,
    quantity: 1,
    status: 'pending',
    createdAt: formatDate(today)
  },
  {
    id: 'e4',
    rewardId: 'r7',
    rewardName: '延迟睡觉1小时',
    rewardImage: 'https://picsum.photos/id/62/600/600',
    memberId: 'c2',
    memberName: '小红',
    points: 50,
    quantity: 1,
    status: 'pending',
    createdAt: formatDate(addDays(today, -1))
  }
]
