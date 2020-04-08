import WxStore from './wxStore'
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
  // debug: true, // 控制台是否输出diff结果
  state: localData || defaultState,
  actions: {
    // 更新分数
    addScore(score) {
      const { scores } = this.state
      const { records, maxScore } = scores
      // 数组形式获取
      this.state.gameCount++
      scores.total += score
      scores.average = parseFloat(scores.total / this.state.gameCount).toFixed(2)
      records.push(score)
      this.update({
        'scores.maxScore': score > maxScore ? score : maxScore
      }).then((diff) => {
        console.log(diff)
      })
      wx.setStorageSync('data', this.state)
    },
    clear () {
      this.update({
        ...defaultState
      })
      wx.setStorageSync('data', defaultState)
    }
  }
})