/**
 * 类型判断
 */
export const STRING = 'String'
export const OBJECT = 'Object'
export const ARRAY = 'Array'
export const FUNCTION = 'Function'
export const UNDEFINED = 'Undefined'
export function type (val, str) {
  let typeStr
  if (typeof val === 'string') {
    typeStr = STRING
  } else if (typeof val === 'function') {
    typeStr = FUNCTION
  } else if (val instanceof Array) {
    typeStr = ARRAY
  } else if (val instanceof Object) {
    typeStr = OBJECT
  } else {
    typeStr = Object.prototype.toString.call(val).slice(8, -1)
  }
  if (str) {
    return typeStr === str
  }
  return typeStr
}

/**
 * 对象对象判空
 * @param {*} obj
 * @param {*} containArr 是否需要包含数组
 */
export function noEmptyObject (obj, containArr) {
  if ((containArr && type(obj, ARRAY)) || type(obj, OBJECT)) {
    return !!Object.keys(obj).length
  }
  return false
}

/**
 * 深拷贝(循环引用、递归栈异常优化)
 * @param {*} Obj 对象
 */
export function deepClone (Obj) {
  let buf
  if (Obj instanceof Array) {
    buf = [] // 创建一个空的数组
    let i = Obj.length
    while (i--) {
      buf[i] = deepClone(Obj[i])
    }
    return buf
  } else if (Obj instanceof Object) {
    buf = {} // 创建一个空对象
    for (const k in Obj) { // 为这个对象添加新的属性
      buf[k] = deepClone(Obj[k])
    }
    return buf
  } else {
    return Obj
  }
}

/**
 * key字符转换为数组
 */
export function toKeys (keyStr) {
  return keyStr.match(/(?:(?!\.|\[|\])\S)+/g) || []
}

/**
 * 数组key转化为string
 * @param {*} keys key 数组
 * @param {*} data 对象对象
 */
export function toKeyStr (keys, data = {}, index = 0) {
  let str = ''
  if (data instanceof Array) {
    str += `[${keys[index]}]`
  } else if (index) {
    str += `.${keys[index]}`
  } else {
    str += `${keys[index]}`
  }
  if (index < keys.length - 1) {
    return str + toKeyStr(keys, data[keys[index]], ++index)
  } else {
    return str
  }
}

/**
 *  对象转换
 * @param {*} obj 传入映射map
 */
export function reverse (obj) {
  const newObj = {}
  const isArray = type(obj, ARRAY)
  for (const key in obj) {
    if (type(obj[key], STRING)) {
      newObj[obj[key].trim()] = isArray ? obj[key] : key
    }
  }
  return newObj
}

/**
 * 通过关系key获得对应value
 * @param {*} data 数据对象
 * @param {*} keys 关系key
 */
export function getValue (data, keys) {
  if (!keys.length) {
    console.warn(`${keys} is not valid`)
    return
  }
  let obj = data
  for (let i = 0; i < keys.length; i++) {
    if (obj instanceof Object) {
      obj = obj[keys[i]]
    } else {
      obj = undefined
      console.warn(`${keys} is not valid`)
      break
    }
  }
  return obj
}

/**
 * 通过关系key设置对应value
 * @param {*} data 数据对象
 * @param {*} keys 关系key
 * @param {*} data 需要 set 数据
 */
export function setValue (data, keys, value) {
  if (!keys.length) {
    return
  }
  let obj = data
  for (let i = 0; i < keys.length; i++) {
    if (i === keys.length - 1) {
      obj[keys[i]] = value
    } else if (obj instanceof Object) {
      obj = obj[keys[i]]
    } else {
      obj = undefined
      break
    }
  }
  return obj
}

/**
 * 定义静态属性
 * @param {*} obj
 * @param {*} key
 * @param {*} value
 */
export function defineStatic (obj, key, value) {
  if (type(obj, OBJECT)) {
    if (type(key, OBJECT)) {
      const properties = {}
      for (const k in key) {
        properties[k] = {
          writable: false,
          configurable: false,
          value: key[k]
        }
      }
      Object.defineProperties(obj, properties)
    } else if (type(key, STRING) && value !== undefined) {
      Object.defineProperty(obj, key, {
        writable: false,
        configurable: false,
        value
      })
    }
  }
}
