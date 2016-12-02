import assign from './util/assign';
import typeOf from './util/typeOf';
import create from './util/create';
import uuid from './util/uuid';
import Event from './Event';

const slice = Array.prototype.slice;
const wrapperSignKey = '__event_listener_wrapper_' + Date.now() + '_' + uuid() + '__';
var wrapperSignIndex = 0;

/**
 * 查找侦听器在侦听器数组中的索引
 *
 * @param {Array[Object]} listeners 侦听器对象数组
 * @param {Object|Function} listener 侦听器对象或处理函数
 * @return {Number} 返回索引，-1表示未找到
 * @api private
 */
function indexOfListener(listeners, listener) {
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
        return -1;
    }
  }
  return -1;
}

/**
 * 包装侦听器数组
 *
 * @param {Array[Object|Function]} listenerArgs 侦听器对象（或函数）数组
 * @return {Array[Object]} 返回一个新的包装后的对象数组
 * @api private
 */
function wrapListenerArgs(listenerArgs, limit) {
  var i = 0,
    l = listenerArgs.length,
    listenerWrappers = [],
    listenerWrapper,
    listener;

  outer: while (++i < l) {
    listener = listenerArgs[i];
    if (listener) {
      listenerWrapper = {
            listener: null,
            handleEvent: listener,
            limit: typeof limit === 'number' ? limit : Infinity,
            [wrapperSignKey]: ++wrapperSignIndex
          };
      switch (typeof listener) {
        case 'function':
          listenerWrappers.push(listenerWrapper);
          continue outer;

        case 'object':
        listenerWrapper.listener = listener;
        listenerWrapper.handleEvent = null;
          listenerWrappers.push(listener[wrapperSignKey] ? listener : {
            listener: listener,
            handleEvent: null,
            limit: typeof limit === 'number' ? limit : Infinity,
            [wrapperSignKey]: ++wrapperSignIndex
          });
          continue outer;
      }
    }
  }
  return listenerWrappers;
}

/**
 * 通过指定的对象方法名生成别名函数
 * 运行时闭包函数引用指定的方法绑定this上下文并执行
 *
 * @param {String} name 原方法名
 * @return {Function} 返回闭包函数
 * @api private
 */
function alias(name) {
  return function aliasClosure(...args) {
    return this[name](...args);
  }
}

Object.assign(EventEmitter.prototype, {

  _events: null,

  eventTypeDelimiter: /\s+/,

  /**
   * 添加事件侦听器
   *
   * 若对应的事件类型队列中已存在，并已包含了该侦听器，添加将被忽略
   * 若是一个类正则对象（具备.test方法的任意对象）并匹配已存在的事件类型，则向该事件类型队列做添加操作
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Function|Object} listener 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this 返回当前对象
   * @api public
   */
  addListener(evt, ...listenerArgs) {
    var events,
      listeners,
      types,
      type,
      i,
      listenerWrappers,
      l = listenerArgs.length;

    // 必须至少包含两个参数
    if (!evt || !l) {
      return this;
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
        break;

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

    return this;

    function adds() {
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
   * @param {Function|Object} 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this
   */
  addOnceListener(evt, ...listenerArgs) {
    var listenerWrappers = wrapListenerArgs(listenerArgs),
      listenerWrapper, i = -1;
    while (listenerWrapper = listenerWrappers[++i]) {
      listenerWrapper.limit = 1;
    }
    return this.addListener(evt, ...listenerWrappers);
  },

  /**
   * addOnceListener 别名方法
   */
  once: alias('addOnceListener'),

  /**
   * 删除事件定义的事件
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Function|Object} 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this
   * @api public
   */
  removeListener(evt, ...listenerArgs) {
    var events = this._events,
      listenerWrappers,
      types,
      l,
      type;

    if (!evt || !events) {
      return this;
    }

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
        break;

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
      return this;
    }
    // 否则，清除事件对象
    delete this._events;
    return this;

    function filter(events, type, listenerArgs) {
      var l = listenerArgs.length,
        i = 0,
        listenerWrappers = events[type];
      if (l) {
        do {
          if ((index = indexOfListener(listenerWrappers, listenerArgs[i])) > -1) {
            listenerWrappers.splice(index, 1);
            // 若数组长度为0，清除队列并返回
            if (!listenerWrappers.length) {
              delete events[type];
              return;
            }
            // 若事件触发索引不小于删除的事件索引，减计事件触发索引
            listenerWrappers.emittingIndex < index || listenerWrappers.emittingIndex--;
          }
        } while (++i < l);
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
  addAllListeners(...listenerArgs) {
    return this.addListener('*', ...listenerArgs);
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
  removeAllListeners(...listenerArgs) {
    return this.removeListener('*', ...listenerArgs);
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
   * @param {Object[EventEmitter]} target 触发事件的实例对象
   * @param {Boolean} bubbles 指定是否为冒泡模型
   * @param {Boolean} cancelable 是否可以取消冒泡事件
   * @param {Boolean} returnValue 是否阻止事件默认行为（赋值）
   * @return {Object} this
   * @api private
   */
  emitEvent(evt, args, target, bubbles, cancelable, returnValue) {
    var events = this._events,
      listenerWrappers,
      i,
      l,
      types,
      type,
      event;

    if (!evt) {
      return event;
    }

    target || (target = this);
    args || (args = []);

    if (events) {
      switch (typeof evt) {
        case 'string':

          if (evt === '*') {
            for (type in events) {
              emits.call(this, type, events[type], args);
            }
          } else {
            types = evt.split(this.eventTypeDelimiter);
            l = types.length;
            i = -1;
            while (++i < l) {
              emits.call(this, types[i], events[types[i]], args);
            }
          }
          break;

        default:
          // 若包含一个类正则匹配的 test 方法
          if (typeof evt.test === 'function') {
            for (type in events) {
              if (evt.test(type)) {
                emits.call(this, type, events[type], args);
              }
            }
          }
      }
    } else if (this.parent && this.parent.emitEvent) {
      this.parent.emitEvent(evt, args, target, bubbles, cancelable, returnValue);
    }

    function emits(type, listenerWrappers, args) {
      var listenerWrapper,
        handleEvent,
        context,
        response;

      listenerWrappers.emittingIndex = -1;
      event = this.createEvent(type, target);
      returnValue || event.preventDefault();

      outer: while (listenerWrapper = listenerWrappers[++listenerWrappers.emittingIndex]) {
        // 确定作用域和事件函数
        context = listenerWrapper.listener || this;
        handleEvent = listenerWrapper.handleEvent || context.handleEvent;

        switch (args.length) {
          // fast cases
          case 0:
            response = handleEvent.call(context, event);
            break;
          case 1:
            response = handleEvent.call(context, event, args[0]);
            break;
          case 2:
            response = handleEvent.call(context, event, args[0], args[1]);
            break;
          case 3:
            response = handleEvent.call(context, event, args[0], args[1], args[2]);
            break;
            // slower
          default:
            response = handleEvent.apply(context, [event].concat(args));
        }

        switch (response) {
          // 返回值为假，就跳出循环，中断后续事件队列的执行
          case false:
            break outer;
            // 返回值为真，则删除当前侦听器，及只执行一次当前事件
          case true:
            // 
            this.removeListener(type, listenerWrapper);
            break;
        }
      }

      // 重置emitting索引
      listenerWrappers.emittingIndex = -1;

      if (this.parent && this.parent.emitEvent && !event.isPropagationStopped()) {
        this.parent.emitEvent(type, args, target, bubbles, cancelable, event.returnValue);
      }
    }

    return event;
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
  createEvent(type, target, bubbles, cancelable) {
    var event = new Event();
    event.currentTarget = this;
    event.target = target || this;
    event.timeStamp = now();
    event.initEvent(type, canBubble, cancelable);
    return EventEmitter.event = event;
  },

  /**
   * 触发事件
   *
   * @param {String|RegExp} evt 事件名称或类正则对象（匹配事件名）
   * @param {Array} ...args 传递给事件处理的后续可选参数集
   * @return {Object} this
   * @api private
   */
  emit(evt, ...args) {
    return this.emitEvent(evt, args, this, true, true, true);
  },

  /**
   * emit 别名方法
   */
  trigger: alias('emit'),

  /**
   * 获取事件队列集合对象
   *
   * @return {Object} 事件队列存储对象
   * @api private
   */
  _getEvents() {
    return this._events || (this._events = {});
  },

  /**
   * Fetches the events object and creates one if required.
   *
   * @return {Object} 事件
   * @api private
   */
  getListeners(evt) {
    var events = this._events,
      listeners = [],
      key;

    if (events) {
      return
    }

    // Return a concatenated array of all matching events if
    // the selector is a regular expression.
    if (typeof evt.test === 'function') {
      response = {};
      for (key in events) {
        if (events.hasOwnProperty(key) && evt.test(key)) {
          response[key] = events[key];
        }
      }
    } else {
      response = events[evt] || (events[evt] = []);
    }

    return listeners;
  },

  /**
   * 标准处理事件绑定this上下文
   *
   * @param {Array} methodNames 可选参数为原型上的方法名集合
   * @return {Object} this
   * @api public
   */
  bindHandleEvent(...methodNames) {
    this.bind('handleEvent', ...methodNames);
    this.bindHandleEvent = this.bind;
    return this;
  },

  /**
   * 原型方法绑定到同名的属性方法，锁定this
   *
   * @param {Array} methodNames 可选参数为原型上的方法名集合
   * @return {Object} this
   * @api public
   */
  bind(...methodNames) {
    var i = -1,
      l = methodNames.length,
      methodName;
    while (++i < l) {
      methodName = methodNames[i];
      typeof this[methodName] === 'function' && !this.hasOwnProperty(methodName) && (this[methodName] = this[methodName].bind(this));
    }
  },

  /**
   * 父实例
   * @type {null|Object} parent 必须是 EventEmitter 的实例
   */
  parent: null,

  /**
   * 子实例的数组
   * @type {null|Object[]} 必须是 EventEmitter 的实例数组
   */
  children: null,

  /**
   * 追加子实例
   * @param  {object} instance 必须是 EventEmitter 的实例
   * @return {object} instance 参数
   * @api public
   */
  appendChild(instance) {
    if (!(instance instanceof EventEmitter)) {
      throw new TypeError(instance + 'is not instanceof EventEmitter.');
    }
    if (this.isAncestor(instance, true)) {
      throw new Error('The new child instance contains this instance.');
    }
    this.children || (this.children = []);
    if (this.children.indexOf(instance) < 0) {
      if (instance.parent) {
        instance.parent.removeChild(instance);
      }
      this.children.push(instance);
      instance.parent = this;
    }
    return instance;
  },

  /**
   * 删除子实例
   * @param  {object} instance 必须是 EventEmitter 的实例
   * @return {object} instance 参数
   * @api public
   */
  removeChild(instance) {
    if (!(instance instanceof EventEmitter)) {
      throw new TypeError(instance + 'is not instanceof EventEmitter.');
    }
    var index;
    if (this.children && (index = this.children.indexOf(instance)) > -1) {
      this.children.splice(index, 1);
      delete instance.parent;
    } else {
      throw new Error('The instance to be removed is not a child of this instance.');
    }
    return instance;
  },

  /**
   * 判断是否为祖先实例
   * @param  {object} instance 必须是 EventEmitter 的实例
   * @param  {boolean} includeSelf 指定是否包含自身
   * @return {boolean}
   * @api public
   */
  isAncestor(instance, includeSelf) {
    var parent = includeSelf ? this : this.parent;
    do {
      if (instance === parent) {
        return true;
      }
    } while (parent = parent.parent);
    return false;
  }

});

// 静态成员扩展
Object.assign(EventEmitter, {
  inherito: inherito,
  Event: Event
});

/**
 * 继承给指定的类
 * @param  {function} constructor 构造函数
 * @param  {object} protoProps 原型方法集
 * @param  {object} staticProps 静态方法集
 * @return {function} constructor 参数
 */
function inherito(constructor, protoProps, staticProps) {
  // 原型继承并扩展成员
  Object.assign(constructor.prototype = Object.create(this.prototype), {
    constructor: constructor
  }, protoProps);

  // 静态成员扩展
  return Object.assign(constructor, staticProps);
}

export default EventEmitter;