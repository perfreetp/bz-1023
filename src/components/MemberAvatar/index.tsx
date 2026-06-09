import React from 'react'
import { View, Text, Image } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import { FamilyMember } from '../../types'

interface MemberAvatarProps {
  member: FamilyMember
  size?: 'sm' | 'md' | 'lg'
  showInfo?: boolean
  showSub?: string
}

const MemberAvatar: React.FC<MemberAvatarProps> = ({
  member,
  size = 'md',
  showInfo = false,
  showSub
}) => {
  return (
    <View className={styles.wrapper}>
      <View
        className={classnames(styles.avatar, styles[size])}
        style={{ borderColor: member.color }}
      >
        <Image className={styles.image} src={member.avatar} mode="aspectFill" />
      </View>
      {showInfo && (
        <View className={styles.info}>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Text className={styles.name}>{member.name}</Text>
            <Text
              className={classnames(
                styles.roleBadge,
                member.role === 'parent' ? styles.parentBadge : styles.childBadge
              )}
            >
              {member.role === 'parent' ? '家长' : '孩子'}
            </Text>
          </View>
          {(showSub || member.role === 'child') && (
            <Text className={styles.sub}>
              {showSub || `积分 ${member.points} · 连续${member.streak}天`}
            </Text>
          )}
        </View>
      )}
    </View>
  )
}

export default MemberAvatar
