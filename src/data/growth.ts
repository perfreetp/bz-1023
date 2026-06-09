import { GrowthRecord, RuleTemplate, PromiseItem, BlacklistWord } from '../types'

const today = new Date()
const formatDate = (d: Date) => d.toISOString()
const addDays = (d: Date, n: number) => {
  const nd = new Date(d)
  nd.setDate(nd.getDate() + n)
  return nd
}

export const mockGrowthRecords: GrowthRecord[] = [
  {
    id: 'g1',
    memberId: 'c1',
    title: '第一次独立阅读',
    description: '今天小明第一次完整地独立读完了一本绘本《猜猜我有多爱你》，还能讲给妹妹听，真棒！',
    photos: [
      'https://picsum.photos/id/24/600/400',
      'https://picsum.photos/id/106/600/400'
    ],
    milestone: true,
    milestoneType: '阅读启蒙',
    createdAt: formatDate(addDays(today, -2)),
    height: 128,
    weight: 26.5
  },
  {
    id: 'g2',
    memberId: 'c1',
    title: '数学小测验满分',
    description: '这周数学小测得了满分100分，全班只有3个小朋友，值得记录！',
    photos: ['https://picsum.photos/id/119/600/400'],
    milestone: false,
    createdAt: formatDate(addDays(today, -5))
  },
  {
    id: 'g3',
    memberId: 'c2',
    title: '学会了骑自行车',
    description: '小红终于学会了骑自行车！从辅助轮到摘掉只用了3天，平衡感超棒！',
    photos: [
      'https://picsum.photos/id/1036/600/400',
      'https://picsum.photos/id/1018/600/400'
    ],
    milestone: true,
    milestoneType: '运动技能',
    createdAt: formatDate(addDays(today, -10)),
    height: 115,
    weight: 20.3
  },
  {
    id: 'g4',
    memberId: 'c1',
    title: '周末郊游',
    description: '全家去森林公园野餐，小明认识了好多种植物和昆虫',
    photos: [
      'https://picsum.photos/id/1015/600/400',
      'https://picsum.photos/id/1018/600/400',
      'https://picsum.photos/id/1039/600/400'
    ],
    milestone: false,
    createdAt: formatDate(addDays(today, -15))
  },
  {
    id: 'g5',
    memberId: 'c2',
    title: '第一次上台表演',
    description: '小红在学校元旦晚会上表演了舞蹈《小天鹅》，一点也不紧张！',
    photos: ['https://picsum.photos/id/225/600/400'],
    milestone: true,
    milestoneType: '勇气时刻',
    createdAt: formatDate(addDays(today, -20))
  },
  {
    id: 'g6',
    memberId: 'c1',
    title: '生日派对',
    description: '小明8岁生日，邀请了全班好朋友来家里庆祝，超级开心！',
    photos: [
      'https://picsum.photos/id/312/600/400',
      'https://picsum.photos/id/326/600/400'
    ],
    milestone: true,
    milestoneType: '生日',
    createdAt: formatDate(addDays(today, -45)),
    height: 126,
    weight: 25.8
  }
]

export const mockRuleTemplates: RuleTemplate[] = [
  {
    id: 'rt1',
    name: '小学生标准模板',
    description: '适合6-12岁小学生的通用任务积分规则',
    preset: true,
    content: [
      { key: 'readingPoints', label: '阅读任务基础分', value: 10 },
      { key: 'homeworkPoints', label: '作业任务基础分', value: 15 },
      { key: 'exercisePoints', label: '运动任务基础分', value: 12 },
      { key: 'tidyingPoints', label: '整理任务基础分', value: 8 },
      { key: 'bonusDays', label: '连续打卡奖励周期(天)', value: 7 },
      { key: 'bonusMultiplier', label: '连续奖励倍数', value: 3 }
    ]
  },
  {
    id: 'rt2',
    name: '学龄前轻松模板',
    description: '适合3-6岁学龄前儿童，以鼓励为主',
    preset: true,
    content: [
      { key: 'readingPoints', label: '阅读任务基础分', value: 5 },
      { key: 'homeworkPoints', label: '学习任务基础分', value: 8 },
      { key: 'exercisePoints', label: '运动任务基础分', value: 5 },
      { key: 'tidyingPoints', label: '整理任务基础分', value: 5 },
      { key: 'bonusDays', label: '连续打卡奖励周期(天)', value: 5 },
      { key: 'bonusMultiplier', label: '连续奖励倍数', value: 2 }
    ]
  },
  {
    id: 'rt3',
    name: '严格要求模板',
    description: '适合自律性培养阶段，任务分值更高',
    preset: true,
    content: [
      { key: 'readingPoints', label: '阅读任务基础分', value: 15 },
      { key: 'homeworkPoints', label: '作业任务基础分', value: 25 },
      { key: 'exercisePoints', label: '运动任务基础分', value: 18 },
      { key: 'tidyingPoints', label: '整理任务基础分', value: 10 },
      { key: 'bonusDays', label: '连续打卡奖励周期(天)', value: 10 },
      { key: 'bonusMultiplier', label: '连续奖励倍数', value: 5 }
    ]
  }
]

export const mockPromises: PromiseItem[] = [
  {
    id: 'pr1',
    title: '学习时间约定',
    content: '1. 放学后先完成作业再玩耍\n2. 每天阅读至少30分钟\n3. 字迹工整，按时交作业\n4. 遇到不会的题目主动问爸妈',
    signatories: ['m1', 'm2', 'c1'],
    signatures: [
      { memberId: 'm1', signedAt: formatDate(addDays(today, -10)) },
      { memberId: 'm2', signedAt: formatDate(addDays(today, -10)) },
      { memberId: 'c1', signedAt: formatDate(addDays(today, -10)) }
    ],
    createdAt: formatDate(addDays(today, -10)),
    status: 'active'
  },
  {
    id: 'pr2',
    title: '电子产品使用约定',
    content: '1. 周内不看动画片\n2. 周末每天看电视不超过1小时\n3. 每次使用平板需经爸妈同意\n4. 睡觉前1小时不碰电子设备',
    signatories: ['m1', 'm2', 'c1', 'c2'],
    signatures: [
      { memberId: 'm1', signedAt: formatDate(addDays(today, -8)) },
      { memberId: 'm2', signedAt: formatDate(addDays(today, -8)) },
      { memberId: 'c2', signedAt: formatDate(addDays(today, -7)) }
    ],
    createdAt: formatDate(addDays(today, -8)),
    status: 'pending'
  },
  {
    id: 'pr3',
    title: '兄弟姐妹相处约定',
    content: '1. 不打架，有问题好好说\n2. 玩具轮流玩，学会分享\n3. 哥哥要照顾妹妹\n4. 妹妹要尊重哥哥',
    signatories: ['c1', 'c2'],
    signatures: [
      { memberId: 'c1', signedAt: formatDate(addDays(today, -5)) },
      { memberId: 'c2', signedAt: formatDate(addDays(today, -5)) }
    ],
    createdAt: formatDate(addDays(today, -5)),
    status: 'active'
  }
]

export const mockBlacklistWords: BlacklistWord[] = [
  { id: 'b1', word: '笨蛋', count: 3, createdAt: formatDate(addDays(today, -15)) },
  { id: 'b2', word: '讨厌', count: 5, createdAt: formatDate(addDays(today, -20)) },
  { id: 'b3', word: '打死你', count: 1, createdAt: formatDate(addDays(today, -25)) },
  { id: 'b4', word: '我不要', count: 8, createdAt: formatDate(addDays(today, -30)) }
]
