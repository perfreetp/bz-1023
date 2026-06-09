import React, { useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';

const Index: React.FC = () => {
  useEffect(() => {
    const timer = setTimeout(() => {
      Taro.switchTab({ url: '/pages/home/index' });
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className={styles.container}>
      <View className={styles.card}>
        <Text className={styles.logo}>💝</Text>
        <Text className={styles.welcome}>育儿积分宝</Text>
        <Text className={styles.desc}>陪伴孩子成长每一天</Text>
        <View className={styles.loading}>
          <View className={styles.dot}></View>
          <View className={styles.dot}></View>
          <View className={styles.dot}></View>
        </View>
      </View>
    </View>
  );
};

export default Index;
