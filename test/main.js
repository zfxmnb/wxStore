import assert from 'assert'
import {
  storePage
} from '../wxStore'
require('./instance')
// store配置
const store = {
  // debug: true,
  state: {
    x: [1, 2, 3],
    y: {
      a: {
        b: [2]
      },
      c: 3
    },
    c: [1, 2, 3]
  },
  actions: {
    change_x (cb) {
      this.state.x.push(5)
      this.update({
        x: [1, 2, 3, 4]
      }).then(cb)
    },
    add_y (cb) {
      this.state.y.a.b.push(this.state.y.c)
      this.state.y.c++
      this.update({}).then(cb)
    }
  }
}

describe('wxstore 状态管理测试', function () {
  // 设置单个state
  storePage({
    store,
    stateMap: {
      X: 'x',
      Y: 'y'
    },
    onLoad () {
      this.store.actions.change_x((diff) => {
        it('单个state改变', function () {
          // 最终diff对象比对
          assert.deepStrictEqual(diff, {
            'x[3]': 4
          })
        })
        this.onUnload()
      })
    }
  })
  // 设置两个state
  storePage({
    store,
    stateMap: {
      X: 'x',
      Y: 'y'
    },
    onLoad () {
      this.store.actions.add_y()
      this.store.actions.change_x((diff) => {
        it('多个state改变', function () {
          // 最终diff对象比对
          assert.deepStrictEqual(diff, {
            'x[3]': 4,
            'y.a.b[1]': 3,
            'y.c': 4
          })
        })
        this.onUnload()
      })
    }
  })
  // 设置数组state
  storePage({
    store,
    onLoad () {
      this.store.state.c.push(3)
      this.store.state.c.shift()
      this.store.update({
        c: []
      }).then((diff) => {
        it('数组state', function () {
          // 最终diff对象比对
          assert.deepStrictEqual(diff, {
            c: []
          })
        })
        this.onUnload()
      })
    }
  })
  // on 方法监听
  storePage({
    store,
    onLoad () {
      this.store.state.c.push(3)
      this.store.state.c.shift()
      this.store.update()
      this.store.on(['c'], ([c]) => {
        it('on监听状态改变', function () {
          // 最终diff对象比对
          assert.deepStrictEqual(c, [2, 3, 3])
        })
        this.onUnload()
      })
    }
  })
})
