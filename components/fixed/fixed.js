import { storeComponent } from './../../wxStore'
storeComponent({
  fixed: true,
  store: {
    state: {
      a: true
    },
    actions: {
      change () {
        this.state.a = !this.state.a
        this.update()
      }
    }
  },
  stateMap: {
    A: 'a'
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
