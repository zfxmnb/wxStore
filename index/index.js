import { storePage } from '../wxStore'
import globel from '../store'
storePage({
  stores: [{
    store: globel,
    stateMap: {
      maxScore: 'scores.maxScore',
      average: 'scores.average',
      records: 'scores.records'
    }
  }],
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad () {
    globel.bind(this, {
      total: 'scores.total',
      gameCount: 'gameCount'
    })
  },

  goto () {
    wx.navigateTo({
      url: '/game/game'
    })
  },
  
  clear () {
    globel.actions.clear()
  }
})