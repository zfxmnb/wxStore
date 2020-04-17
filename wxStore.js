/**
 * 微信小程序状态管理
 * 1、基础库版本2.7.1以上
 * 2、如果组件和页面是同时加载时，Component ready时才绑定store attached中可能无法找到this.store
 */
import deepProxy from './utils/observer'
import diff from './utils/diff'
import { deepClone, toKeys, toKeyStr, noEmptyObject, reverse, getValue, setValue, defineStatic, type, OBJECT, ARRAY, FUNCTION, STRING } from './utils/utils'
import { getCurrentPage } from './utils/instanceUtils'
const supportProxy = !!Proxy // 是否支持Proxy
const STORES = {} // store 实例集
let storeId = 1 // store id
let listenerId = 1 // 监听器id
export default class WxStore {
  constructor ({ state = {}, actions = {}, debug = false } = {}) {
    this._state = deepClone(state)
    if (supportProxy) {
      defineStatic(this, 'state', deepProxy(deepClone(state), this._observer.bind(this))) // 监听对象变化
    } else {
      this.state = deepClone(state) // state
    }
    this._id = storeId++ // store id
    this._binds = [] // 绑定的实例对象
    this._diffObj = {} // diff结果
    this._observerList = [] // Proxy监听state
    this._listener = {} // 监听state改变事件
    this._debug = debug // 开启debug模式后会输出没吃diff数据
    defineStatic(this, 'actions', {}) // 行为方法
    Object.keys(actions).forEach((key) => {
      this.actions[key] = actions[key].bind(this)
    })
  }

  /**
   * 监听
   */
  _observer (keys, value) {
    let i = 0
    const len = keys.length
    // 判断是否覆盖已有，如果覆盖则移除旧的push新的
    while (i < this._observerList.length) {
      const item = this._observerList[i]
      if (item.keys.length >= len) {
        let match = true
        for (let j = 0; j < len; j++) {
          if (keys[j] !== item.keys[j]) {
            match = false
            break
          }
        }
        if (match) {
          this._observerList.splice(i, 1)
        } else {
          i++
        }
      } else {
        i++
      }
    }
    this._observerList.push({ keys, value })
  }

  /**
   * 将state监听到的变化写入diff对象中用于最终的setData，且将变化同步到_state
   */
  _observerSet () {
    this._observerList.forEach(({ keys, value }) => {
      value = deepClone(value)
      // 根据对象key 提取 state 与对于value比对
      const keyStr = toKeyStr(keys, this._state)
      // 空对象不执行diff update操作
      if (noEmptyObject(value, true)) {
        // 获取diffObj
        Object.assign(this._diffObj, diff(value, getValue(this._state, keys), keyStr))
      } else {
        Object.assign(this._diffObj, {
          [keyStr]: value
        })
      }
      // 同步到_state
      setValue(this._state, keys, value)
    })
    this._observerList = []
  }

  /**
   * 设置state
   * @param {*} obj set数据对象
   */
  _diffSet () {
    // 获取diffObj
    Object.assign(this._diffObj, deepClone(diff(this.state, this._state)))
    // 写入store state
    for (const key in this._diffObj) {
      const keys = toKeys(key)
      setValue(this._state, keys, this._diffObj[key])
    }
  }

  /**
   * 更新视图
   * @param {*} obj 更新对象
   * @param {*} imm 是否立即更新视图
   */
  update (obj, imm) {
    // 支持update写入更改state
    if (type(obj, OBJECT)) {
      for (const key in obj) {
        const keys = toKeys(key)
        setValue(this.state, keys, obj[key])
      }
    }
    if (imm) {
      // 立即执行
      return this._set()
    } else {
      // 合并执行
      return this._merge()
    }
  }

  /**
   * 合并多次set
   */
  _merge () {
    // Promise实现合并set
    // eslint-disable-next-line no-return-assign
    return this._pendding = this._pendding || Promise.resolve().then(() => {
      return this._set()
    })
  }

  /**
   * 设置映射数据
   */
  _set () {
    return new Promise((resolve) => {
      if (supportProxy) {
        // 支持Proxy的
        this._observerSet()
      } else {
        // 用于不支持Proxy
        this._diffSet()
      }
      if (noEmptyObject(this._diffObj)) {
        let count = 0
        const diffObj = { ...this._diffObj }
        // 实例更新
        this._binds.forEach((that) => {
          // 获取diffObj => 实例的新的diff数据
          const obj = this._getMapData(that.__stores[this._id].stateMap)
          // set实例对象中
          if (noEmptyObject(obj)) {
            count++
            that.setData(obj, () => {
              count--
              if (count <= 0) {
                resolve(diffObj)
              }
            })
          }
        })
        // 监听器回调
        for (const id in this._listener) {
          // 监听
          if (this._isChange(this._listener[id].map)) {
            // 执行回调
            this._listener[id].fn(this._listener[id].map.map((key) => {
              return deepClone(getValue(this._state, toKeys(key)))
            }))
          }
        }
        if (count <= 0) {
          resolve(diffObj)
        }
        // debug diff 结果输出
        this._debug && console.log('diff object:', this._diffObj)
        this._diffObj = {} // 清空diff结果
      } else {
        resolve({})
      }
      delete this._pendding // 清除
    })
  }

  /**
   * 绑定对象
   * @param {*} that 实例Page/Component
   * @param {*} map state => 实例data 的映射map
   * @param {*} extend bind时映射到data的扩展字段
   */
  bind (that, map, extend = {}) {
    // 必须为实例对象
    if (!type(that, OBJECT)) {
      console.warn('[wxStore] check bind this')
      return
    }
    // 必须是obj或者arr
    if (!type(map, OBJECT) && !type(map, ARRAY)) {
      console.warn('[wxStore] check bind stateMap')
      map = {}
    }
    // 获取state=>实例data的指向
    const id = this._id
    const stateMap = reverse(map)
    const obj = initData(stateMap, this._state) // 初始化实例的data
    Object.assign(obj, extend) // bind 初始化setData扩展字段
    that.setData(obj) // 执行set
    that.__stores = type(that.__stores, OBJECT) ? that.__stores : {} // 初始化实例对象上的状态映射表
    // 映射对象写入实例对象
    if (that.__stores[id]) {
      Object.assign(that.__stores[id].stateMap, stateMap)
    } else {
      that.__stores[id] = { stateMap, store: this }
    }
    !this._binds.find(item => item === that) && this._binds.push(that) // 实例写入this._binds数组中，用于update找到实例对象
    STORES[id] || (STORES[id] = this) // 已bind store 存入STORES集合
  }

  /**
   * 解除绑定
   * @param {*} that 实例Page/Component
   */
  unBind (that) {
    that.__stores && (delete that.__stores[this._id]) // 清除状态管理对象映射对象
    // 移除实例绑定
    for (var i = 0; i < this._binds.length; i++) {
      if (this._binds[i] === that) {
        this._binds.splice(i, 1)
        break
      }
    }
    // bind列表空时，在STORES删除store
    if (!this._binds.length) {
      delete STORES[this._id]
    }
  }

  /**
   * 监听状态改变
   * @param {*} map 监听的数据映射
   * @param {*} fn 监听回调
   */
  on (map, fn, that) {
    if (type(map, STRING)) {
      // eslint-disable-next-line no-useless-escape
      map = map.split(/\s*\,\s*/g)
    }
    // map必须为obj或者arr 且fn必须为function
    if (!noEmptyObject(map, true) || !type(fn, FUNCTION)) {
      console.warn('[wxStore] check on params')
      return
    }
    // 获取监听state的映射
    map = deepClone(map)
    // 监听器id
    const id = listenerId++
    // 监听器数据保存到this._listener中
    this._listener[id] = {
      map,
      fn
    }
    if (type(that, OBJECT)) {
      that.__listener = type(that.__listener, OBJECT) ? that.__listener : {}
      that.__listener[id] = this
    }
    // id用于remove
    return id
  }

  /**
  * 移除监听状态改变
  * @param {*} id listener的id
  */
  remove (id) {
    if (this._listener[id]) {
      delete this._listener[id]
    }
  }

  /**
   * 根据具体diff 及 映射map 获得最终setData对象
   * @param {*} map 映射map
   */
  _getMapData (map) {
    if (!noEmptyObject(map)) return {}
    const obj = {}
    // diff结果与映射的双重比对
    const reg = RegExp(`^(${Object.keys(map).join('|')})((?=(?:\\.|\\[))|$)`)
    for (const key in this._diffObj) {
      let match = false
      const newKey = key.replace(reg, (s) => {
        match = true
        return map[s] || s
      })
      if (match) {
        obj[newKey] = this._diffObj[key]
      }
    }
    return obj
  }

  /**
   * 监听的对象是否修改
   * @param {*} map
   */
  _isChange (map) {
    // diff结果与映射的双重比对
    const reg = RegExp(`^(${map.join('|')})((?=(?:\\.|\\[))|$)`)
    for (const key in this._diffObj) {
      if (key.match(reg)) {
        return true
      }
    }
    return false
  }
}

/**
 * 挂载
 * @param {*} ops 实例配置
 * @param {*} fixed 组件是否脱离Page store采用自己的store
 */
function Attached (ops, fixed) {
  ops.stateMap = ops.stateMap || {}
  ops.store = ops.store || {}
  // store必须为对象、stateMap必须为Object或Array
  if (type(ops.store, OBJECT) && (type(ops.stateMap, OBJECT) || type(ops.stateMap, ARRAY))) {
    const { STOREID = 0 } = this.properties || {}
    // store 如果是Wxstore的实例则直接使用，否则使用id为STOREID的store，fixed === true 使用页面级store， 否则通过store配置生产新的store
    this.store = ops.store instanceof WxStore ? ops.store
      : STORES[STOREID] || (!fixed && getCurrentPage(this).store) || new WxStore(ops.store) // 传入已经是WxStore实例则直接赋值，否者实例化
    this.store.bind(this, ops.stateMap, fixed ? { STOREID: this.store._id } : {}) // 绑定是不初始化data、在实例生产前已写入options中
  }
  // stores 必须为数组
  if (type(ops.stores, ARRAY)) {
    ops.stores.forEach((item = {}) => {
      // store必须为WxStore对象、stateMap必须为Object或Array
      const { store, stateMap } = item
      if (store instanceof WxStore && (type(stateMap, OBJECT) || type(stateMap, ARRAY))) {
        store.bind(this, stateMap)
      }
    })
  }
}

/**
 * 取消挂载
 */
function Detached () {
  // 解除this上的listener的绑定
  if (noEmptyObject(this.__listener)) {
    for (const id in this.__listener) {
      this.__listener[id].remove(id)
    }
    delete this.__listener
  }
  // 解除this上的store的绑定
  if (noEmptyObject(this.__stores)) {
    for (const id in this.__stores) {
      this.__stores[id].store.unBind(this)
    }
    delete this.__stores
  }
  delete this.store // 删除store
}

/**
 * 重写Page方法，提供自动绑定store自定移除store方法
 * @param {*} ops 页面初始化配置
 */
export function storePage (ops) {
  setOptions(ops) // 初始化data、作用是给data里面填入store中的默认state
  // 重写onLoad
  const onLoad = ops.onLoad
  ops.onLoad = function () {
    Attached.call(this, ops, true)
    type(onLoad, FUNCTION) && onLoad.apply(this, [].slice.call(arguments))
  }
  // 重写onUnload
  const onUnload = ops.onUnload
  ops.onUnload = function () {
    type(onUnload, FUNCTION) && onUnload.apply(this, [].slice.call(arguments)) // 执行卸载操作
    Detached.call(this)
  }
  Page(ops)
}

/**
 * 重写Component方法，提供自动绑定store自定移除store方法
 * @param {*} ops 组件初始化配置
 */
export function storeComponent (ops) {
  setOptions(ops, true) // 初始化data、作用是给relateddata里面填入store中的默认state
  const name = ops.fixed ? 'attached' : 'ready'
  let opts = ops.lifetimes && ops.lifetimes[name] ? ops.lifetimes : ops
  // 重写ready
  const init = opts[name]
  opts[name] = function () {
    Attached.call(this, ops, ops.fixed)
    type(init, FUNCTION) && init.apply(this, [].slice.call(arguments))
  }
  opts = ops.lifetimes && ops.lifetimes.detached ? ops.lifetimes : ops
  // 重写detached
  const detached = opts.detached
  opts.detached = function () {
    type(detached, FUNCTION) && detached.apply(this, [].slice.call(arguments)) // 执行卸载操作
    Detached.call(this)
  }
  Component(ops)
}

/**
 * diff
 */
exports.diff = diff

/**
 * 根据 store、stateMap在页面、组件初始化配置初始化data，组件要初始化data也必须传store
 * @param {*} ops 页面初始化时
 * @param {*} isComponent 组件
 */
function setOptions (ops, isComponent) {
  if (type(ops.store, OBJECT) && (type(ops.stateMap, OBJECT) || type(ops.stateMap, ARRAY))) {
    const reverseMap = reverse(ops.stateMap)
    const obj = initData(reverseMap, ops.store.state) // 初始化实例的data
    ops.data = type(ops.data, OBJECT) ? ops.data : {}
    Object.assign(ops.data, obj)
  }
  // 给组件注入STOREID属性
  if (isComponent) {
    ops.properties = ops.properties || {}
    ops.properties = {
      STOREID: Number
    }
  }
  return ops
}

/**
 * 初始化数据
 * @param {*} map
 * @param {*} data
 */
function initData (map, data) {
  const obj = {} // 初始化实例的data
  if (noEmptyObject(map) && type(data, OBJECT)) {
    // 在初始化实例data使用
    for (const key in map) {
      const keys = toKeys(key)
      obj[map[key]] = deepClone(getValue(data, keys))
    }
  }
  return obj
}
