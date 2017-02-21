/*
 * @name: z-eventemitter
 * @version: 1.0.0
 * @description: javascript EventEmitter
 * @author: zbm2001@aliyun.com
 * @license: Apache 2.0
 */
'use strict';

const toString = Object.prototype.toString;

/**
 * judge a object type name
 *
 * @param  {Object|Null|Undefined|String|Number|Function|Array|RegExp|HTMLDocument|HTMLHtmlElement|NodeList|XMLHttpRequest|...} object any
 * @return {String} string of type name, initials Capitalized
 */
function typeOf(object) {
  return toString.call(object).slice(8, -1)
}

const sNativeCode = (s => s.slice(s.indexOf('{')))(isNaN + '');
/**
 * test function is a javascript native method
 *
 * @param {Function} func native function of javascript
 * @return {Boolean}
 */
function isNativeFunction(func) {
  return typeOf(func) === 'Function' && sNativeCode === (func += '').slice(func.indexOf('{'))
}

if (!isNativeFunction(Object.assign)) {
  /**
   * polyfill es2015 Object.assign
   *
   * @param {Object} target
   * @returns {Object} target
   */
  Object.assign = function assign(target/*, ...args*/) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object')
    }

    let output = Object(target),
        i = -1,
        args = Array.prototype.slice.call(arguments, 1),
        l = args.length;

    while (++i < l) {
      let source = args[i];

      if (source) {
        for (let prop in source) {
          if (source.hasOwnProperty(prop)) {
            output[prop] = source[prop];
          }
        }
      }
    }
    return output
  };
}

var assign = Object.assign;

if (!isNativeFunction(Object.create)) {

  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const REFERENCE_TYPE = {
    'object': !0,
    'function': !0
  };

  /**
   * polyfill es5 Object.create
   *
   * @param {Object} object
   * @param {Object} props
   * @returns {Object} like {__proto__: *}
   */
  Object.create = function create(object, props) {
    if (object == null || !REFERENCE_TYPE[typeof object]) {
      throw 'Object prototype may only be an Object or null'
    }

    let proto = {__proto__: object};

    if (props) {
      if (REFERENCE_TYPE[typeof props]) {
        for (let propName in props) {
          if (hasOwnProperty.call(props, propName)) {
            let prop = props[propName];

            if (prop && REFERENCE_TYPE[typeof prop]) {
              object[propName] = prop.value;
            } else {
              throw 'Property description must be an object: value'
            }
          }
        }
      }
    }
    return proto
  };
}

var create = Object.create;

/**
 * 全局唯一标识符（GUID，Globally Unique Identifier）也称作 UUID(Universally Unique IDentifier) 。
 * GUID是一种由算法生成的二进制长度为128位的数字标识符。
 * GUID 的格式为“xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx”，其中的 x 是 0-9 或 a-f 范围内的一个32位十六进制数。
 * 在理想情况下，任何计算机和计算机集群都不会生成两个相同的GUID。
 * GUID 的总数达到了2^128（3.4×10^38）个，所以随机生成两个相同GUID的可能性非常小，但并不为0。
 * GUID一词有时也专指微软对UUID标准的实现。
 */

/**
 * string of 4 chars
 *
 * return {String} length{4} 0-9 or a-f 范围内的一个32位十六进制数
 */
function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
}

/**
 * 生成一个全局唯一标识符
 * @return {String} length{36} 返回格式为：“xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx” 的字符串
 */
function uuid() {
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
}

/**
 * 事件对象构造器
 *
 * @param {String} event type.
 * @return {Object} event object.
 * @api private
 */
function Event () {
}

assign(Event.prototype, {
  // 事件类型
  type: '',
  // 捕获阶段
  CAPTURING_PHASE: 1,
  // 在目标组件上上
  AT_TARGET: 2,
  // 冒泡阶段
  BUBBLING_PHASE: 3,
  // 事件所处的阶段
  eventPhase: 0,
  // 事件绑定的目标组件上
  currentTarget: null,
  // 事件发生的目标组件
  target: null,
  // 事件为冒泡模型
  bubbles: true,
  // 是否已取消冒泡
  cancelBubble: false,
  // 是否可以取消事件默认行为
  cancelable: true,
  // 是否已阻止事件默认行为
  returnValue: true,

  /**
   * 初始化事件对象
   *
   * @param {String} type 事件名称
   * @param {Object} currentTarget 注册事件的对象
   * @param {Object} target 事件发生时所在的对象
   * @param {Boolean} bubbles 设置事件是否为冒泡模型
   * @return {Boolean} cancelable 设置事件是否可以取消冒泡事件
   * @api public
   */
  initEvent: function initEvent (type, currentTarget, target, bubbles, cancelable) {
    this.type = type;
    this.currentTarget = currentTarget;
    this.target = target || currentTarget;
    this.timeStamp = Date.now();
    this.bubbles = !!bubbles;
    this.cancelable = !!cancelable;
    if (!this.bubbles) {
      this.cancelBubble = true;
      this.stopPropagation = returnFalse;
      this.isPropagationStopped = returnTrue;
    }
    if (!this.cancelable) {
      this.preventDefault = returnFalse;
    }
    return this
  },

  /**
   * 阻止事件默认行为
   *
   * @api public
   */
  preventDefault: function preventDefault () {
    this.preventDefault = this.isDefaultPrevented = returnTrue;
    this.returnValue = false;
    return true
  },

  isDefaultPrevented: returnFalse,

  /**
   * 阻止事件冒泡
   *
   * @api public
   */
  stopPropagation: function stopPropagation () {
    this.stopPropagation = this.isPropagationStopped = returnTrue;
    this.cancelBubble = true;
    return true
  },

  isPropagationStopped: returnFalse,

  /**
   * 阻止事件冒泡，并且终止当前所在事件队列的后续触发
   *
   * @api public
   */
  stopImmediatePropagation: function stopImmediatePropagation () {
    this.stopPropagation();
    this.stopImmediatePropagation = this.isImmediatePropagationStopped = returnTrue;
    return true
  },

  isImmediatePropagationStopped: returnFalse

});

function returnTrue () {
  return true
}

function returnFalse () {
  return false
}

var Event$1 = assign(Event, {

  // 捕获阶段
  CAPTURING_PHASE: 1,
  // 在目标组件上上
  AT_TARGET: 2,
  // 冒泡阶段
  BUBBLING_PHASE: 3,
  returnTrue: returnTrue,
  returnFalse: returnFalse
});

var listenerWrapperSignKey = uuid();
var listenerWrapperSignIndex = 0;
var listenerWrapperSignRedundantIndex = [];

/**
 * 查找侦听器在侦听器数组中的索引
 *
 * @param {Array[Object]} listeners 侦听器对象数组
 * @param {Object|Function} listener 侦听器对象或处理函数
 * @return {Number} 返回索引，-1表示未找到
 * @api private
 */
function indexOfListener (listeners, listener) {
  var i = listeners.length;
  if (listener) {
    switch (typeof listener) {
      case 'function':
        while (i--) {
          if (listeners[i].handleEvent === listener) {
            return i;
          }
        }
        return -1;

      case 'object':
        while (i--) {
          if (listeners[i].listener === listener) {
            return i;
          }
        }
        return -1
    }
  }
  return -1
}

/**
 * 包装侦听器数组
 *
 * @param {Array[Object|Function]} listenerArgs 侦听器对象（或函数）数组
 * @return {Array[Object]} 返回一个新的包装后的对象数组
 * @api private
 */
function wrapListenerArgs (listenerArgs, limit) {
  var i = 0,
      l = listenerArgs.length,
      listenerWrappers = [],
      listener;
  typeof limit !== 'number' && (limit = Infinity);
  outer: while (++i < l) {
    listener = listenerArgs[i];
    if (listener) {
      switch (typeof listener) {
        case 'function':
          listenerWrappers.push(( obj = {
            listener: null,
            handleEvent: listener,
            limit: limit
          }, obj[listenerWrapperSignKey] = listenerWrapperSignRedundantIndex.pop() || ++listenerWrapperSignIndex, obj ));
      var obj;
          continue outer

        case 'object':
          listenerWrappers.push(listener[listenerWrapperSignKey] ? listener : ( obj$1 = {
                listener: listener,
                handleEvent: null,
                limit: limit
              }, obj$1[listenerWrapperSignKey] = listenerWrapperSignRedundantIndex.pop() || ++listenerWrapperSignIndex, obj$1 ));
      var obj$1;
          continue outer
      }
    }
  }
  return listenerWrappers
}

/**
 * 通过指定的对象方法名生成别名函数
 * 运行时闭包函数引用指定的方法绑定this上下文并执行
 *
 * @param {String} name 原方法名
 * @return {Function} 返回闭包函数
 * @api private
 */
function alias (name) {
  return function aliasClosure () {
    return this[name].apply(this, arguments)
  }
}

function EventEmitter () {}

assign(EventEmitter.prototype, {

  _events: null,

  eventTypeDelimiter: /\s+/,

  /**
   * 添加事件侦听器
   *
   * 若对应的事件类型队列中已存在，并已包含了该侦听器，添加将被忽略
   * 若是一个类正则对象（具备.test方法的任意对象）并匹配已存在的事件类型，则向该事件类型队列做添加操作
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Array[Function|Object]} listenerArgs 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this 返回当前对象
   * @api public
   */
  addListener: function addListener(evt /*, ...listenerArgs*/) {
    var events,
        listeners,
        types,
        type,
        i,
        listenerWrappers,
        listenerArgs = Array.prototype.slice.call(arguments, 1),
        l = listenerArgs.length;

    // 必须至少包含两个参数
    if (!evt || !l) {
      return this
    }

    events = this._events;
    listenerWrappers = wrapListenerArgs(listenerArgs);

    switch (typeof evt) {
        // 若为事件名
      case 'string':
        // 若为通配符
        if (evt === '*') {
          if (events) {
            for (type in events) {
              listeners = events[type];
              adds();
            }
          }
        } else {
          types = evt.split(this.eventTypeDelimiter);
          i = types.length;
          // 添加到队列
          if (events) {
            while (i--) {
              if (events.hasOwnProperty(types[i])) {
                listeners = events[types[i]];
                adds();
              } else {
                events[types[i]] = listenerWrappers.slice();
              }
            }
          }
          // 创建新的队列
          else {
            events = this._events = {};
            while (i--) {
              events[types[i]] = listenerWrappers.slice();
            }
          }
        }
        break

      default:
        // 若包含一个类正则匹配的 test 方法
        if (typeof evt.test === 'function') {
          // 只匹配已存在的事件名
          if (events) {
            for (type in events) {
              if (evt.test(type)) {
                listeners = events[type];
                adds();
              }
            }
          }
        }
    }

    listenerWrappers.emittingIndex = -1;

    return this

    function adds () {
      var i = -1;
      while (++i < l) {
        if (indexOfListener(listeners, listenerWrappers[i].listener || listenerWrappers[i].handleEvent) < 0) {
          listeners.push(listenerWrappers[i]);
        }
      }
    }
  },

  /**
   * addListener 别名方法
   */
  on: alias('addListener'),

  /**
   * 注册只执行一次的事件
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Array[Function|Object]} listenerArgs 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this
   */
  addOnceListener: function addOnceListener(evt/*, ...listenerArgs*/) {
    var listenerArgs = Array.prototype.slice.call(arguments, 1),
        listenerWrappers = wrapListenerArgs(listenerArgs, 1);
    return this.addListener.apply(this, [evt].concat(listenerWrappers))
    // return this.addListener(evt, ...listenerWrappers)
  },

  /**
   * addOnceListener 别名方法
   */
  once: alias('addOnceListener'),

  /**
   * 注册限制执行次数的事件
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Number} limit 限制事件执行的次数
   * @param {Array[Function|Object]} listenerArgs 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this
   */
  addLimitListener: function addLimitListener(evt, limit/*, ...listenerArgs*/) {
    var listenerArgs = Array.prototype.slice.call(arguments, 2),
        listenerWrappers = wrapListenerArgs(listenerArgs, limit);
    return this.addListener.apply(this, [evt].concat(listenerWrappers))
    // return this.addListener(evt, ...listenerWrappers)
  },

  /**
   * addLimitListener 别名方法
   */
  onlimit: alias('addLimitListener'),

  /**
   * 删除事件定义的事件
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Array[Function|Object]} listenerArgs 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this
   * @api public
   */
  removeListener: function removeListener(evt/*, ...listenerArgs*/) {
    var this$1 = this;

    var events = this._events,
        types,
        l,
        type;

    if (!evt || !events) {
      return this
    }
    var listenerArgs = Array.prototype.slice.call(arguments, 1);

    switch (typeof evt) {
        // 若为事件名
      case 'string':
        // 若为通配符
        if (evt === '*') {
          for (type in events) {
            filter(events, type, listenerArgs);
          }
        } else {
          types = evt.split(this.eventTypeDelimiter);
          l = types.length;

          while (--l > -1) {
            type = types[l];
            if (events[type]) {
              filter(events, type, listenerArgs);
            }
          }
        }
        break

      default:
        // 若包含一个类正则匹配的 test 方法
        if (typeof evt.test === 'function') {
          for (type in events) {
            // 只匹配已存在的事件名
            if (evt.test(type)) {
              filter(events, type, listenerArgs);
            }
          }
        }
    }
    // 若还存在事件队列，直接返回
    for (type in events) {
      return this$1
    }
    // 否则，清除事件对象
    delete this._events;
    return this

    function filter (events, type, listenerArgs) {
      var l = listenerArgs.length,
          i = 0,
          listenerWrappers = events[type];
      if (l) {
        do {
          if ((index = indexOfListener(listenerWrappers, listenerArgs[i])) > -1) {
            listenerWrapperSignRedundantIndex.push(listenerWrappers[index][listenerWrapperSignKey]);
            listenerWrappers.splice(index, 1);
            // 若数组长度为0，清除队列并返回
            if (!listenerWrappers.length) {
              delete events[type];
              return
            }
            // 若事件触发索引不小于删除的事件索引，减计事件触发索引
            listenerWrappers.emittingIndex < index || listenerWrappers.emittingIndex--;
          }
        } while (++i < l)
      } else {
        listenerWrappers.length = 0;
        delete events[type];
      }
    }
  },

  /**
   * removeListener 的别名方法
   * @api public
   */
  off: alias('removeListener'),

  /**
   * 添加事件侦听器到所有已存在的事件队列
   *
   * 若对应的事件类型队列中已存在，并已包含了该侦听器，添加将被忽略
   * 若是一个类正则对象（具备.test方法的任意对象）并匹配已存在的事件类型，则向该事件类型队列做添加操作
   *
   * @param {Array[Function|Object]} listenerArgs 参数数组：事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this
   * @api public
   */
  addAllListeners: function addAllListeners(/*...listenerArgs*/) {
    var listenerArgs = Array.prototype.slice.call(arguments);
    return this.addListener.apply(this, ['*'].concat(listenerArgs))
    // return this.addListener('*', ...listenerArgs)
  },

  /**
   * addAllListeners 的别名方法
   * @api public
   */
  onAll: alias('addAllListeners'),

  /**
   * 在所有已存在的事件队列中删除指定的事件侦听器
   *
   * @param {Array[Function|Object]} listenerArgs 参数数组：事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this
   * @api public
   */
  removeAllListeners: function removeAllListeners(/*...listenerArgs*/) {
    var listenerArgs = Array.prototype.slice.call(arguments);
    return this.removeListener.apply(this, ['*'].concat(listenerArgs))
    // return this.removeListener('*', ...listenerArgs)
  },

  /**
   * removeAllListeners 的别名方法
   */
  offAll: alias('removeAllListeners'),

  /**
   * 触发事件函数
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Array} args 用来call每个事件侦听器的参数
   * @param {Object} target 触发事件的实例对象
   * @param {Boolean} bubbles 指定是否为冒泡模型
   * @param {Boolean} cancelable 是否可以取消冒泡事件
   * @param {Boolean} returnValue 是否阻止事件默认行为（赋值）
   * @return {Object} this
   * @api private
   */
  emitEvent: function emitEvent(evt, args, target, bubbles, cancelable, returnValue) {
    var this$1 = this;

    var events = this._events,
        listenerWrappers,
        i,
        l,
        types,
        type,
        event = null;

    if (!evt) {
      return event
    }

    target || (target = this);
    args || (args = []);

    if (events) {
      switch (typeof evt) {
        case 'string':

          if (evt === '*') {
            for (type in events) {
              emits.call(this$1, type, events[type], args);
              this$1.emitEventPropagation(event);
            }
          } else {
            types = evt.split(this.eventTypeDelimiter);
            l = types.length;
            if (l < 2) {
              emits.call(this, evt, events[evt], args);
              return event
            }
            i = -1;
            while (++i < l) {
              emits.call(this$1, types[i], events[types[i]], args);
              this$1.emitEventPropagation(event);
            }
          }
          return event

        default:
          // 若包含一个类正则匹配的 test 方法
          if (typeof evt.test === 'function') {
            for (type in events) {
              if (evt.test(type)) {
                emits.call(this$1, type, events[type], args);
                this$1.emitEventPropagation(event);
              }
            }
          }
      }
    } else if (this.parent && this.parent.emitEvent) {
      this.parent.emitEvent(evt, args, target, bubbles, cancelable, returnValue);
    }

    return event

    function emits (type, listenerWrappers, args) {
      var this$1 = this;

      var listenerWrapper,
          handleEvent,
          context,
          response;

      listenerWrappers.emittingIndex = -1;
      event = this.createEvent(type, args, target, bubbles, cancelable, returnValue);

      outer: while (listenerWrapper = listenerWrappers[++listenerWrappers.emittingIndex]) {
        // 确定作用域和事件函数
        context = listenerWrapper.listener || this$1;
        handleEvent = listenerWrapper.handleEvent || context.handleEvent;

        switch (args.length) {
            // fast cases
          case 0:
            response = handleEvent.call(context, event);
            break
          case 1:
            response = handleEvent.call(context, event, args[0]);
            break
          case 2:
            response = handleEvent.call(context, event, args[0], args[1]);
            break
          case 3:
            response = handleEvent.call(context, event, args[0], args[1], args[2]);
            break
            // slower
          default:
            response = handleEvent.apply(context, [event].concat(args));
        }

        switch (response) {
            // 返回值为假，就跳出循环，中断后续事件队列的执行
          case false:
            break outer
            // 返回值为真，则删除当前侦听器，及只执行一次当前事件
          case true:
            this$1.removeListener(type, listenerWrapper);
            break
          default:
            // 若执行次数限制为零，则删除当前侦听器
            --listenerWrapper.limit || this$1.removeListener(type, listenerWrapper);
        }

        // 若已终止事件队列后续执行及事件冒泡
        if (event.isImmediatePropagationStopped()) {
          break
        }
      }

      // 重置emitting索引
      listenerWrappers.emittingIndex = -1;
    }
  },

  /**
   * 触发事件冒泡
   *
   * @param {Object} event 事件对象
   * @return {Object} this
   * @api private
   */
  emitEventPropagation: function emitEventPropagation(event) {
    if (this.parent && this.parent.emitEvent && !event.isPropagationStopped()) {
      this.parent.emitEvent(event.type, event.emitArgs, event.target, event.bubbles, event.cancelable, event.returnValue);
    }
  },

  /**
   * 创建事件对象
   *
   * @param {String} type 事件名称
   * @param {Object} target 传入的事件触发对象
   * @param {Boolean} bubbles 设置事件是否为冒泡模型
   * @return {Boolean} cancelable 设置事件是否可以取消冒泡事件
   * @return {Object} this
   * @api private
   */
  createEvent: function createEvent(type, target, bubbles, cancelable, emitArgs, returnValue) {
    var event = new Event$1();
    event.initEvent(type, this, target, bubbles, cancelable);
    event.emitArgs = emitArgs;
    returnValue || event.preventDefault();
    return event
  },

  /**
   * 触发事件
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Array} args 传递给事件处理的后续可选参数集
   * @return {Object} this
   * @api private
   */
  emit: function emit (evt/*, ...args*/) {
    var args = Array.prototype.slice.call(arguments, 1);
    return this.emitEvent(evt, args, this, true, true, true)
  },

  /**
   * 原型方法绑定到同名的属性方法，锁定this
   *
   * @param {Array[String]} methodNames 可选参数为原型上的方法名集合
   * @return {Object} this
   * @api public
   */
  bind: function bind (/*...methodNames*/) {
    Array.prototype.forEach.call(arguments, function (methodName) {
      typeof this[methodName] === 'function' && !this.hasOwnProperty(methodName) && (this[methodName] = this[methodName].bind(this));
    }, this);
    return this
  },

  /**
   * 父实例
   * @type {null|Object} parent 必须是 EventEmitter 的实例
   */
  parent: null,

});

/**
 * 继承给指定的类
 * @param  {Function} constructor 构造函数
 * @param  {Object} protoProps 原型方法集
 * @param  {Object} staticProps 静态方法集
 * @return {Function} constructor 参数
 */
function inherito (constructor, protoProps, staticProps) {
  // 原型继承并扩展成员
  assign(constructor.prototype = create(this.prototype), {
    constructor: constructor
  }, protoProps);

  constructor.inherito = inherito;

  // 静态成员扩展
  return assign(constructor, staticProps)
}

// 静态成员扩展
var core = assign(EventEmitter, {
  inherito: inherito,
  Event: Event$1
});

module.exports = core;