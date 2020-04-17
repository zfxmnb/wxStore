Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.storePage = storePage;
exports.storeComponent = storeComponent;
exports["default"] = void 0;

var _observer2 = _interopRequireDefault(require("./utils/observer"));

var _diff = _interopRequireDefault(require("./utils/diff"));

var _utils = require("./utils/utils");

var _instanceUtils = require("./utils/instanceUtils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var supportProxy = !!Proxy; // 是否支持Proxy

var STORES = {}; // store 实例集

var storeId = 1; // store id

var listenerId = 1; // 监听器id

var WxStore = /*#__PURE__*/function () {
  function WxStore() {
    var _this = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$state = _ref.state,
        state = _ref$state === void 0 ? {} : _ref$state,
        _ref$actions = _ref.actions,
        actions = _ref$actions === void 0 ? {} : _ref$actions,
        _ref$debug = _ref.debug,
        debug = _ref$debug === void 0 ? false : _ref$debug;

    _classCallCheck(this, WxStore);

    this._state = (0, _utils.deepClone)(state);

    if (supportProxy) {
      (0, _utils.defineStatic)(this, 'state', (0, _observer2["default"])((0, _utils.deepClone)(state), this._observer.bind(this))); // 监听对象变化
    } else {
      this.state = (0, _utils.deepClone)(state); // state
    }

    this._id = storeId++; // store id

    this._binds = []; // 绑定的实例对象

    this._diffObj = {}; // diff结果

    this._observerList = []; // Proxy监听state

    this._listener = {}; // 监听state改变事件

    this._debug = debug; // 开启debug模式后会输出没吃diff数据

    (0, _utils.defineStatic)(this, 'actions', {}); // 行为方法

    Object.keys(actions).forEach(function (key) {
      _this.actions[key] = actions[key].bind(_this);
    });
  }
  /**
   * 监听
   */


  _createClass(WxStore, [{
    key: "_observer",
    value: function _observer(keys, value) {
      var i = 0;
      var len = keys.length; // 判断是否覆盖已有，如果覆盖则移除旧的push新的

      while (i < this._observerList.length) {
        var item = this._observerList[i];

        if (item.keys.length >= len) {
          var match = true;

          for (var j = 0; j < len; j++) {
            if (keys[j] !== item.keys[j]) {
              match = false;
              break;
            }
          }

          if (match) {
            this._observerList.splice(i, 1);
          } else {
            i++;
          }
        } else {
          i++;
        }
      }

      this._observerList.push({
        keys: keys,
        value: value
      });
    }
    /**
     * 将state监听到的变化写入diff对象中用于最终的setData，且将变化同步到_state
     */

  }, {
    key: "_observerSet",
    value: function _observerSet() {
      var _this2 = this;

      this._observerList.forEach(function (_ref2) {
        var keys = _ref2.keys,
            value = _ref2.value;
        value = (0, _utils.deepClone)(value); // 根据对象key 提取 state 与对于value比对

        var keyStr = (0, _utils.toKeyStr)(keys, _this2._state); // 空对象不执行diff update操作

        if ((0, _utils.noEmptyObject)(value, true)) {
          // 获取diffObj
          Object.assign(_this2._diffObj, (0, _diff["default"])(value, (0, _utils.getValue)(_this2._state, keys), keyStr));
        } else {
          Object.assign(_this2._diffObj, _defineProperty({}, keyStr, value));
        } // 同步到_state


        (0, _utils.setValue)(_this2._state, keys, value);
      });

      this._observerList = [];
    }
    /**
     * 设置state
     * @param {*} obj set数据对象
     */

  }, {
    key: "_diffSet",
    value: function _diffSet() {
      // 获取diffObj
      Object.assign(this._diffObj, (0, _utils.deepClone)((0, _diff["default"])(this.state, this._state))); // 写入store state

      for (var key in this._diffObj) {
        var keys = (0, _utils.toKeys)(key);
        (0, _utils.setValue)(this._state, keys, this._diffObj[key]);
      }
    }
    /**
     * 更新视图
     * @param {*} obj 更新对象
     * @param {*} imm 是否立即更新视图
     */

  }, {
    key: "update",
    value: function update(obj, imm) {
      // 支持update写入更改state
      if ((0, _utils.type)(obj, _utils.OBJECT)) {
        for (var key in obj) {
          var keys = (0, _utils.toKeys)(key);
          (0, _utils.setValue)(this.state, keys, obj[key]);
        }
      }

      if (imm) {
        // 立即执行
        return this._set();
      } else {
        // 合并执行
        return this._merge();
      }
    }
    /**
     * 合并多次set
     */

  }, {
    key: "_merge",
    value: function _merge() {
      var _this3 = this;

      // Promise实现合并set
      // eslint-disable-next-line no-return-assign
      return this._pendding = this._pendding || Promise.resolve().then(function () {
        return _this3._set();
      });
    }
    /**
     * 设置映射数据
     */

  }, {
    key: "_set",
    value: function _set() {
      var _this4 = this;

      return new Promise(function (resolve) {
        if (supportProxy) {
          // 支持Proxy的
          _this4._observerSet();
        } else {
          // 用于不支持Proxy
          _this4._diffSet();
        }

        if ((0, _utils.noEmptyObject)(_this4._diffObj)) {
          var count = 0;

          var diffObj = _objectSpread({}, _this4._diffObj); // 实例更新


          _this4._binds.forEach(function (that) {
            // 获取diffObj => 实例的新的diff数据
            var obj = _this4._getMapData(that.__stores[_this4._id].stateMap); // set实例对象中


            if ((0, _utils.noEmptyObject)(obj)) {
              count++;
              that.setData(obj, function () {
                count--;

                if (count <= 0) {
                  resolve(diffObj);
                }
              });
            }
          }); // 监听器回调


          for (var id in _this4._listener) {
            // 监听
            if (_this4._isChange(_this4._listener[id].map)) {
              // 执行回调
              _this4._listener[id].fn(_this4._listener[id].map.map(function (key) {
                return (0, _utils.deepClone)((0, _utils.getValue)(_this4._state, (0, _utils.toKeys)(key)));
              }));
            }
          }

          if (count <= 0) {
            resolve(diffObj);
          } // debug diff 结果输出


          _this4._debug && console.log('diff object:', _this4._diffObj);
          _this4._diffObj = {}; // 清空diff结果
        } else {
          resolve({});
        }

        delete _this4._pendding; // 清除
      });
    }
    /**
     * 绑定对象
     * @param {*} that 实例Page/Component
     * @param {*} map state => 实例data 的映射map
     * @param {*} extend bind时映射到data的扩展字段
     */

  }, {
    key: "bind",
    value: function bind(that, map) {
      var extend = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

      // 必须为实例对象
      if (!(0, _utils.type)(that, _utils.OBJECT)) {
        console.warn('[wxStore] check bind this');
        return;
      } // 必须是obj或者arr


      if (!(0, _utils.type)(map, _utils.OBJECT) && !(0, _utils.type)(map, _utils.ARRAY)) {
        console.warn('[wxStore] check bind stateMap');
        map = {};
      } // 获取state=>实例data的指向


      var id = this._id;
      var stateMap = (0, _utils.reverse)(map);
      var obj = initData(stateMap, this._state); // 初始化实例的data

      Object.assign(obj, extend); // bind 初始化setData扩展字段

      that.setData(obj); // 执行set

      that.__stores = (0, _utils.type)(that.__stores, _utils.OBJECT) ? that.__stores : {}; // 初始化实例对象上的状态映射表
      // 映射对象写入实例对象

      if (that.__stores[id]) {
        Object.assign(that.__stores[id].stateMap, stateMap);
      } else {
        that.__stores[id] = {
          stateMap: stateMap,
          store: this
        };
      }

      !this._binds.find(function (item) {
        return item === that;
      }) && this._binds.push(that); // 实例写入this._binds数组中，用于update找到实例对象

      STORES[id] || (STORES[id] = this); // 已bind store 存入STORES集合
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
      } // bind列表空时，在STORES删除store


      if (!this._binds.length) {
        delete STORES[this._id];
      }
    }
    /**
     * 监听状态改变
     * @param {*} map 监听的数据映射
     * @param {*} fn 监听回调
     */

  }, {
    key: "on",
    value: function on(map, fn, that) {
      if ((0, _utils.type)(map, _utils.STRING)) {
        // eslint-disable-next-line no-useless-escape
        map = map.split(/\s*\,\s*/g);
      } // map必须为obj或者arr 且fn必须为function


      if (!(0, _utils.noEmptyObject)(map, true) || !(0, _utils.type)(fn, _utils.FUNCTION)) {
        console.warn('[wxStore] check on params');
        return;
      } // 获取监听state的映射


      map = (0, _utils.deepClone)(map); // 监听器id

      var id = listenerId++; // 监听器数据保存到this._listener中

      this._listener[id] = {
        map: map,
        fn: fn
      };

      if ((0, _utils.type)(that, _utils.OBJECT)) {
        that.__listener = (0, _utils.type)(that.__listener, _utils.OBJECT) ? that.__listener : {};
        that.__listener[id] = this;
      } // id用于remove


      return id;
    }
    /**
    * 移除监听状态改变
    * @param {*} id listener的id
    */

  }, {
    key: "remove",
    value: function remove(id) {
      if (this._listener[id]) {
        delete this._listener[id];
      }
    }
    /**
     * 根据具体diff 及 映射map 获得最终setData对象
     * @param {*} map 映射map
     */

  }, {
    key: "_getMapData",
    value: function _getMapData(map) {
      if (!(0, _utils.noEmptyObject)(map)) return {};
      var obj = {}; // diff结果与映射的双重比对

      var reg = RegExp("^(".concat(Object.keys(map).join('|'), ")((?=(?:\\.|\\[))|$)"));

      for (var key in this._diffObj) {
        var match = false;
        var newKey = key.replace(reg, function (s) {
          match = true;
          return map[s] || s;
        });

        if (match) {
          obj[newKey] = this._diffObj[key];
        }
      }

      return obj;
    }
    /**
     * 监听的对象是否修改
     * @param {*} map
     */

  }, {
    key: "_isChange",
    value: function _isChange(map) {
      // diff结果与映射的双重比对
      var reg = RegExp("^(".concat(map.join('|'), ")((?=(?:\\.|\\[))|$)"));

      for (var key in this._diffObj) {
        if (key.match(reg)) {
          return true;
        }
      }

      return false;
    }
  }]);

  return WxStore;
}();
/**
 * 挂载
 * @param {*} ops 实例配置
 * @param {*} fixed 组件是否脱离Page store采用自己的store
 */


exports["default"] = WxStore;

function Attached(ops, fixed) {
  var _this5 = this;

  ops.stateMap = ops.stateMap || {};
  ops.store = ops.store || {}; // store必须为对象、stateMap必须为Object或Array

  if ((0, _utils.type)(ops.store, _utils.OBJECT) && ((0, _utils.type)(ops.stateMap, _utils.OBJECT) || (0, _utils.type)(ops.stateMap, _utils.ARRAY))) {
    var _ref3 = this.properties || {},
        _ref3$STOREID = _ref3.STOREID,
        STOREID = _ref3$STOREID === void 0 ? 0 : _ref3$STOREID; // store 如果是Wxstore的实例则直接使用，否则使用id为STOREID的store，fixed === true 使用页面级store， 否则通过store配置生产新的store


    this.store = ops.store instanceof WxStore ? ops.store : STORES[STOREID] || !fixed && (0, _instanceUtils.getCurrentPage)(this).store || new WxStore(ops.store); // 传入已经是WxStore实例则直接赋值，否者实例化

    this.store.bind(this, ops.stateMap, fixed ? {
      STOREID: this.store._id
    } : {}); // 绑定是不初始化data、在实例生产前已写入options中
  } // stores 必须为数组


  if ((0, _utils.type)(ops.stores, _utils.ARRAY)) {
    ops.stores.forEach(function () {
      var item = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      // store必须为WxStore对象、stateMap必须为Object或Array
      var store = item.store,
          stateMap = item.stateMap;

      if (store instanceof WxStore && ((0, _utils.type)(stateMap, _utils.OBJECT) || (0, _utils.type)(stateMap, _utils.ARRAY))) {
        store.bind(_this5, stateMap);
      }
    });
  }
}
/**
 * 取消挂载
 */


function Detached() {
  // 解除this上的listener的绑定
  if ((0, _utils.noEmptyObject)(this.__listener)) {
    for (var id in this.__listener) {
      this.__listener[id].remove(id);
    }

    delete this.__listener;
  } // 解除this上的store的绑定


  if ((0, _utils.noEmptyObject)(this.__stores)) {
    for (var _id in this.__stores) {
      this.__stores[_id].store.unBind(this);
    }

    delete this.__stores;
  }

  delete this.store; // 删除store
}
/**
 * 重写Page方法，提供自动绑定store自定移除store方法
 * @param {*} ops 页面初始化配置
 */


function storePage(ops) {
  setOptions(ops); // 初始化data、作用是给data里面填入store中的默认state
  // 重写onLoad

  var onLoad = ops.onLoad;

  ops.onLoad = function () {
    Attached.call(this, ops, true);
    (0, _utils.type)(onLoad, _utils.FUNCTION) && onLoad.apply(this, [].slice.call(arguments));
  }; // 重写onUnload


  var onUnload = ops.onUnload;

  ops.onUnload = function () {
    (0, _utils.type)(onUnload, _utils.FUNCTION) && onUnload.apply(this, [].slice.call(arguments)); // 执行卸载操作

    Detached.call(this);
  };

  Page(ops);
}
/**
 * 重写Component方法，提供自动绑定store自定移除store方法
 * @param {*} ops 组件初始化配置
 */


function storeComponent(ops) {
  setOptions(ops, true); // 初始化data、作用是给relateddata里面填入store中的默认state

  var name = ops.fixed ? 'attached' : 'ready';
  var opts = ops.lifetimes && ops.lifetimes[name] ? ops.lifetimes : ops; // 重写ready

  var init = opts[name];

  opts[name] = function () {
    Attached.call(this, ops, ops.fixed);
    (0, _utils.type)(init, _utils.FUNCTION) && init.apply(this, [].slice.call(arguments));
  };

  opts = ops.lifetimes && ops.lifetimes.detached ? ops.lifetimes : ops; // 重写detached

  var detached = opts.detached;

  opts.detached = function () {
    (0, _utils.type)(detached, _utils.FUNCTION) && detached.apply(this, [].slice.call(arguments)); // 执行卸载操作

    Detached.call(this);
  };

  Component(ops);
}
/**
 * diff
 */


exports.diff = _diff["default"];
/**
 * 根据 store、stateMap在页面、组件初始化配置初始化data，组件要初始化data也必须传store
 * @param {*} ops 页面初始化时
 * @param {*} isComponent 组件
 */

function setOptions(ops, isComponent) {
  if ((0, _utils.type)(ops.store, _utils.OBJECT) && ((0, _utils.type)(ops.stateMap, _utils.OBJECT) || (0, _utils.type)(ops.stateMap, _utils.ARRAY))) {
    var reverseMap = (0, _utils.reverse)(ops.stateMap);
    var obj = initData(reverseMap, ops.store.state); // 初始化实例的data

    ops.data = (0, _utils.type)(ops.data, _utils.OBJECT) ? ops.data : {};
    Object.assign(ops.data, obj);
  } // 给组件注入STOREID属性


  if (isComponent) {
    ops.properties = ops.properties || {};
    ops.properties = {
      STOREID: Number
    };
  }

  return ops;
}
/**
 * 初始化数据
 * @param {*} map
 * @param {*} data
 */


function initData(map, data) {
  var obj = {}; // 初始化实例的data

  if ((0, _utils.noEmptyObject)(map) && (0, _utils.type)(data, _utils.OBJECT)) {
    // 在初始化实例data使用
    for (var key in map) {
      var keys = (0, _utils.toKeys)(key);
      obj[map[key]] = (0, _utils.deepClone)((0, _utils.getValue)(data, keys));
    }
  }

  return obj;
}
