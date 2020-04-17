/**
 * proxy 对象动态监听
 * @param {*} object
 * @param {*} handler
 * @param {*} keys
 */
export default function deepProxy (object, handler, keys = []) {
  if (object instanceof Object) {
    for (const key in object) {
      if (object[key] instanceof Object) {
        object[key] = deepProxy(object[key], handler, [].concat(keys, [key]))
      }
    }
    return new Proxy(object, {
      get: (obj, key) => {
        return obj[key]
      },
      set: (obj, key, value) => {
        const keyList = [].concat(keys, [key])
        if (obj[key] === value) return true
        if (obj instanceof Array && key === 'length') {
          handler([].concat(keys), obj.slice(0, value))
        } else {
          handler(keyList, value)
        }
        if (value instanceof Object) {
          obj[key] = deepProxy(value, handler, keyList)
          return true
        }
        obj[key] = value
        return true
      }
    })
  } else {
    return object
  }
}
