// components/game/game.js
import { storeComponent } from './../../wxStore'
import globel from './../../store'
storeComponent({
  stateMap: {
    score: 'count'
  },

  /**
   * 组件的初始数据
   */
  data: {
    countTime: 10,
    statue: 0
  },

  lifetimes: {
    attached () {
      this.statue = 0
    },
    detached () {
      clearInterval(this._timer)
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    click () {
      if (this.statue === 0) {
        this._timer = setInterval(() => {
          let { countTime } = this.data
          countTime--
          if (countTime === 0) {
            this.gameOver()
          }
          this.setData({
            countTime
          })
        }, 1000)
        this.setData({
          statue: this.statue = 1
        })
      }
      if (this.statue === 1) {
        this.$store.actions.click()
      }
    },
    reset () {
      if (this.statue) {
        clearInterval(this._timer)
        this.setData({
          countTime: 10,
          statue: this.statue = 0
        })
        this.$store.actions.reset()
      }
    },
    gameOver () {
      clearInterval(this._timer)
      this.setData({
        statue: this.statue = 2
      })
      globel.actions.addScore(this.data.score)
    }
  }
})
