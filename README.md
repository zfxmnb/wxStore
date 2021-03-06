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
  - [更新页面](#更新页面)
  - [创建组件](#创建组件)
  - [更新组件](#更新组件)
  - [组件级状态管理](#组件级状态管理)
  - [跨页面同步数据](#跨页面同步数据)
  - [调试](#调试)
- [注意事项](#注意事项)
- [原理](#原理)
  - [Diff](#Diff)
- [License](#License)

## 前言

微信小程序的状态管理一直都是刀耕火种的开发方式的一大痛点，在没有状态管理的情况下只能通过组件的triggerEvent去传递，当多层组件的时候就会是一件很麻烦的事情，也有订阅模式用于组件页面、跨组件、跨页面的通信，不过这种模式数据追踪又是一个大问题，这个时候状态管理就显得非常必要了

## 特点

* 轻量、简便，只有7个方法
* 旧项目改造成本低
* 支持 x.y[1].z 小程序原生setData写法
* 可绑定多个全局store，适用更多业务场景
* 支持组件级的状态管理
* 建议通过actions更改state，集中管理更改state行为
* stateMap映射，随意更改映射数据的字段名， 且避免无用数据写入data，页面组件中也无需设置data默认
* 自动合并同步set操作，避免视图更新频繁问题，也支持立即更新视图操作
* 支持订阅模式，适用于无需更新视图的使用场景或状态预处理
* 基础库版本2.7.1以上支持组件通过原生getPageId的方式获取与Page的关系，2.7.0及以下版本在某些特殊场景下可能会出现非最近一个页面的组件错误绑定到最近一个页面错误情况（getCurrentPages()[getCurrentPages().length - 1]）

## API

wxStore 提供8个方法:

* storePage({store, stateMap})    创建页面 store一般是store实例的配置，也可以是store实例，stateMap为state到data的映射
* storeComponent({store, stateMap})     创建组件 store一般是store实例的配置，也可以是全局的store实例，默认不填写指向Page的store实例，stateMap为state到data的映射
* store.bind(this, stateMap)    store为实例，bind方法用于与当前页面或者组件绑定，一般用于全局状态绑定，可绑定多个全局store实例
* store.unBind(this)    解除绑定，一般当前页面使用storePage、storeComponent无需单独调用
* store.on(stateMap, fn, this)     监听stateMap中的数据改动，return id，并在fn回调中返回结果，使用场景为不更新视图的state变化, this为页面/组件实例，用于页面/组件销毁时自动remove
* store.remove(id)    清除监听器，id = store.on, 页面组件销毁前主动调用清除
* store.update()    用于更新state状态改变，返回Promise实例
* store.getState(key)     通过这个方法复制获取想要的value

纯组件使用小程序自带的 Component

## 开发

### 定义全局store

```js
export default new WxStore({
  // debug: true, // 控制台是否输出diff结果
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
    // 更新分数
    addScore(score) {
      const { scores } = this.state
      const { records, maxScore } = scores
      // 数组形式获取
      this.state.gameCount++
      scores.total += score
      scores.average = parseFloat(scores.total / this.state.gameCount).toFixed(2)
      records.push(score)
      this.update({
        'scores.maxScore': score > maxScore ? score : maxScore
      }).then((diff) => {
        console.log(diff)
      })
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
      this.state.count++
      this.update().then((diff) => {
        // console.log(diff)
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
  }] // 类似bind方法，建议使用
})
```

```jsx
<view class="tip">10秒内点击绿色区域，每点用1次得1分 最高：{{ maxScore }}</view>
<view class="score">{{ score }}</view>
<game/>
<scores/>
```

### 更新页面

```js
this.store.actions.click() // 页面store
globel.actions.x() // 全局store
```

### 创建组件

```js
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
    this.store.on(['count'], ([ score ]) => {
      this.setData({
        score
      })
    }, this)
    globel.on('scores.maxScore, scores.average', ([ maxScore, average ]) => {
      console.log(maxScore,  average)
    }, this)
  }
})
```

### 更新组件

```js
this.store.actions.click() // 页面store
globel.actions.x() // 全局store
```

### 组件级状态管理

创建组件时options fixed: true, 表示这个组件的this.store将优先使用 属性STOREID【store id】对应的store，如果属性未找到对应store，则通过store配置生成新增store实例；STOREID将变成新store实例的唯一id，并且子组件与当前组件的将通过STOREID进行关联

```js
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
```

```jsx
<button bind:tap="change">切换{{ A }}</button>
<!-- sub 组件将关联当前组件的store -->
<sub STOREID="{{ STOREID }}"/>
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

* 建议使用基础库版本2.7.1及以上
* 当组件没有fixed参数的时候，ready时才绑定store实例成功
* 建议使用storePage、storeComponent创建页面组件，无需主动调用unBind注销store实例的绑定, 可以避免内存泄露，否则需要主动调用解绑
* 组件级状态管理通过STOREID关联，this.data.STOREID 无需开发者定义，但该组件属性必须写上STOREID="{{STOREID}}"
* 具体使用有疑问可以参考代码片段

## 原理

```
 ---------     ---------------      --------------     --------------------     -----------
| update  | → |  Proxy监听变化  | → |  根据需要diff  | → |  diff结果映射到实例  | → ｜  视图更新  |
 ---------     ---------------      --------------     --------------------     -----------
```

* 直接改变Proxy对象值set回调写入缓存，待需要更新视图是进行必要的diff
* diff结果通过stateMap映射到具体页面、组件data实现视图更新

### Diff

* 通过深层比较新数据与就数据的结构差异，并输以 x.y[1].z 的形式输出
* 通过Proxy对象值set回调减少过多的diff层级，对有必要的对象数组进行diff
* 如果业务需求对特殊数据进行单独diff，可以直接使用diff方法：diff(current, pre, [prefix, performance])

## License

MIT [@zfxmnb](https://github.com/zfxmnb)