export default {
  // debug: true,
  state: {
    count: 0
  },
  actions: {
    // 点击
    click() {
      this.state.count++
      this.update()
    },

    reset () {
      this.update({
        count: 0
      })
    }
  }
}