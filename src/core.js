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
   * 添加一个侦听器到定义的事件侦听存储队列中
   * 排除存储队列中已存在该侦听器
   * 如果是一个正则并匹配已存储的事件队列命名，则向该事件队列做添加操作
   *
   * @param {String|RegExp} evt 事件名称
   * @param {Function|Object} listener 事件侦听器对象（包含一个标准名为handleEvent的方法）或事件处理函数
   * @return {Object} this 返回当前对象
   */
  addListener: function addListener(evt, listener) {
    var events = this._events,
      key,
      listeners,
      types,
      i,
      type,
      listenerArgs = slice.call(arguments, 1),
      l,
      j;

    wrapListenerArgs();

    if (!evt || evt === '*') {
      if (l && events) {
        for (key in events) {
          listeners = events[key];
          adds();
        }
      }
    } else switch (typeof evt) {
      //
      case 'string':
        if (l) {
          types = evt.split(this.eventTypeDelimiter);
          i = types.length;
          // add some event types
          if (events) {
            while (i--) {
              if (hasOwnProperty.call(events, types[i])) {
                listeners = events[types[i]];
                adds();
              } else {
                events[types[i]] = listenerArgs.slice();
              }
            }
          }
          // add All event types
          else {
            events = this._events = {};
            while (i--) {
              events[types[i]] = listenerArgs.slice();
            }
          }
        }
        break;
        //
      case 'function':
        // add some event types
        if (events) {
          listenerArgs = slice.call(arguments, 0);
          wrapListenerArgs();
          for (key in events) {
            listeners = events[key];
            adds();
          }
        }
        break;
        //
      case 'object':

        if (evt.test) {
          if (l && events) {
            for (key in events) {
              if (evt.test(key)) {
                listeners = events[key];
                adds();
              }
            }
          }
        }
        // has events
        else {
          if (!events) {
            events = this._events = {};
          }
          for (key in evt) {
            if (hasOwnProperty.call(evt, key)) {
              listenerArgs = typeof evt[key] === 'function' ? [evt[key]] : evt[key];
              wrapListenerArgs();
              if (hasOwnProperty.call(events, key)) {
                listeners = events[key];
                adds();
              } else {
                events[key] = listenerArgs;
              }
            }
          }
        }
        break;
    }

    return this;

    function wrapListenerArgs() {
      var listener;
      j = l = listenerArgs.length;
      outer: while (j--) {
        if (listener = listenerArgs[j]) {
          switch (typeof listener) {
            case 'function':
              listenerArgs[j] = {
                handleEvent: listener,
                limit: false
              };
              continue outer;

            case 'object':
              listenerArgs[j] = {
                listener: listener.listener,
                limit: false
              };
              continue outer;
          }
        }
        listenerArgs.splice(j--, 1);
      }
    }

    function adds() {
      j = -1;
      while (++j < l) {
        if (indexOfListener(listeners, listenerArgs[j].listener) < 0) {
          listeners.push(listenerArgs[j]);
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
   */
  removeListener: function removeListener(evt, listener) {
    var events = this._events,
      key,
      listeners,
      types,
      delimiter = this.eventTypeDelimiter,
      index,
      type,
      listenerArgs = slice.call(arguments, 1),
      l = listenerArgs.length,
      i,
      j;

    if (events) {
      // remove all listeners
      if (!evt) {
        for (key in events) {
          if (hasOwnProperty.call(events, key)) {
            delete events[key];
          }
        }
      }
      // remove some listeners
      else switch (typeof evt) {
        case 'string':
          filters();
          break;
        case 'function':
          listenerArgs = slice.call(arguments, 0);;
          l = listenerArgs.length;
          for (key in events) {
            if (hasOwnProperty.call(events, key)) {
              listeners = events[type = key];
              filter();
            }
          }
          break;
        case 'object':
          // remove some match listeners
          if (evt.test) {
            for (key in events) {
              if (hasOwnProperty.call(events, key) && evt.test(key)) {
                listeners = events[type = key];
                filter();
              }
            }
          }
          // remove some listeners (types hash)
          else {
            for (key in evt) {
              if (hasOwnProperty.call(evt, key) && hasOwnProperty.call(events, key)) {
                listeners = events[key];
                listenerArgs = typeof evt[key] === 'function' ? [evt[key]] : evt[key];
                l = listenerArgs.length;
                filters();
              }
            }
          }
          break;
      }
    }

    return this;

    function filters() {
      types = evt.split(delimiter);
      i = types.length;
      while (i--) {
        if (listeners = events[type = types[i]]) {
          filter();
        }
      }
    }

    function filter() {
      j = 0;
      do {
        if ((index = indexOfListener(listeners, listenerArgs[j].listener)) > -1) {
          listeners.splice(index, 1);
        }
      } while (++j < l && listeners.length);
      if (!listeners.length) {
        delete events[type];
      }
    }
  },

  /**
   * removeListener 的别名方法
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
   */
  addAllListeners: function addAllListeners(listeners) {
    // Pass through to manipulateListeners
    return this.addListener.apply(this, listeners);
  },

  /**
   * addAllListeners 的别名方法
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
   */
  emitEvent: function emitEvent(evt, args, target) {
    var that = this,
      events = this._events,
      listeners,
      i,
      types,
      type,
      l,
      j,
      event,
      onceReturnValue = this._onceReturnValue;

    target || (target = this);

    if (events) {
      args || (args = []);
      if (!evt) {
        for (type in events) {
          emits.call(this, type, events[type], args);
        }
      } else switch (typeof evt) {
        case 'string':
          types = evt.split(this.eventTypeDelimiter);
          l = types.length;
          j = -1;
          while (++j < l) {
            if (listeners = events[types[j]]) {
              emits.call(this, types[j], listeners, args);
            }
          }
          break;
        case 'object':
          if (evt.test) {
            for (type in events) {
              if (evt.test(type)) {
                emits.call(this, type, events[type], args);
              }
            }
          }
          break;
      }
    } else if (this.parent && this.parent.emitEvent) {
      this.parent.emitEvent(evt, args, target);
    }

    function emits(type, listeners, args) {
      var l = listeners.length,
        i = -1,
        listener,
        handleEvent,
        context,
        response;

      event = this.createEvent(type, target);

      while (++i < l) {
        // If the listener returns true then it shall be removed from the event
        // The function is executed either with a basic call or an apply if there is an args array
        listener = listeners[i];
        handleEvent = listener.listener;
        context = listener.context || this;

        if (listener.once === true) {
          this.removeListener(type, handleEvent);
        }

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

        if (response === onceReturnValue) {
          this.removeListener(type, handleEvent);
        } else if (response === false) {
          break;
        }
      }

      if (this.parent && this.parent.emitEvent) {
        event.isPropagationStopped() || this.parent.emitEvent(type, args, target);
      }
    }

    return event;
  },

  _onceReturnValue: true,

  /**
   *
   */
  createEvent: function createEvent(type, target) {
    var event = new Event(type);
    event.initEvent(type, true, true);
    event.currentTarget = this;
    event.target = target || this;
    event.timeStamp = now();
    return EventEmitter.event = event;
  },

  /**
   * Alias of emitEvent
   */
  trigger: alias('emitEvent'),

  /**
   * Subtly different from emitEvent in that it will pass its arguments on to the listeners, as opposed to taking a single array of arguments to pass on.
   * As with emitEvent, you can pass a regex in place of the event name to emit to all events that match it.
   *
   * @param {String|RegExp} evt Name of the event to emit and execute listeners for.
   * @param {...*} Optional additional arguments to be passed to each listener.
   * @return {Object} Current instance of EventEmitter for chaining.
   */
  emit: function emit(evt) {
    var args = slice.call(arguments, 1);
    return this.emitEvent(evt, args);
  },

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

        if(events){

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
        }
        else {
            response = events[evt] || (events[evt] = []);
        }

        return listeners;
    }

  /**
   * 标准处理事件绑定this上下文
   *
   * @param {...*} 可选参数为原型方法名
   * @return {Object} this
   * @api public
   */
  bindHandleEvent: function bindHandleEvent( /*[methodName1, methodName2, ...]*/ ) {
    var methodNames = slice.call(arguments);
    methodNames.push('handleEvent');
    this.bind.apply(this, methodNames);
    this.bindHandleEvent = this.bind;
    return this;
  },

  /**
   * Fetches the events object and creates one if required.
   *
   * @param {...*} 可选参数为原型方法名
   * @return {Object} this
   * @api public
   */
  bind: function bind( /*[methodName1, methodName2, ...]*/ ) {
    var l = arguments.length,
      i = 0,
      key;
    for (; i < l; i++) {
      key = arguments[i];
      if (typeof this[key] === 'function' && !hasOwnProperty.call(this, key)) {
        this[key] = this[key].bind(this);
      }
    }
  },

  // {Object} component instance of EventEmitter
  parent: null,

  // {null|Array} child components
  children: null,

  // @param {Object} component instance of EventEmitter
  // @return {Object} equal param
  appendChild: function(component) {
    this.children || (this.children = []);
    if (this.children.indexOf(component) < 0) {
      this.children.push(component);
      component.parent = this;
    }
    return component;
  },

  // @param {Object} component instance of EventEmitter
  // @return {Object} equal param
  removeChild: function(component) {
    var index;
    if (this.children && (index = this.children.indexOf(component)) > -1) {
      this.children.splice(index, 1);
      delete component.parent;
    }
    return component;
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
 * @return {[type]}             [description]
 */
function inherito(constructor, protoProps, staticProps) {
  // 原型继承并扩展成员
  assign(constructor.prototype = create(this.prototype), { constructor: constructor }, protoProps);

  // 静态成员扩展
  assign(constructor, staticProps);
}

export default EventEmitter;