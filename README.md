# wxStore - 微信小程序状态管理

> 状态管理、跨页通讯、状态变更订阅

---
- [前言](#前言)
- [特点](#特点)
- [API](#API)
- [开发](#开发)
	- [定义全局store](#定义全局store)
  - [定义页面store](#定义页面store)
  - [创建页面](#创建页面)
  - [绑定数据](#绑定数据)
  - [更新页面](#更新页面)
  - [创建组件](#创建组件)
  - [更新组件](#更新组件)
  - [跨页面同步数据](#跨页面同步数据)
  - [调试](#调试)
- [注意事项](#注意事项)
- [原理](#原理)
  - [Diff](#Diff)
- [License](#License)

## 前言

微信小程序的状态管理一直都是刀耕火种的开发方式的一大痛点，在没有状态管理的情况下只能通过组件的triggerEvent去传递，当多层组件的时候就会是一件很麻烦的事情，也有订阅模式用于组件页面、跨组件、跨页面的通信，不过这种模式数据追踪又是一个大问题，这个时候状态管理就显得非常必要了

## 特点

* 轻量、简便，只有8个方法
* 旧项目改造成本低
* 支持 x.y[1].z 小程序原生setData写法
* 可绑定多个全局store，适用更多业务场景
* 不能直接更改state，只能通过actions更改，集中管理更改state行为
* stateMap映射，随意更改映射数据的字段名， 且避免无用数据写入data，页面组件中也无需设置data默认
* 支持局部get、set，避免全局clone、diff
* 自动合并同步set，避免视图更新频繁问题，也无需考虑何时何地手动调用更新
* 对数组提出新的优化方案，支持手动设置数组diff方案，提升数组diff性能
* 支持订阅模式，适用于无需更新视图的使用场景
* 组件通过原生getPageId的方式获取与Page的关系，避免页面隐藏时组件初始化错误的绑定store【getCurrentPages()[getCurrentPages().length - 1]】，但基础库需为2.7.1以上

## API

wxStore 提供8个方法:

* storePage(store, stateMap)    创建页面 store一般是store实例的配置，也可以是全局的store实例，stateMap为state到data的映射
* storeComponent(store, stateMap)     创建组件 store一般是store实例的配置，也可以是全局的store实例，默认不填写指向Page的store实例，stateMap为state到data的映射
* store.bind(this, stateMap)    store为实例，bind方法用于与当前页面或者组件绑定，一般用于全局状态绑定，可绑定多个全局store实例
* store.unBind(this)    解除绑定，一般当前页面使用storePage、storeComponent无需单独调用
* store.addListener(stateMap, fn)     监听stateMap中的数据改动，return id，并在fn回调中返回结果，使用场景为不更新视图的state变化
* store.removeListener(id)    清除监听器，id = store.addListener, 页面组件销毁前主动调用清除
* store.actions.x     x行为方法提供了this.get方法获取state的值，不提供直接获取方式
* store.actions.x     x行为方法提供了this.set方法设置state的值，不提供直接设置方式

纯组件使用小程序自带的 Component

## 开发

### 定义全局store

```js
export default new WxStore({
  // debug: true, // 控制台是否输出diff结果
  // performance: true, // 是否关闭针对数组push行为的性能优化，注意：set中的所有数组必须为可预期行为是push的数组，不建议对store设置，建议在set的时候设置
  state: {
    scores: {
      maxScore: 0,
      average: 0,
      total: 0,
      records: [1, 2, 3, 4, 5]
    },
    gameCount: 0
  }
  actions: {
    x () {
      const maxScore = this.get('scores.maxScore') // 获取当个，最常用方法
      const gameCount = this.get(['gameCount']) // 获取多个不重命名
      const { Average, Total, records } = this.get({ Average: 'scores.average', Total: 'scores.total' }) // 获取多个并重命名
      const { scores } = this.get() // 获取全部，建议不要获取太多无用数据
      records.push(1)
      this.set({
        'scores.records',
        gameCount
      }, true) // 当次set是否需要对数组diff进行优化处理，注意：set中的所有数组必须为可预期行为是push的数组
      this.set({
        'scores.average': Average++
      }) //两次set只会更新一次diff
    }
  }
})
```

### 定义页面store

```js
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
    }
  }
}
```

### 创建页面

```js
import { storePage } from '../wxStore'
import globel from '../store.js' // store实例
import store from './gameStore' // store配置
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
  }], // 类似bind方法，建议使用
  data: {}, // 页面可自带数据，不受store影响
  onLoad () {},
})

```

### 绑定数据

```jsx
<view class="tip">10秒内点击绿色区域，每点用1次得1分 最高：{{ maxScore }}</view>
<view class="score">{{ score }}</view>
<game/>
<scores/>
```

### 更新页面

```js
this.$store.actions.click() // 页面store
globel.actions.x() // 全局store
```

### 创建组件

```js
import { storeComponent } from './../../wxStore'
import globel from './../../store'
storeComponent({
  stores: [{
    store: globel,
    stateMap: {
      maxScore: 'scores.maxScore',
      average: 'scores.average'
    }
  }], // 类似bind方法，建议使用
  /**
   * 组件的初始数据
   */
  data: {
    score: 0
  },

  ready() {
    // 使用store相关需在ready生命周期后使用，因为attached 可能会在 onLoad 前执行
    // globel.bind(this, {
    //   maxScore: 'scores.maxScore',
    //   average: 'scores.average'
    // })
    this._listener = this.$store.addListener({
      score: 'count'
    }, (obj) => {
      this.setData(obj)
    })
  },

  detached () {
    this.$store.removeListener(this._listener)
  },

  /**
   * 组件的方法列表
   */
  methods: {
    click () {
      this.$store.actions.click()
    }
  }
})
```

### 更新组件

```js
this.$store.actions.click() // 页面store
globel.actions.x() // 全局store
```

### 跨页面同步数据

跨页面状态管理使用stores绑定store全局实例，或者在生命周期中使用bind绑定

```js
globel.bind(this, {
  maxScore: 'scores.maxScore',
  average: 'scores.average'
})
```

### 调试

* wxStore会在一些关键方法如get、set、bind等中输出异常params的警告日志
* store 配置中有debug字段，默认false， 开启时会在视图更新时输出当次更新所有diff结果

## 注意事项

* 基础库版本2.7.1以上
* performance 会开启对数组diff的性能模式，减少不比较的diff
* 默认不开启performance模式，建议在set第2个参数判断使用模式
* 如果组件和页面是同时加载时，Component ready时才绑定store attached中可能无法使用store方法
* 在为使用storePage、storeComponent创建页面组件时，ubBind需要在页面、组件注销前执行、否则无需调用
* 页面使用addListener, 对应的removeListener需要在页面、组件注销前执行
* 具体使用有疑问可以参考代码片段
* beta版本

## 原理

```
 ---------------     -----------     --------------     ----------------------     -----------
| store.set n次 | → |  diff n次  | → |  update 1次  | → |  stateMap 映射到data  | → ｜  更新视图  |
 ---------------     -----------     --------------     ----------------------     -----------
```
* 多次set会对数据进行多次diff，同时会把set的数据写入state
* 多次diff结果合并然后update的时候通过stateMap映射到具体页面、组件data实现视图更新

### Diff

* 通过深层比较新数据与就数据的结构差异，并输以 x.y[1].z 的形式输出
* 可以支持非全局diff，比如只diff x.y的数据，提升diff效率
* 支持性能模式对push行为的数组进行diff优化，如：[1, 2, 3, 4]、[1, 2, 3, 4, 5]，数组前4项不进行diff比较

## License
MIT [@zfxmnb](https://github.com/zfxmnb)