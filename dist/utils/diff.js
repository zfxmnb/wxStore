Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = diff;

var _utils = require("./utils");

/**
 * diff
 * @param {*} current 当前数据
 * @param {*} pre 原数据
 * @param {*} prefix diff key 前缀
 * @param {*} performance 是否开始数组performance模式，开始后可对push类型数组diff优化，若非push改变的数组可能会出现数据错误
 */
function diff(current, pre) {
  var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var performance = arguments.length > 3 ? arguments[3] : undefined;
  var diffObj = {};

  if ((0, _utils.type)(pre, _utils.ARRAY) && (0, _utils.type)(current, _utils.ARRAY)) {
    if (current.length < pre.length) {
      // 数据length比原数据小，全替换
      diffObj[prefix] = current;
    } else {
      // 数据length比原数据大
      if (!performance) {
        // 非性能模式下数组每一项深层diff
        for (var i = 0; i < pre.length; i++) {
          Object.assign(diffObj, diff(current[i], pre[i], "".concat(prefix ? "".concat(prefix, "[").concat(i, "]") : "[".concat(i, "]")), performance));
        }
      }

      if (current.length > pre.length) {
        // 性能模式下数组push
        for (var _i = pre.length; _i < current.length; _i++) {
          diffObj["".concat(prefix, "[").concat(_i, "]")] = current[_i];
        }
      }
    }
  } else if ((0, _utils.type)(pre, _utils.OBJECT) && (0, _utils.type)(current, _utils.OBJECT)) {
    // 对象
    var keys = Object.keys(pre);
    keys.forEach(function (key) {
      Object.assign(diffObj, diff(current[key], pre[key], "".concat(prefix ? "".concat(prefix, ".").concat(key) : key), performance));
    });
  } else if (prefix && current !== pre) {
    // 非数组非对象
    diffObj[prefix] = current;
  }

  return diffObj;
}