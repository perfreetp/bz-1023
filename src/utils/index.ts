import dayjs from 'dayjs'

export const formatDate = (date: string | Date, format: string = 'YYYY-MM-DD') => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date, format: string = 'YYYY-MM-DD HH:mm') => {
  return dayjs(date).format(format)
}

export const formatRelative = (date: string | Date) => {
  const now = dayjs()
  const target = dayjs(date)
  const diffMinutes = now.diff(target, 'minute')
  const diffHours = now.diff(target, 'hour')
  const diffDays = now.diff(target, 'day')

  if (diffMinutes < 1) return '刚刚'
  if (diffMinutes < 60) return `${diffMinutes}分钟前`
  if (diffHours < 24) return `${diffHours}小时前`
  if (diffDays < 7) return `${diffDays}天前`
  return formatDate(date)
}

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const taskTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  reading: { label: '阅读', color: '#54A0FF', bgColor: '#E8F4FF' },
  tidying: { label: '整理', color: '#5F27CD', bgColor: '#F0E8FF' },
  exercise: { label: '运动', color: '#10AC84', bgColor: '#E5F8F2' },
  homework: { label: '作业', color: '#FF9F43', bgColor: '#FFF4E5' },
  other: { label: '其他', color: '#636E72', bgColor: '#F0F2F5' }
}

export const taskStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: '待完成', color: '#FF9F43' },
  checking: { label: '待审核', color: '#54A0FF' },
  done: { label: '已完成', color: '#00B894' },
  rejected: { label: '已驳回', color: '#FF6B6B' }
}

export const pointTypeConfig: Record<string, { label: string; color: string; prefix: string }> = {
  earn: { label: '完成任务', color: '#00B894', prefix: '+' },
  bonus: { label: '连续奖励', color: '#FFD93D', prefix: '+' },
  reward: { label: '临时奖励', color: '#FF9F43', prefix: '+' },
  deduct: { label: '扣除', color: '#FF6B6B', prefix: '-' }
}

export const validateBlacklistWords = (text: string, words: string[]) => {
  const found: string[] = []
  words.forEach(word => {
    if (text.includes(word)) found.push(word)
  })
  return found
}

export const calculateStreakBonus = (streak: number, basePoints: number, bonusDays: number, bonusPoints: number) => {
  if (streak > 0 && streak % bonusDays === 0) {
    return bonusPoints
  }
  return 0
}

export const splitPointsEqually = (totalPoints: number, members: number) => {
  const base = Math.floor(totalPoints / members)
  const remainder = totalPoints % members
  return members > 0 
    ? Array(members).fill(base).map((v, i) => i < remainder ? v + 1 : v)
    : []
}
