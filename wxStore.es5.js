Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storePage = storePage;
exports.storeComponent = storeComponent;
exports.diff = diff;
exports.deepClone = exports["default"] = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * 微信小程序状态管理
 * 注：1、基础库版本2.7.1
 *    2、如果组件和页面是同时加载时，Component ready时才绑定store attached中可能无法使用store
 *    3、setState中有数组时，如果出现非push类型的修改时需要主动关闭performance模式否者可能出现数据错误
 *    4、actions 方法中 arr === [1, 2] this.set({ arr: [], arr[1, 3, 4]})可实现performance:true下的数组全体换
 */
var storeId = 1;

var WxStore = /*#__PURE__*/function () {
  function WxStore() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        state = _ref.state,
        actions = _ref.actions,
        _ref$performance = _ref.performance,
        performance = _ref$performance === void 0 ? true : _ref$performance,
        _ref$debug = _ref.debug,
        debug = _ref$debug === void 0 ? false : _ref$debug;

    _classCallCheck(this, WxStore);

    this._id = storeId++; // store id

    this._state = state && deepClone(state) || {}; // state

    this._binds = []; // 绑定的实例对象

    this._diffObj = {}; // diff结果

    this._listenerId = 1; // 监听器id

    this._listener = {}; // 监听state改变事件

    this._performance = Boolean(performance); // 是否默认开始新能模式、即优化数组diff

    this._debug = debug; // 开启debug模式后会输出没吃diff数据

    this.actions = {}; // 行为方法

    this._init(actions); // 对actions的初始化

  }
  /**
   * 给actions行为方法绑定指定this
   * @param {*} actions 行为方法
   */


  _createClass(WxStore, [{
    key: "_init",
    value: function _init() {
      var _this = this;

      var actions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      var _loop = function _loop(key) {
        _this.actions[key] = function () {
          // 获取action 绑定指定this
          actions[key].apply({
            get: this._getState.bind(this),
            set: this._setState.bind(this)
          }, [].slice.call(arguments));
        }.bind(_this);
      };

      for (var key in actions) {
        _loop(key);
      }
    }
    /**
     * 拷贝获取state
     * @param {*} relKey 关系key
     */

  }, {
    key: "_getState",
    value: function _getState(relKey) {
      var _this2 = this;

      if (type(relKey, ARRAY)) {
        var obj = {};
        relKey.forEach(function (item) {
          obj[item] = _this2._getState(item);
        });
        return obj;
      } else if (type(relKey, OBJECT)) {
        var _obj = {};

        for (var key in relKey) {
          _obj[key] = this._getState(relKey[key]);
        }

        return _obj;
      } else if (type(relKey, STRING)) {
        return deepClone(getValue(this._state, relKey));
      }
    }
    /**
     * 设置state
     * @param {*} obj set数据对象
     * @param {*} performance 对于set非push改变的数组设置成false，否者会出现set数据错误
     */

  }, {
    key: "_setState",
    value: function _setState(obj) {
      var performance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._performance;

      // 空对象不执行diff update操作
      if (noEmptyObject(obj)) {
        // 根据对象key 提取 state 与对于value比对
        for (var keyStr in obj) {
          // 获取diffObj
          Object.assign(this._diffObj, diff(obj[keyStr], getValue(this._state, keyStr), keyStr, performance)); // 写入store state

          setValue(this._state, keyStr, obj[keyStr]);
        } // 更新


        this._update();
      } else {
        console.warn('check _setState Object');
      }
    }
    /**
     * 更新视图
     */

  }, {
    key: "_update",
    value: function _update() {
      var _this3 = this;

      // Promise 异步实现合并set
      this._pendding = this._pendding || Promise.resolve().then(function () {
        if (noEmptyObject(_this3._diffObj)) {
          // 实例更新
          _this3._binds.forEach(function (that) {
            // 获取diffObj => 实例的新的diff数据
            var obj = getMapData(that.__stores[_this3._id].stateMap, _this3._diffObj); // set实例对象中

            noEmptyObject(obj) && that.setData(obj);
          }); // 监听器回调


          for (var id in _this3._listener) {
            // 获取diffObj => 实例的新的diff数据
            var obj = getMapData(_this3._listener[id].stateMap, _this3._diffObj); // 执行回调

            noEmptyObject(obj) && _this3._listener[id].cb(obj);
          }
        }

        _this3._debug && console.log('diff object:', _this3._diffObj);
        _this3._diffObj = {}; // 清空diff结果

        delete _this3._pendding; // 清除
      });
    }
    /**
     * 绑定对象
     * @param {*} that 实例Page/Component
     * @param {*} map state => 实例data 的映射map
     * @param {*} needSetData 是否需要在绑定时初始化数据到实例
     */

  }, {
    key: "bind",
    value: function bind(that, map) {
      var needSetData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

      // 必须为实例对象
      if (!type(that, OBJECT)) {
        console.warn('check bind this');
        return;
      } // 必须是obj或者arr


      if (!type(map, OBJECT) && !type(map, ARRAY)) {
        console.warn('check bind stateMap');
        map = {};
      } // 获取state=>实例data的指向


      var stateMap = reverseMap(map);

      if (needSetData) {
        var obj = getMapData(stateMap, null, this._state); // 初始化实例的data

        noEmptyObject(obj) && that.setData(obj); // 执行set
      }

      that.__stores = type(that.__stores, OBJECT) ? that.__stores : {}; // 初始化实例对象上的状态映射表
      // 映射对象写入实例对象

      if (that.__stores[this._id]) {
        Object.assign(that.__stores[this._id].stateMap, stateMap);
      } else {
        that.__stores[this._id] = {
          stateMap: stateMap,
          store: this
        };
      }

      !this._binds.find(function (item) {
        return item === that;
      }) && this._binds.push(that); // 实例写入this._binds数组中，用于update找到实例对象
    }
    /**
     * 解除绑定
     * @param {*} that 实例Page/Component
     */

  }, {
    key: "unBind",
    value: function unBind(that) {
      that.__stores && delete that.__stores[this._id]; // 清除状态管理对象映射对象
      // 移除实例绑定

      for (var i = 0; i < this._binds.length; i++) {
        if (this._binds[i] === that) {
          this._binds.splice(i, 1);

          break;
        }
      }
    }
    /**
     * 监听状态改变
     * @param {*} map 监听的数据映射
     * @param {*} cb 监听回调
     */

  }, {
    key: "addListener",
    value: function addListener(map, cb) {
      // map必须为obj或者arr 且cb必须为function
      if (!(type(map, OBJECT) || type(map, ARRAY)) || !type(cb, FUNCTION)) {
        console.warn('check addListener params');
        return;
      } // 获取state=>实例data的指向


      var stateMap = reverseMap(map); // 监听器id

      var id = this._listenerId++; // 监听器数据保存到this._listener中

      this._listener[id] = {
        stateMap: stateMap,
        cb: cb
      }; // id用于remove

      return id;
    }
    /**
    * 移除监听状态改变
    * @param {*} id listener的id
    */

  }, {
    key: "removeListener",
    value: function removeListener(id) {
      if (this._listener[id]) {
        delete this._listener[id];
      }
    }
  }]);

  return WxStore;
}();
/**
 * 重写Page方法，提供自动绑定store自定移除store方法
 * @param {*} options 页面初始化配置
 */


exports["default"] = WxStore;

function storePage(options) {
  options = setOptions(options); // 初始化data、作用是给data里面填入store中的默认state
  // 重写onLoad

  var onLoad = options.onLoad;

  options.onLoad = function () {
    var _this4 = this;

    options.stateMap = options.stateMap || {}; // store必须为对象、stateMap必须为obj或arr

    if (type(options.store, OBJECT) && (type(options.stateMap, OBJECT) || type(options.stateMap, ARRAY))) {
      this.$store = options.store instanceof WxStore ? options.store : new WxStore(options.store); // 传入已经是WxStore实例则直接赋值，否者实例化

      this.$store.bind(this, options.stateMap, false); // 绑定是不初始化data、在实例生产前已写入options中
    } // stores 必须为数组


    if (type(options.stores, ARRAY)) {
      options.stores.forEach(function () {
        var item = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        // store必须为WxStore对象、stateMap必须为obj或arr
        var store = item.store,
            stateMap = item.stateMap;

        if (store instanceof WxStore && (type(stateMap, OBJECT) || type(stateMap, ARRAY))) {
          store.bind(_this4, stateMap);
        }
      });
    }

    type(onLoad, FUNCTION) && onLoad.apply(this, [].slice.call(arguments));
  }; // 重写onUnload


  var onUnload = options.onUnload;

  options.onUnload = function () {
    var _this5 = this;

    type(onUnload, FUNCTION) && onUnload.apply(this, [].slice.call(arguments)); // 执行卸载操作
    // 解除this上的store的绑定

    if (noEmptyObject(this.__stores)) {
      var ids = Object.keys(this.__stores);
      ids.forEach(function (id) {
        _this5.__stores[id].store.unBind(_this5);
      });
    }

    delete this.$store; // 删除store
  };

  Page(options);
}
/**
 * 重写Component方法，提供自动绑定store自定移除store方法
 * @param {*} options 组件初始化配置
 */


function storeComponent(options) {
  options = setOptions(options); // 初始化data、作用是给data里面填入store中的默认state

  var opts = options.lifetimes && options.lifetimes.ready ? options.lifetimes : options; // 重写ready

  var ready = opts.ready;

  opts.ready = function () {
    var _this6 = this;

    // 传入已经是WxStore实例则直接赋值，否者获取Page的$store
    this.$store = options.store instanceof WxStore ? options.store : getCurrentPage(this).$store || new WxStore({});
    options.stateMap = options.stateMap || {}; // stateMap必须为Object或Array

    if (type(options.stateMap, OBJECT) || type(options.stateMap, ARRAY)) {
      this.$store.bind(this, options.stateMap); // 绑定是不初始化data、在实例生产前已写入options中
    } // stores 必须为数组


    if (type(options.stores, ARRAY)) {
      options.stores.forEach(function (item) {
        // store必须为WxStore对象、stateMap必须为obj或arr
        var store = item.store,
            stateMap = item.stateMap;

        if (store instanceof WxStore && (type(stateMap, OBJECT) || type(stateMap, ARRAY))) {
          store.bind(_this6, stateMap);
        }
      });
    }

    type(ready, FUNCTION) && ready.apply(this, [].slice.call(arguments));
  };

  opts = options.lifetimes && options.lifetimes.detached ? options.lifetimes : options; // 重写detached

  var detached = opts.detached;

  opts.detached = function () {
    var _this7 = this;

    type(detached, FUNCTION) && detached.apply(this, [].slice.call(arguments)); // 执行卸载操作
    // 解除this上的store的绑定

    if (noEmptyObject(this.__stores)) {
      var ids = Object.keys(this.__stores);
      ids.forEach(function (id) {
        _this7.__stores[id].store.unBind(_this7);
      });
    }

    delete this.$store; // 删除store
  };

  Component(options);
}
/**
 * 根据 store、stateMap在页面、组件初始化配置初始化data，组件要初始化data也必须传store
 * @param {*} options 页面初始化时
 */


function setOptions(options) {
  if (type(options.store, OBJECT) && (type(options.stateMap, OBJECT) || type(options.stateMap, ARRAY))) {
    var obj = getMapData(reverseMap(options.stateMap), null, options.store.state); // 初始化实例的data

    options.data = type(options.data, OBJECT) ? options.data : {};
    Object.assign(options.data, obj);
  }

  return options;
}
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

  if (type(pre, ARRAY) && type(current, ARRAY)) {
    if (performance && current.length > pre.length) {
      // 性能模式下数组push
      for (var i = pre.length; i < current.length; i++) {
        diffObj["".concat(prefix, "[").concat(i, "]")] = current[i];
      }
    } else {
      // 其他情况数组
      diffObj[prefix] = current;
    }
  } else if (type(pre, OBJECT) && type(current, OBJECT)) {
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
/**
 * 深拷贝
 * @param {*} Obj 对象
 */


var deepClone = function deepClone(Obj) {
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
  }

  return Obj;
};
/**
 * 根据具体diff 及 映射map 获得最终setData对象
 * @param {*} map 映射map
 * @param {*} diffObj diff对象
 * @param {*} state 元数据，初始化时使用
 */


exports.deepClone = deepClone;

function getMapData(map, diffObj, state) {
  if (!noEmptyObject(map)) return {};
  var obj = {}; // 传入diffObj执行映射转换、传null直接初始化

  if (diffObj) {
    // diff结果与映射的双重比对
    var reg = RegExp("^(".concat(Object.keys(map).join('|'), ")((?=(?:\\.|\\[))|$)"));

    for (var key in diffObj) {
      var match = false;
      var newKey = key.replace(reg, function (s) {
        match = true;
        return map[s] || s;
      });

      if (match) {
        obj[newKey] = diffObj[key];
      }
    }
  } else if (type(state, OBJECT)) {
    // 在初始化实例data使用
    for (var _key in map) {
      obj[map[_key]] = deepClone(getValue(state, _key));
    }
  }

  return obj;
}
/**
 * stateMap 映射转换
 * @param {*} map 传入映射map
 */


function reverseMap(map) {
  var newMap = {};
  var isArray = type(map, ARRAY);

  for (var key in map) {
    if (type(map[key], STRING)) {
      newMap[map[key]] = isArray ? map[key] : key;
    }
  }

  return newMap;
}
/**
 * 通过关系key获得对应value
 * @param {*} state 数据对象
 * @param {*} relKey 关系key
 */


function getValue(state, relKey) {
  var keys = relKey.match(/(?:(?!\.|\[|\])\S)+/g) || [];

  if (!keys.length) {
    return;
  }

  var obj = state;

  for (var i = 0; i < keys.length; i++) {
    if (obj instanceof Object) {
      obj = obj[keys[i]];
    } else {
      obj = undefined;
      break;
    }
  }

  return obj;
}
/**
 * 通过关系key设置对应value
 * @param {*} state 数据对象
 * @param {*} relKey 关系key
 * @param {*} data 需要 set 数据
 */


function setValue(state, relKey, data) {
  var keys = relKey.match(/(?:(?!\.|\[|\])\S)+/g) || [];

  if (!keys.length) {
    return;
  }

  var obj = state;

  for (var i = 0; i < keys.length; i++) {
    if (i === keys.length - 1) {
      obj[keys[i]] = deepClone(data);
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
 * 类型判断
 */


var STRING = 'String';
var OBJECT = 'Object';
var ARRAY = 'Array';
var FUNCTION = 'Function';

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
 */


function noEmptyObject(obj) {
  return !!(type(obj, OBJECT) && Object.keys(obj).length);
}
/**
 * 组件中获取当前页面 2.7.1支持
 */


function getCurrentPage(that) {
  var pageId = that.getPageId();
  var pages = getCurrentPages();

  for (var i = 0; i < pages.length; i++) {
    if (pages[i].getPageId() === pageId) {
      return pages[i];
    }
  }
}
