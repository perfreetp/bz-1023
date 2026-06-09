import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'
import { MonthlyPoint } from '../../types'

interface PointsChartProps {
  data: MonthlyPoint[]
}

const PointsChart: React.FC<PointsChartProps> = ({ data }) => {
  const width = 620
  const height = 240
  const padding = { top: 20, right: 10, bottom: 10, left: 10 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxValue = Math.max(
    ...data.flatMap((d) => [d.earn, d.spend]),
    100
  )
  const yMax = Math.ceil(maxValue / 50) * 50

  const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW

  const getX = (i: number) => padding.left + i * xStep
  const getY = (val: number) =>
    padding.top + chartH - (val / yMax) * chartH

  const earnPoints = data.map((d, i) => `${getX(i)},${getY(d.earn)}`).join(' ')
  const spendPoints = data.map((d, i) => `${getX(i)},${getY(d.spend)}`).join(' ')

  const earnArea = `${padding.left},${padding.top + chartH} ${earnPoints} ${padding.left + chartW},${padding.top + chartH}`
  const spendArea = `${padding.left},${padding.top + chartH} ${spendPoints} ${padding.left + chartW},${padding.top + chartH}`

  const gridLines = [0.25, 0.5, 0.75, 1].map((ratio) => padding.top + chartH * (1 - ratio))

  return (
    <View className={styles.wrapper}>
      <View className={styles.chart}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="earnGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6B8A" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#FF6B8A" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0" />
            </linearGradient>
          </defs>

          {gridLines.map((y, i) => (
            <line
              key={i}
              className={styles.gridLine}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartW}
              y2={y}
            />
          ))}

          <polygon className={styles.areaEarn} points={earnArea} />
          <polygon className={styles.areaSpend} points={spendArea} />

          <polyline className={styles.lineEarn} points={earnPoints} />
          <polyline className={styles.lineSpend} points={spendPoints} />

          {data.map((d, i) => (
            <React.Fragment key={i}>
              <circle
                className={`${styles.dot} ${styles.dotEarn}`}
                cx={getX(i)}
                cy={getY(d.earn)}
              />
              <circle
                className={`${styles.dot} ${styles.dotSpend}`}
                cx={getX(i)}
                cy={getY(d.spend)}
              />
            </React.Fragment>
          ))}
        </svg>
      </View>

      <View className={styles.xLabels}>
        {data.map((d, i) => (
          <Text key={i} className={styles.xLabel}>
            {d.date}
          </Text>
        ))}
      </View>

      <View className={styles.legend}>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.earnDot}`} />
          <Text>获得积分</Text>
        </View>
        <View className={styles.legendItem}>
          <View className={`${styles.legendDot} ${styles.spendDot}`} />
          <Text>消费积分</Text>
        </View>
      </View>
    </View>
  )
}

export default PointsChart
