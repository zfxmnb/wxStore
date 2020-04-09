Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = deepProxy;

/**
 * proxy 对象动态监听
 * @param {*} object
 * @param {*} handler
 * @param {*} keys
 */
function deepProxy(object, handler) {
  var keys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (object instanceof Object) {
    for (var key in object) {
      if (object[key] instanceof Object) {
        object[key] = deepProxy(object[key], handler, [].concat(keys, [key]));
      }
    }

    return new Proxy(object, {
      get: function get(obj, key) {
        return obj[key];
      },
      set: function set(obj, key, value) {
        var keyList = [].concat(keys, [key]);
        if (obj[key] === value) return true;

        if (object instanceof Array && key === 'length') {
          handler([].concat(keys), object.slice(0, value));
        } else {
          handler(keyList, value);
        }

        if (value instanceof Object) {
          obj[key] = deepProxy(value, handler, keyList);
          return true;
        }

        obj[key] = value;
        return true;
      }
    });
  } else {
    return object;
  }
}