Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = deepProxy;

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function deepProxy(object, handler) {
  var keys = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];

  if (_typeof(object) === 'object') {
    for (var key in object) {
      if (_typeof(object[key]) === 'object') {
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

        if (_typeof(value) === 'object') {
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