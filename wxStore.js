/**
 * 微信小程序状态管理
 * 1、基础库版本2.7.1以上
 * 2、如果组件和页面是同时加载时，Component ready时才绑定store attached中可能无法使用store
 */
import deepProxy from './utils/observer'
import diff from './utils/diff'
import { deepClone, toKeys, toKeyStr, noEmptyObject, reverse, getValue, setValue, defineStatic, type, OBJECT, ARRAY, FUNCTION, STRING } from './utils/utils'
import { getCurrentPage } from './utils/instanceUtils'
const supportProxy = !!Proxy // 是否支持Proxy
let storeId = 1
let listenerId = 1
export default class WxStore {
  constructor({ state = {}, actions = {}, debug = false } = {}) {
    this._state = deepClone(state)
    if (supportProxy && noEmptyObject(state)) {
      defineStatic(this, 'state', deepProxy(deepClone(state), this._observer.bind(this))) // 监听对象变化
    } else {
      this.state = deepClone(state) // state
    }
    this._id = storeId++ // store id
    this._binds = [] // 绑定的实例对象
    this._diffObj = {} // diff结果
    this._listenerId = 1 // 监听器id
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
    if (keys.length) {
      value = deepClone(value)
      // 根据对象key 提取 state 与对于value比对
      const keyStr = toKeyStr(keys, this._state)
      // 空对象不执行diff update操作
      if (noEmptyObject(value) || (type(value, ARRAY) && value.length)) {
        // 获取diffObj
        Object.assign(this._diffObj, diff(value, getValue(this._state, keys), keyStr))
      } else {
        Object.assign(this._diffObj, {
          [keyStr]: value
        })
      }
      // 写入store state
      setValue(this._state, keys, value)
    }
  }
  
  /**
   * 设置state
   * @param {*} obj set数据对象
   */
  _diffSet() {
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
  update(obj, imm) {
    // 不支持proxy的兼容
    if (type(obj, OBJECT)) {
      for (const key in obj) {
        const keys = toKeys(key)
        setValue(this.state, keys, obj[key])
      }
    }
    if (imm) {
      return this._set()
    } else {
      return this._merge()
    }
  }

  /**
   * 合并多次set
   */
  _merge () {
    // Promise 异步实现合并set
    if (noEmptyObject(this._diffObj)) {
      return this._pendding = this._pendding || Promise.resolve().then(() => {
        return this._set()
      })
    } else {
      return Promise.resolve({})
    }
  }

  /**
   * 设置映射数据
   */
  _set() {
    return new Promise((resolve) => {
      if (!supportProxy) {
        // 用于不支持Proxy对象
        this._diffSet()
      }
      if (noEmptyObject(this._diffObj)) {
        // 监听器回调
        for (const id in this._listener) {
          // 获取diffObj => 实例的新的diff数据
          const obj = this._getMapData(this._listener[id].stateMap, this._diffObj)
          // 执行回调
          noEmptyObject(obj) && this._listener[id].fn(obj)
        }
        // 实例更新
        let count = 0
        let diffObj = { ...this._diffObj }
        this._binds.forEach((that) => {
          // 获取diffObj => 实例的新的diff数据
          const obj = this._getMapData(that.__stores[this._id].stateMap, this._diffObj)
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
   */
  bind(that, map) {
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
    const stateMap = reverse(map)
    const obj = initData(stateMap, this._state) // 初始化实例的data
    noEmptyObject(obj) && that.setData(obj) // 执行set
    that.__stores = type(that.__stores, OBJECT) ? that.__stores : {} // 初始化实例对象上的状态映射表
    // 映射对象写入实例对象
    if (that.__stores[this._id]) {
      Object.assign(that.__stores[this._id].stateMap, stateMap)
    } else {
      that.__stores[this._id] = { stateMap, store: this }
    }
    !this._binds.find(item => item === that) && this._binds.push(that) // 实例写入this._binds数组中，用于update找到实例对象
  }

  /**
   * 解除绑定
   * @param {*} that 实例Page/Component
   */
  unBind(that) {
    that.__stores && (delete that.__stores[this._id]) // 清除状态管理对象映射对象
    // 移除实例绑定
    for (var i = 0; i < this._binds.length; i++) {
      if (this._binds[i] === that) {
        this._binds.splice(i, 1)
        break
      }
    }
  }

  /**
   * 监听状态改变
   * @param {*} map 监听的数据映射
   * @param {*} fn 监听回调
   */
  on(map, fn, that) {
    if (type(map, STRING)) {
      map = map.split(',')
    }
    // map必须为obj或者arr 且fn必须为function
    if (!(type(map, OBJECT) || type(map, ARRAY)) || !type(fn, FUNCTION)) {
      console.warn('[wxStore] check addListener params')
      return
    }
    // 获取state=>实例data的指向
    const stateMap = reverse(map)
    // 监听器id
    const id = listenerId++
    // 监听器数据保存到this._listener中
    this._listener[id] = {
      stateMap,
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
  remove(id) {
    if (this._listener[id]) {
      delete this._listener[id]
    }
  }

  /**
   * 根据具体diff 及 映射map 获得最终setData对象
   * @param {*} map 映射map
   * @param {*} diffObj diff对象
   */
  _getMapData(map, diffObj) {
    if (!noEmptyObject(map)) return {}
    const obj = {}
    // 传入diffObj执行映射转换、传null直接初始化
    if (diffObj) {
      // diff结果与映射的双重比对
      const reg = RegExp(`^(${Object.keys(map).join('|')})((?=(?:\\.|\\[))|$)`)
      for (const key in diffObj) {
        let match = false
        const newKey = key.replace(reg, (s) => {
          match = true
          return map[s] || s
        })
        if (match) {
          obj[newKey] = diffObj[key]
        }
      }
    }
    return obj
  }
}

/**
 * 挂载
 * @param {*} ops 实例配置
 * @param {*} isComponent 是否组件
 */
function attached (ops, isComponent) {
  ops.stateMap = ops.stateMap || {}
  ops.store = ops.store || {}
  // store必须为对象、stateMap必须为obj或arr
  if (type(ops.stateMap, OBJECT) || type(ops.stateMap, ARRAY)) {
    this.store = ops.store instanceof WxStore ? ops.store : isComponent ? getCurrentPage(this).store : new WxStore(ops.store) // 传入已经是WxStore实例则直接赋值，否者实例化
    this.store.bind(this, ops.stateMap) // 绑定是不初始化data、在实例生产前已写入options中
  }
  // stores 必须为数组
  if (type(ops.stores, ARRAY)) {
    ops.stores.forEach((item = {}) => {
      // store必须为WxStore对象、stateMap必须为obj或arr
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
function detached () {
  // 解除this上的store的绑定
  if (noEmptyObject(this.__stores)) {
    for (const id in this.__stores) {
      this.__stores[id].store.unBind(this)
    }
    delete this.__stores
  }
  // 解除this上的listener的绑定
  if (noEmptyObject(this.__listener)) {
    for (const id in this.__listener) {
      this.__listener[id].remove(id)
    }
    delete this.__listener
  }
  delete this.store // 删除store
}

/**
 * 重写Page方法，提供自动绑定store自定移除store方法
 * @param {*} ops 页面初始化配置
 */
export function storePage(ops) {
  setOptions(ops) // 初始化data、作用是给data里面填入store中的默认state
  // 重写onLoad
  const onLoad = ops.onLoad
  ops.onLoad = function () {
    attached.call(this, ops)
    type(onLoad, FUNCTION) && onLoad.apply(this, [].slice.call(arguments))
  }
  // 重写onUnload
  const onUnload = ops.onUnload
  ops.onUnload = function () {
    type(onUnload, FUNCTION) && onUnload.apply(this, [].slice.call(arguments)) // 执行卸载操作
    detached.call(this)
  }
  Page(ops)
}

/**
 * diff
 */
exports.diff = diff

/**
 * 重写Component方法，提供自动绑定store自定移除store方法
 * @param {*} ops 组件初始化配置
 */
export function storeComponent(ops) {
  setOptions(ops) // 初始化data、作用是给data里面填入store中的默认state
  let opts = ops.lifetimes && ops.lifetimes.ready ? ops.lifetimes : ops
  // 重写ready
  const ready = opts.ready
  opts.ready = function () {
    attached.call(this, ops, true)
    type(ready, FUNCTION) && ready.apply(this, [].slice.call(arguments))
  }
  opts = ops.lifetimes && ops.lifetimes.detached ? ops.lifetimes : ops
  // 重写detached
  const detached = opts.detached
  opts.detached = function () {
    type(detached, FUNCTION) && detached.apply(this, [].slice.call(arguments)) // 执行卸载操作
    detached.call(this)
  }
  Component(ops)
}

/**
 * 根据 store、stateMap在页面、组件初始化配置初始化data，组件要初始化data也必须传store
 * @param {*} ops 页面初始化时
 */
function setOptions(ops) {
  if (type(ops.store, OBJECT) && (type(ops.stateMap, OBJECT) || type(ops.stateMap, ARRAY))) {
    const reverseMap = reverse(ops.stateMap)
    const obj = initData(reverseMap, ops.store.state) // 初始化实例的data
    ops.data = type(ops.data, OBJECT) ? ops.data : {}
    Object.assign(ops.data, obj)
  }
  return ops
}

/**
 * 初始化数据
 * @param {*} map 
 * @param {*} data 
 */
function initData(map, data) {
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