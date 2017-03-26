'use strict';

var zUtils = require('z-utils');

/**
 * 事件对象构造器
 *
 * @param {String} event type.
 * @return {Object} event object.
 * @api private
 */
function Event () {}

zUtils.assign(Event.prototype, {
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
    this.timeStamp = Date.now ? Date.now() : new Date.getTime();
    this.bubbles = !!bubbles;
    this.cancelable = !!cancelable;
    if (!this.bubbles) {
      this.cancelBubble = true;
      this.stopPropagation = zUtils.returnFalse;
      this.isPropagationStopped = zUtils.returnTrue;
    }
    if (!this.cancelable) {
      this.preventDefault = zUtils.returnFalse;
    }
    return this
  },

  /**
   * 阻止事件默认行为
   *
   * @api public
   */
  preventDefault: function preventDefault () {
    this.preventDefault = this.isDefaultPrevented = zUtils.returnTrue;
    this.returnValue = false;
    return true
  },

  isDefaultPrevented: zUtils.returnFalse,

  /**
   * 阻止事件冒泡
   *
   * @api public
   */
  stopPropagation: function stopPropagation () {
    this.stopPropagation = this.isPropagationStopped = zUtils.returnTrue;
    this.cancelBubble = true;
    return true
  },

  isPropagationStopped: zUtils.returnFalse,

  /**
   * 阻止事件冒泡，并且终止当前所在事件队列的后续触发
   *
   * @api public
   */
  stopImmediatePropagation: function stopImmediatePropagation () {
    this.stopPropagation();
    this.stopImmediatePropagation = this.isImmediatePropagationStopped = zUtils.returnTrue;
    return true
  },

  isImmediatePropagationStopped: zUtils.returnFalse

});

var Event$1 = zUtils.assign(Event, {
  // 捕获阶段
  CAPTURING_PHASE: 1,
  // 在目标组件上上
  AT_TARGET: 2,
  // 冒泡阶段
  BUBBLING_PHASE: 3
});

var listenerWrapperSignKey = zUtils.uuid();
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

zUtils.assign(EventEmitter.prototype, {

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
        listenerArgs = zUtils.arraySlice.call(arguments, 1),
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
    var listenerArgs = zUtils.arraySlice.call(arguments, 1),
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
    var listenerArgs = zUtils.arraySlice.call(arguments, 2),
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
    var listenerArgs = zUtils.arraySlice.call(arguments, 1);

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
    var listenerArgs = zUtils.arraySlice.call(arguments);
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
    var listenerArgs = zUtils.arraySlice.call(arguments);
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
  emitEvent: function emitEvent(evt, target, emitArgs, bubbles, cancelable, returnValue) {
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
    emitArgs || (emitArgs = []);

    if (events) {
      switch (typeof evt) {
        case 'string':

          if (evt === '*') {
            for (type in events) {
              event = emits.call(this$1, type, events[type], emitArgs);
              this$1.emitEventPropagation(event);
            }
          } else {
            types = evt.split(this.eventTypeDelimiter);
            l = types.length;
            if (l < 2) {
              event = emits.call(this, evt, events[evt], emitArgs);
              // 这里必须保让实例先执行相关程序，后触发冒泡
              window.setTimeout(function () { return this$1.emitEventPropagation(event); });
              return event
            }
            i = -1;
            while (++i < l) {
              event = emits.call(this$1, types[i], events[types[i]], emitArgs);
              this$1.emitEventPropagation(event);
            }
          }
          return event

        default:
          // 若包含一个类正则匹配的 test 方法
          if (typeof evt.test === 'function') {
            for (type in events) {
              if (evt.test(type)) {
                event = emits.call(this$1, type, events[type], emitArgs);
                this$1.emitEventPropagation(event);
              }
            }
          }
      }
    } else if (this.parent && this.parent.emitEvent) {
      this.parent.emitEvent(evt, target, emitArgs, bubbles, cancelable, returnValue);
    }

    return event

    function emits (type, listenerWrappers, emitArgs) {
      var this$1 = this;

      var listenerWrapper,
          handleEvent,
          context,
          response,
          event = this.createEvent(type, target, emitArgs, bubbles, cancelable, returnValue);

      listenerWrappers.emittingIndex = -1;

      outer: while (listenerWrapper = listenerWrappers[++listenerWrappers.emittingIndex]) {
        // 确定作用域和事件函数
        context = listenerWrapper.listener || this$1;
        handleEvent = listenerWrapper.handleEvent || context.handleEvent;

        switch (emitArgs.length) {
            // fast cases
          case 0:
            response = handleEvent.call(context, event);
            break
          case 1:
            response = handleEvent.call(context, event, emitArgs[0]);
            break
          case 2:
            response = handleEvent.call(context, event, emitArgs[0], emitArgs[1]);
            break
          case 3:
            response = handleEvent.call(context, event, emitArgs[0], emitArgs[1], emitArgs[2]);
            break
            // slower
          default:
            response = handleEvent.apply(context, [event].concat(emitArgs));
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
      return event
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
      this.parent.emitEvent(event.type, event.target, event.emitArgs, event.bubbles, event.cancelable, event.returnValue);
    }
  },

  /**
   * 创建事件对象
   *
   * @param {String} type 事件名称
   * @param {Object} target 传入的事件触发对象
   * @param {Boolean} bubbles 设置事件是否为冒泡模型
   * @return {Boolean} cancelable 设置事件是否可以取消冒泡事件
   * @return {Boolean} returnValue 设置事件是否未阻止事件默认行为
   * @return {Object} 事件对象
   * @api private
   */
  createEvent: function createEvent(type, target, emitArgs, bubbles, cancelable, returnValue) {
    var event = zUtils.create(Event$1.prototype);
    event.initEvent(type, this, target, bubbles, cancelable);
    event.emitArgs = emitArgs;
    returnValue || event.preventDefault();
    return event
  },

  /**
   * 触发事件
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Array} emitArgs 传递给事件处理的后续可选参数集
   * @return {Object} this
   * @api private
   */
  emit: function emit (evt/*, ...emitArgs*/) {
    var emitArgs = zUtils.arraySlice.call(arguments, 1);
    return this.emitEvent(evt, this, emitArgs, true, true, true)
  },

  /**
   * 原型方法绑定到同名的属性方法，锁定this
   *
   * @param {Array[String]} methodNames 可选参数为原型上的方法名集合
   * @return {Object} this
   * @api public
   */
  bind: function bind (/*...methodNames*/) {
    zUtils.arrayForEach.call(arguments, function (methodName) {
      typeof this[methodName] === 'function' && (this[methodName] = this[methodName].bind(this));
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
  // 原型继承
  constructor.prototype = zUtils.create(this.prototype);
  // 修复原型构造函数的引用
  constructor.prototype.constructor = constructor;
  // 扩展原型成员
  zUtils.assign(constructor.prototype, protoProps);
  // 静态扩展继承方法
  constructor.inherito = inherito;
  // 扩展静态成员
  return zUtils.assign(constructor, staticProps)
}

// 静态成员扩展
zUtils.assign(EventEmitter, {
  inherito: inherito,
  Event: Event$1
});

module.exports = EventEmitter;
