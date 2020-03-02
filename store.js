import WxStore from './wxStore.js'
const localData = wx.getStorageSync('data')
const defaultState = {
  scores: {
    maxScore: 0,
    average: 0,
    total: 0,
    records: []
  },
  gameCount: 0
}
export default new WxStore({
  // debug: true,
  // performance: false,
  state: localData || defaultState,
  actions: {
    // 更新分数
    addScore(score) {
      // 获取单个数据
      const records = this.get('scores.records')
      // 对象形式获取
      let { maxScore, total } = this.get({
        maxScore: 'scores.maxScore',
        total: 'scores.total'
      })
      // 数组形式获取
      let { gameCount } = this.get(['gameCount'])
      gameCount++
      maxScore = score > maxScore ? score : maxScore
      total += score
      const average = parseFloat(total / gameCount).toFixed(2)
      records.push(score)
      const data = {
        gameCount,
        scores: {
          maxScore,
          total,
          average,
          records
        }
      }
      this.set(data)
      wx.setStorageSync('data', data)
    },
    clear () {
      this.set(defaultState)
      wx.setStorageSync('data', defaultState)
    }
  }
})