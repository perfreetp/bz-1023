export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/points/index',
    'pages/mall/index',
    'pages/growth/index',
    'pages/mine/index',
    'pages/task-publish/index',
    'pages/task-detail/index',
    'pages/points-detail/index',
    'pages/reward-detail/index',
    'pages/reward-approval/index',
    'pages/album/index',
    'pages/calendar/index',
    'pages/family/index',
    'pages/child-profile/index',
    'pages/rules/index',
    'pages/promise/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF6B8A',
    navigationBarTitleText: '育儿积分宝',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF5F7'
  },
  tabBar: {
    color: '#B2BEC3',
    selectedColor: '#FF6B8A',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '任务'
      },
      {
        pagePath: 'pages/points/index',
        text: '积分'
      },
      {
        pagePath: 'pages/mall/index',
        text: '商城'
      },
      {
        pagePath: 'pages/growth/index',
        text: '成长'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
