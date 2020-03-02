import globel from '../store.js'
Page({
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad () {
    globel.bind(this, {
      maxScore: 'scores.maxScore',
      average: 'scores.average',
      total: 'scores.total',
      gameCount: 'gameCount',
      records: 'scores.records'
    })
  },

  goto () {
    wx.navigateTo({
      url: '/game/game',
    })
  },
  
  clear () {
    globel.actions.clear()
  }
})