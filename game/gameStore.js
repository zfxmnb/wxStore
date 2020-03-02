export default {
  state: {
    count: 0
  },
  actions: {
    // 点击
    click() {
      let count = this.get('count')
      count++
      this.set({
        count
      })
    },

    reset () {
      this.set({
        count: 0
      })
    }
  }
}