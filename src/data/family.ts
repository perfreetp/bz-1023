import { FamilyMember } from '../types'

export const mockFamilyMembers: FamilyMember[] = [
  {
    id: 'm1',
    name: '爸爸',
    avatar: 'https://picsum.photos/id/64/200/200',
    role: 'parent',
    points: 0,
    streak: 0,
    color: '#54A0FF'
  },
  {
    id: 'm2',
    name: '妈妈',
    avatar: 'https://picsum.photos/id/177/200/200',
    role: 'parent',
    points: 0,
    streak: 0,
    color: '#FF6B8A'
  },
  {
    id: 'c1',
    name: '小明',
    avatar: 'https://picsum.photos/id/338/200/200',
    role: 'child',
    points: 368,
    streak: 7,
    color: '#4ECDC4'
  },
  {
    id: 'c2',
    name: '小红',
    avatar: 'https://picsum.photos/id/1027/200/200',
    role: 'child',
    points: 245,
    streak: 5,
    color: '#FFD93D'
  }
]
