// components/scores/scores.js
import { storeComponent } from './../../wxStore'
import globel from './../../store'
storeComponent({
  /**
   * 组件的初始数据
   */
  data: {
    score: 0
  },

  ready() {
    globel.bind(this, {
      maxScore: 'scores.maxScore',
      average: 'scores.average'
    })
    this._listener = this.$store.addListener({ score: 'count' }, (obj) => {
      this.setData(obj)
    })
  },

  detached () {
    this.$store.removeListener(this._listener)
  },

  /**
   * 组件的方法列表
   */
  methods: {}
})
