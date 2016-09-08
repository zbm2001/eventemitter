import './util/assign';
import typeOf from './util/typeOf';
import create from './util/create';
import Event from 'Event';

var slice = Array.prototype.slice;

/**
 * 查找侦听器在侦听器数组中的索引
 *
 * @param {Object[]} listeners 侦听器对象数组
 * @param {Function|Object} listener 侦听器对象或处理函数
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
 * 通过指定的对象方法名生成别名函数
 * 运行时闭包函数引用指定的方法绑定this上下文并执行
 *
 * @param {String} name 原方法名
 * @return {Function} 返回闭包函数
 * @api private
 */
function alias(name) {
  return function aliasClosure() {
    return this[name].apply(this, arguments);
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
   * @param {String|RegExp} evt 事件名称或类正则对象
   * @param {Function|Object} listener 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this 返回当前对象
   * @api private
   */
  addListener: function addListener(evt, listener) {
    var events,
      listeners,
      types,
      type,
      listenerArgs,
      i,
      l;

    // 必须至少包含两个参数
    if (!evt || arguments.length < 2) {
      return this;
    }

    events = this._events;
    listenerArgs = wrapListenerArgs(arguments);

    if (l = listenerArgs.length) {
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
                  events[types[i]] = listenerArgs.slice();
                }
              }
            }
            // 创建新的队列
            else {
              events = this._events = {};
              while (i--) {
                events[types[i]] = listenerArgs.slice();
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
    }

    return this;

    function wrapListenerArgs(args) {
      var i = 0,
        l = args.length,
        arr = [];

      outer: while (++i < l) {
        if (args[i]) {
          switch (typeof args[i]) {
            case 'function':
              arr.push({
                listener: null,
                handleEvent: args[i],
                limit: false
              });
              continue outer;

            case 'object':
              arr.push({
                listener: args[i],
                handleEvent: null,
                limit: false
              });
              continue outer;
          }
        }
      }
      return arr;
    }

    function adds() {
      var i = -1;
      while (++i < l) {
        if (indexOfListener(listeners, listenerArgs[i].listener || listenerArgs[i].handleEvent) < 0) {
          listeners.push(listenerArgs[i]);
        }
      }
    }
  },

  /**
   * Alias of addListener
   */
  on: alias('addListener'),

  /**
   * Semi-alias of addListener. It will add a listener that will be
   * automatically removed after its first execution.
   *
   * @param {String|RegExp} evt Name of the event to attach the listener to.
   * @param {Function} listener Method to be called when the event is emitted. If the function returns true then it will be removed after calling.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  addOnceListener: function addOnceListener(evt, listener) {
    return this.addListener(evt, {
      listener: listener,
      once: true
    });
  },

  /**
   * Alias of addOnceListener.
   */
  once: alias('addOnceListener'),

  /**
   * Removes a listener function from the specified event.
   * When passed a regular expression as the event name, it will remove the listener from all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to remove the listener from.
   * @param {Function} listener Method to remove from the event.
   * @return {Object} Current instance of EventEmitter for chaining.
   * @api public
   */
  removeListener: function removeListener(evt, listener) {
    var events = this._events,
      listeners,
      types,
      type,
      listenerArgs,
      l;

    if (!evt || !events || arguments.length < 2) {
      return this;
    }

    listenerArgs = slice.call(arguments, 1);
    l = listenerArgs.length;

    if (l) {
      switch (typeof evt) {
        // 若为事件名
        case 'string':
          // 若为通配符
          if (evt === '*') {
            for (type in events) {
              listeners = events[type];
              filter(type);
            }
          } else {
            types = evt.split(this.eventTypeDelimiter);
            filters(types);
          }
          break;

        default:
          // 若包含一个类正则匹配的 test 方法
          if (typeof evt.test === 'function') {
            for (type in events) {
              // 只匹配已存在的事件名
              if (evt.test(type)) {
                listeners = events[type];
                filter(type);
              }
            }
          }
      }
    } else {

    }

    for (type in events) {
      return this;
    }
    delete this._events;
    return this;

    function filters(types) {
      var i = types.length;
      while (i--) {
        if (listeners = events[type = types[i]]) {
          filter(type);
        }
      }
    }

    function filter(type) {
      var i = 0;
      do {
        if ((index = indexOfListener(listeners, listenerArgs[j])) > -1) {
          listeners.splice(index, 1);
        }
      } while (++i < l && listeners.length);
      if (!listeners.length) {
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
   * Adds listeners in bulk using the manipulateListeners method.
   * If you pass an object as the second argument you can add to multiple events at once. The object should contain key value pairs of events and listeners or listener arrays. You can also pass it an event name and an array of listeners to be added.
   * You can also pass it a regular expression to add the array of listeners to all events that match it.
   * Yeah, this function does quite a bit. That's probably a bad thing.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to add to multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to add.
   * @return {Object} Current instance of EventEmitter for chaining.
   * @api private
   */
  addAllListeners: function addAllListeners(listeners) {
    // Pass through to manipulateListeners
    return this.addListener.apply(this, listeners);
  },

  /**
   * addAllListeners 的别名方法
   * @api public
   */
  onAll: alias('addAllListeners'),

  /**
   * Removes listeners in bulk using the manipulateListeners method.
   * If you pass an object as the second argument you can remove from multiple events at once. The object should contain key value pairs of events and listeners or listener arrays.
   * You can also pass it an event name and an array of listeners to be removed.
   * You can also pass it a regular expression to remove the listeners from all events that match it.
   *
   * @param {String|Object|RegExp} evt An event name if you will pass an array of listeners next. An object if you wish to remove from multiple events at once.
   * @param {Function[]} [listeners] An optional array of listener functions to remove.
   * @return {Object} Current instance of EventEmitter for chaining.
   * @api private
   */
  removeAllListeners: function removeAllListeners(listeners) {
    // Pass through to manipulateListeners
    return this.removeListener.apply(this, listeners);
  },

  /**
   * removeAllListeners 的别名方法
   */
  offAll: alias('removeAllListeners'),

  /**
   * Emits an event of your choice.
   * When emitted, every listener attached to that event will be executed.
   * If you pass the optional argument array then those arguments will be passed to every listener upon execution.
   * Because it uses `apply`, your array of arguments will be passed as if you wrote them out separately.
   * So they will not arrive within the array on the other side, they will be separate.
   * You can also pass a regular expression to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {Array} [args] Optional array of arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   * @api 
   */
  _emitEvent: function _emitEvent(evt, args, target, bubbles, cancelable, returnValue) {
    var events = this._events,
      listeners,
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
              if (listeners = events[types[i]]) {
                emits.call(this, types[i], listeners, args);
              }
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
      this.parent.emitEvent(evt, args, target);
    }

    function emits(type, listeners, args) {
      var listener,
        handleEvent,
        context,
        response;

      listeners.emittingIndex = -1;
      event = this.createEvent(type, target);
      returnValue || event.preventDefault();

      outer: while (listener = listeners[++listeners.emittingIndex]) {
        // If the listener returns true then it shall be removed from the event
        // The function is executed either with a basic call or an apply if there is an args array
        context = listener.listener || this;
        handleEvent = listener.handleEvent || context;

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

        switch(response){
          // 跳出循环
          case false:
            break outer;
          // 删除当前侦听器
          case true:
            this.removeListener(type, listener.listener || listener.handleEvent);
            break;
        }
      }

      // 重置emitting索引
      listeners.emittingIndex = -1;

      if (this.parent && this.parent._emitEvent && !event.isPropagationStopped()) {
        this.parent._emitEvent(type, args, target, event.returnValue);
      }
    }

    return event;
  },

  /**
   *
   */
  createEvent: function createEvent(type, target, canBubble, cancelable) {
    var event = new Event(type);
    event.initEvent(type, canBubble, cancelable);
    event.currentTarget = this;
    event.target = target || this;
    event.timeStamp = now();
    return EventEmitter.event = event;
  },

  /**
   * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
   * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {Array} ...args 传递给事件处理的后续可选参数集
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  emit(type, ...args) {
    return this._emits(type, args, target, true, true, true);
  },

  _emit(type, args, target) {
    return this._emitEvent(type, args, target, true, true, true);
  },

  _emits(evt, ...args) {
    var events = this.events,
        types = [];
    if (events) {
      switch (typeof evt) {
        case 'string':

          if (evt === '*') {
            for (type in events) {
              types.push(type)
            }
          } else {
            types = evt.split(this.eventTypeDelimiter);
            l = types.length;
            i = -1;
            while (++i < l) {
              if (listeners = events[types[i]]) {
                emits.call(this, types[i], listeners, args);
              }
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
      } else if (this.parent && this.parent.emits) {
        this.parent.emits.call(evt, args, target);
      }
    }

  },

  /**
   * emit 别名方法
   */
  trigger: alias('emit'),

  /**
   * Fetches the events object and creates one if required.
   *
   * @return {Object} The events storage object.
   * @api private
   */
  _getEvents: function _getEvents() {
    return this._events || (this._events = {});
  },


  getListeners: function getListeners(evt) {
    var events = this._events,
      listeners = [],
      key;

    if (events) {

    }

    // Return a concatenated array of all matching events if
    // the selector is a regular expression.
    if (evt instanceof RegExp) {
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
   * @param {...string} 可选参数为原型方法名
   * @return {Object} this
   * @api public
   */
  bindHandleEvent(...methodNames) {
    methodNames.unshift('handleEvent');
    this.bind.apply(this, methodNames);
    this.bindHandleEvent = this.bind;
    return this;
  },

  /**
   * Fetches the events object and creates one if required.
   *
   * @param {...String} 可选参数为原型方法名
   * @return {Object} this
   * @api public
   */
  bind(...methodNames) {
    methodNames.forEach(methodName => typeof this[methodName] === 'function' && !this.hasOwnProperty(methodName) && (this[methodName] = this[methodName].bind(this));
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
    if(!(instance instanceof EventEmitter){
      throw new TypeError(instance + 'is not instanceof EventEmitter.');
    }
    if(this.isAncestor(instance, true)){
      throw new Error('The new child instance contains this instance.');
    }
    this.children || (this.children = []);
    if (this.children.indexOf(instance) < 0) {
      if(instance.parent){
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
    if(!(instance instanceof EventEmitter){
      throw new TypeError(instance + 'is not instanceof EventEmitter.');
    }
    var index;
    if (this.children && (index = this.children.indexOf(instance)) > -1) {
      this.children.splice(index, 1);
      delete instance.parent;
    }
    else{
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
  isAncestor(instance, includeSelf){
    var parent = includeSelf ? this : this.parent;
    do{
      if(instance === parent){
        return true;
      }
    }while(parent = parent.parent);
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
  assign(constructor.prototype = create(this.prototype), {
    constructor: constructor
  }, protoProps);

  // 静态成员扩展
  return assign(constructor, staticProps);
}

export default EventEmitter;