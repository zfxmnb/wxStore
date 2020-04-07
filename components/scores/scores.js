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
    this.store.on({ score: 'count' }, (obj) => {
      this.setData(obj)
    }, this)
  },

  detached () {},

  /**
   * 组件的方法列表
   */
  methods: {}
})
