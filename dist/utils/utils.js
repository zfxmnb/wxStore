Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.type = type;
exports.noEmptyObject = noEmptyObject;
exports.deepClone = deepClone;
exports.toKeys = toKeys;
exports.toKeyStr = toKeyStr;
exports.reverse = reverse;
exports.getValue = getValue;
exports.setValue = setValue;
exports.defineStatic = defineStatic;
exports.UNDEFINED = exports.FUNCTION = exports.ARRAY = exports.OBJECT = exports.STRING = void 0;

/**
 * 类型判断
 */
var STRING = 'String';
exports.STRING = STRING;
var OBJECT = 'Object';
exports.OBJECT = OBJECT;
var ARRAY = 'Array';
exports.ARRAY = ARRAY;
var FUNCTION = 'Function';
exports.FUNCTION = FUNCTION;
var UNDEFINED = 'Undefined';
exports.UNDEFINED = UNDEFINED;

function type(val, str) {
  var typeStr;

  if (typeof val === 'string') {
    typeStr = STRING;
  } else if (typeof val === 'function') {
    typeStr = FUNCTION;
  } else if (val instanceof Array) {
    typeStr = ARRAY;
  } else if (val instanceof Object) {
    typeStr = OBJECT;
  } else {
    typeStr = Object.prototype.toString.call(val).slice(8, -1);
  }

  if (str) {
    return typeStr === str;
  }

  return typeStr;
}
/**
 * 对象对象判空
 * @param {*} obj 
 * @param {*} containArr 是否需要包含数组
 */


function noEmptyObject(obj, containArr) {
  if (containArr && type(obj, ARRAY) || type(obj, OBJECT)) {
    return !!Object.keys(obj).length;
  }

  return false;
}
/**
 * 深拷贝(循环引用、递归栈异常优化)
 * @param {*} Obj 对象
 */


function deepClone(Obj) {
  var buf;

  if (Obj instanceof Array) {
    buf = []; // 创建一个空的数组

    var i = Obj.length;

    while (i--) {
      buf[i] = deepClone(Obj[i]);
    }

    return buf;
  } else if (Obj instanceof Object) {
    buf = {}; // 创建一个空对象

    for (var k in Obj) {
      // 为这个对象添加新的属性
      buf[k] = deepClone(Obj[k]);
    }

    return buf;
  } else {
    return Obj;
  }
}
/**
 * key字符转换为数组
 */


function toKeys(keyStr) {
  return keyStr.match(/(?:(?!\.|\[|\])\S)+/g) || [];
}
/**
 * 数组key转化为string
 * @param {*} keys key 数组
 * @param {*} data 对象对象
 */


function toKeyStr(keys) {
  var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var str = '';

  if (data instanceof Array) {
    str += "[".concat(keys[index], "]");
  } else if (index) {
    str += ".".concat(keys[index]);
  } else {
    str += "".concat(keys[index]);
  }

  if (index < keys.length - 1) {
    return str + toKeyStr(keys, data[keys[index]], ++index);
  } else {
    return str;
  }
}
/**
 *  对象转换
 * @param {*} obj 传入映射map
 */


function reverse(obj) {
  var newObj = {};
  var isArray = type(obj, ARRAY);

  for (var key in obj) {
    if (type(obj[key], STRING)) {
      newObj[obj[key].trim()] = isArray ? obj[key] : key;
    }
  }

  return newObj;
}
/**
 * 通过关系key获得对应value
 * @param {*} data 数据对象
 * @param {*} keys 关系key
 */


function getValue(data, keys) {
  if (!keys.length) {
    console.warn("".concat(relKey, " is not valid"));
    return;
  }

  var obj = data;

  for (var i = 0; i < keys.length; i++) {
    if (obj instanceof Object) {
      obj = obj[keys[i]];
    } else {
      obj = undefined;
      console.warn("".concat(relKey, " is not valid"));
      break;
    }
  }

  return obj;
}
/**
 * 通过关系key设置对应value
 * @param {*} data 数据对象
 * @param {*} keys 关系key
 * @param {*} data 需要 set 数据
 */


function setValue(data, keys, value) {
  if (!keys.length) {
    return;
  }

  var obj = data;

  for (var i = 0; i < keys.length; i++) {
    if (i === keys.length - 1) {
      obj[keys[i]] = value;
    } else if (obj instanceof Object) {
      obj = obj[keys[i]];
    } else {
      obj = undefined;
      break;
    }
  }

  return obj;
}
/**
 * 定义静态属性
 * @param {*} obj 
 * @param {*} key
 * @param {*} value
 */


function defineStatic(obj, key, value) {
  if (type(obj, OBJECT)) {
    if (type(key, OBJECT)) {
      var properties = {};

      for (var k in key) {
        properties[k] = {
          writable: false,
          configurable: false,
          value: key[k]
        };
      }

      Object.defineProperties(obj, properties);
    } else if (type(key, STRING) && value !== undefined) {
      Object.defineProperty(obj, key, {
        writable: false,
        configurable: false,
        value: value
      });
    }
  }
}