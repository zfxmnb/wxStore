# wxStore
## 一个微信小程序状态管理工具
wxStore为微信小程序专门定制的轻量、简便、实用的状态管理工具，还在BATE阶段，投入生产评估风险
### 特点
* 轻量，全部代码转译压缩包大概7K
* 简便实用，3个全局方法WxStore、storePage、storeComponent，4个WxStore对象方法bind、unBind、addListener、removeListener，2个actions绑定方法get、set
* 支持数据diff， 提高写入性能，避免大数据情况小程序报数据超限问题
* 对小程序数组diff提供了优化选项，支持控制数组的局部更新能力
* 合并set，同步set只会在视图渲染中执行一次
* 数据绑定自动更新、数据绑定监听更新能力
* 支持页面数据状态管理、全局数据状态管理，支持更多业务场景
## 注意
* 1、基础库版本2.7.1
* 2、如果组件和页面是同时加载时，Component ready时才绑定store attached中可能无法使用store
* 3、setState中有数组时，如果出现非push类型的修改时需要主动关闭performance模式否者可能出现数据错误，actions 方法中 arr === [1, 2] this.set({ arr: [], arr[1, 3, 4]})可实现performance:true下的数组全替换
## 使用
可通过小程序代码片段查看使用方法
```js
import { WxStore, storePage, storeComponent } from "./wxStore";
// store 配置
const store = {
  debug: false, // 控制台是否输出diff结果，默认false
  performance: true, // 是否开启针对push数组的性能优化, 默认true
  state: {
    a: {
      b: 1
    }
    // 状态
  },
  // 行为方法
  actions: {
    A() {
      // 不能直接获取state，只能通过this.get('a.b')获取
      // 不能直接设置state，只能通过this.set({ 'a.b': 2 })设置
    }
  }
}
// 创建store实例，一般全局状态管理才需这样实用
new WxStore(store)
// storePage、storeComponent不需要单独创建只需传入store配置、stateMap数据映射
storePage({
  store, // 可以是WxStore对象，也可以是store配置
  stores: [{
    store: new WxStore({}), // 必须为WxStore对象
    stateMap
  }]
  stateMap: {
    // [页面/组件实例data的key]: [store中state的映射key]
    ab: 'a.b'
  }
})
```
### store配置参考
```js
{
  debug: false, // 控制台是否输出diff结果
  performance: true, // 是否开启针对push数组的性能优化
  state: { // 状态
    scores: {
        maxScore: 0,
        average: 0,
        total: 0,
        records: []
    },
    gameCount: 0
  },
  // 行为方法
  actions: {
    // 更新分数
    addScore(score) {
      // 获取单个数据
      const records = this.get('scores.records')
      // 对象形式获取
      let { maxScore, total } = this.get({
        maxScore: 'scores.maxScore',
        total: 'scores.total'
      })
      // 数组形式获取
      let { gameCount } = this.get(['gameCount'])
      gameCount++
      maxScore = score > maxScore ? score : maxScore
      total += score
      const average = parseFloat(total / gameCount).toFixed(2)
      records.push(score)
      const data = {
        gameCount,
        scores: {
          maxScore,
          total,
          average,
          records
        }
      }
      this.set(data)
      wx.setStorageSync('data', data)
    },
    clear () {
      this.set(defaultState)
      wx.setStorageSync('data', defaultState)
    }
  }
}
```
### 页面实例参考
```js
import { storePage } from '../wxStore'
import globel from '../store.js'
import store from './gameStore'
storePage({
  store,
  stateMap: {
    score: 'count'
  },
  stores: [{
    store: globel,
    stateMap: {
      maxScore: 'scores.maxScore'
    }
  }],
  data: {},
  onLoad () {},
})

```
### 组件实例参考
```js
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
