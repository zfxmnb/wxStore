// components/scores/scores.js
import { storeComponent } from './../../wxStore'
storeComponent({
  stateMap: {
    status: 'a'
  },
  data: {
    status: false
  },
  /**
   * 组件的方法列表
   */
  methods: {
    change () {
      this.store.actions.change()
    }
  }
})
