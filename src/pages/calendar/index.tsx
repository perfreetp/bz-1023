import React, { useState, useMemo } from 'react'
import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import styles from './index.module.scss'
import { useAppStore } from '../../store/useAppStore'
import { taskTypeConfig, taskStatusConfig, formatDate } from '../../utils'
import dayjs from 'dayjs'
import weekOfYear from 'dayjs/plugin/weekOfYear'

dayjs.extend(weekOfYear)

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

const memberBirthdays: Record<string, string> = {
  m1: '06-15',
  m2: '08-20',
  c1: '03-10',
  c2: '11-25'
}

const fixedHolidays: Record<string, { name: string; color: string }> = {
  '01-01': { name: '元旦', color: '#FF6B8A' },
  '02-14': { name: '情人节', color: '#FF6B8A' },
  '03-08': { name: '妇女节', color: '#FF6B8A' },
  '05-01': { name: '劳动节', color: '#54A0FF' },
  '06-01': { name: '儿童节', color: '#FFD93D' },
  '09-10': { name: '教师节', color: '#54A0FF' },
  '10-01': { name: '国庆节', color: '#FF6B6B' },
  '12-25': { name: '圣诞节', color: '#00B894' }
}

const CalendarPage: React.FC = () => {
  const { tasks, familyMembers, currentMemberId } = useAppStore()

  const today = dayjs()
  const [currentMonth, setCurrentMonth] = useState(today.startOf('month'))
  const [selectedDate, setSelectedDate] = useState(today)

  const calendarDays = useMemo(() => {
    const startDay = currentMonth.startOf('month').startOf('week')
    const days: { date: typeof dayjs.prototype; isCurrentMonth: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const d = startDay.add(i, 'day')
      days.push({
        date: d,
        isCurrentMonth: d.month() === currentMonth.month()
      })
    }
    return days
  }, [currentMonth])

  const dateTaskMap = useMemo(() => {
    const map: Record<string, typeof tasks> = {}
    tasks.forEach((task) => {
      const start = dayjs(task.createdAt).startOf('day')
      const end = dayjs(task.deadline).endOf('day')
      let cursor = start
      while (cursor.isBefore(end) || cursor.isSame(end, 'day')) {
        const key = cursor.format('YYYY-MM-DD')
        if (!map[key]) map[key] = []
        if (!map[key].includes(task)) {
          map[key].push(task)
        }
        cursor = cursor.add(1, 'day')
      }
    })
    return map
  }, [tasks])

  const dateBirthdayMap = useMemo(() => {
    const map: Record<string, { name: string; color: string }[]> = {}
    familyMembers.forEach((m) => {
      const birthday = memberBirthdays[m.id]
      if (birthday) {
        const [month, day] = birthday.split('-')
        const year = currentMonth.year()
        const dateStr = `${year}-${month}-${day}`
        if (!map[dateStr]) map[dateStr] = []
        map[dateStr].push({ name: `${m.name}的生日`, color: m.color })
      }
    })
    return map
  }, [familyMembers, currentMonth])

  const dateHolidayMap = useMemo(() => {
    const map: Record<string, { name: string; color: string }> = {}
    Object.entries(fixedHolidays).forEach(([md, info]) => {
      const [month, day] = md.split('-')
      const year = currentMonth.year()
      const dateStr = `${year}-${month}-${day}`
      map[dateStr] = info
    })
    return map
  }, [currentMonth])

  const selectedDateStr = selectedDate.format('YYYY-MM-DD')
  const selectedTasks = dateTaskMap[selectedDateStr] || []
  const selectedBirthdays = dateBirthdayMap[selectedDateStr] || []
  const selectedHoliday = dateHolidayMap[selectedDateStr]

  const monthStats = useMemo(() => {
    const monthStart = currentMonth.startOf('month')
    const monthEnd = currentMonth.endOf('month')
    let doneCount = 0
    let earnedPoints = 0
    const doneTasks = tasks.filter((t) => {
      if (t.status !== 'done') return false
      const checked = t.checkedAt ? dayjs(t.checkedAt) : null
      if (!checked) return false
      return checked.isAfter(monthStart.subtract(1, 'day')) && checked.isBefore(monthEnd.add(1, 'day'))
    })
    doneCount = doneTasks.length
    doneTasks.forEach((t) => {
      earnedPoints += t.points
      const assignees = familyMembers.filter((m) => t.assignedTo.includes(m.id) && m.role === 'child')
      assignees.forEach((m) => {
        if (m.streak > 0 && m.streak % t.bonusDays === 0) {
          earnedPoints += t.bonusPoints
        }
      })
    })
    const currentMember = familyMembers.find((m) => m.id === currentMemberId)
    const streak = currentMember ? currentMember.streak : 0
    return { doneCount, earnedPoints, streak }
  }, [tasks, familyMembers, currentMemberId, currentMonth])

  const prevMonth = () => {
    setCurrentMonth(currentMonth.subtract(1, 'month'))
  }

  const nextMonth = () => {
    setCurrentMonth(currentMonth.add(1, 'month'))
  }

  const goToday = () => {
    setCurrentMonth(today.startOf('month'))
    setSelectedDate(today)
  }

  const goTaskDetail = (taskId: string) => {
    Taro.navigateTo({ url: `/pages/task-detail/index?taskId=${taskId}` })
  }

  const renderTaskDots = (dateStr: string) => {
    const dayTasks = dateTaskMap[dateStr] || []
    if (dayTasks.length === 0) return null
    const statuses = Array.from(new Set(dayTasks.map((t) => t.status))).slice(0, 4)
    return (
      <View className={styles.taskDots}>
        {statuses.map((status) => (
          <View
            key={status}
            className={styles.taskDot}
            style={{ background: taskStatusConfig[status].color }}
          />
        ))}
      </View>
    )
  }

  const renderBirthdayMark = (dateStr: string) => {
    const birthdays = dateBirthdayMap[dateStr]
    if (!birthdays || birthdays.length === 0) return null
    return (
      <View
        className={styles.birthdayMark}
        style={{ background: birthdays[0].color }}
      />
    )
  }

  return (
    <ScrollView className="page-container" scrollY enableBackToTop>
      <View className={styles.calendarHeader}>
        <View className={styles.navBtn} onClick={prevMonth}>
          <Text>‹</Text>
        </View>
        <View className={styles.monthTitle} onClick={goToday}>
          {currentMonth.format('YYYY年M月')}
        </View>
        <View className={styles.navBtn} onClick={nextMonth}>
          <Text>›</Text>
        </View>
      </View>

      <View className={styles.weekRow}>
        {WEEK_DAYS.map((day, idx) => (
          <View
            key={day}
            className={classnames(styles.weekDay, (idx === 0 || idx === 6) && styles.weekend)}
          >
            {day}
          </View>
        ))}
      </View>

      <View className={styles.calendarGrid}>
        {calendarDays.map(({ date, isCurrentMonth }) => {
          const dateStr = date.format('YYYY-MM-DD')
          const isToday = date.isSame(today, 'day')
          const isSelected = date.isSame(selectedDate, 'day')

          return (
            <View
              key={dateStr}
              className={classnames(styles.dateCell, !isCurrentMonth && styles.otherMonth)}
              onClick={() => setSelectedDate(date)}
            >
              {isSelected && <View className={styles.selectedMark} />}
              {isToday && !isSelected && <View className={styles.todayMark} />}
              {renderBirthdayMark(dateStr)}
              <Text className={styles.dateNum}>{date.date()}</Text>
              {renderTaskDots(dateStr)}
            </View>
          )
        })}
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statItem}>
          <View className={styles.statValue}>{monthStats.doneCount}</View>
          <View className={styles.statLabel}>本月完成</View>
        </View>
        <View className={styles.statItem}>
          <View className={styles.statValue}>{monthStats.earnedPoints}</View>
          <View className={styles.statLabel}>获得积分</View>
        </View>
        <View className={styles.statItem}>
          <View className={styles.statValue}>{monthStats.streak}</View>
          <View className={styles.statLabel}>连续打卡</View>
        </View>
      </View>

      <View className={styles.selectedDateTitle}>
        {selectedDate.format('MM月DD日 dddd')}
      </View>

      {selectedHoliday && (
        <View
          className={styles.birthdayBadge}
          style={{ background: `${selectedHoliday.color}20`, color: selectedHoliday.color }}
        >
          🎉 {selectedHoliday.name}
        </View>
      )}

      {selectedBirthdays.length > 0 && (
        <View className={styles.birthdayBadge}>
          🎂 {selectedBirthdays.map((b) => b.name).join('、')}
        </View>
      )}

      <View className={styles.taskList}>
        {selectedTasks.length === 0 ? (
          <View className={styles.emptyTasks}>当天没有任务安排</View>
        ) : (
          selectedTasks.map((task) => {
            const typeConf = taskTypeConfig[task.type]
            const statusConf = taskStatusConfig[task.status]
            const assignees = familyMembers.filter((m) => task.assignedTo.includes(m.id))
            return (
              <View
                key={task.id}
                className={styles.taskCard}
                onClick={() => goTaskDetail(task.id)}
              >
                <View className={styles.taskCardHeader}>
                  <View
                    className={styles.typeTag}
                    style={{ background: typeConf.bgColor, color: typeConf.color }}
                  >
                    {typeConf.label}
                  </View>
                  <View
                    className={styles.statusBadge}
                    style={{ color: statusConf.color, background: `${statusConf.color}15` }}
                  >
                    {statusConf.label}
                  </View>
                </View>
                <View className={styles.taskCardTitle}>{task.title}</View>
                <View className={styles.taskCardFooter}>
                  <View className={styles.assigneeAvatars}>
                    {assignees.map((a) => (
                      <Image
                        key={a.id}
                        className={styles.assigneeAvatar}
                        src={a.avatar}
                        mode="aspectFill"
                      />
                    ))}
                  </View>
                  <View className={styles.pointsBadge}>
                    ⭐<Text className={styles.pointsNum}>{task.points}</Text>
                  </View>
                </View>
              </View>
            )
          })
        )}
      </View>
    </ScrollView>
  )
}

export default CalendarPage
