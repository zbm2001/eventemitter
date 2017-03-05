import {assign, returnFalse, returnTrue} from 'z-utils'

/**
 * 事件对象构造器
 *
 * @param {String} event type.
 * @return {Object} event object.
 * @api private
 */
function Event () {}

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
  initEvent (type, currentTarget, target, bubbles, cancelable) {
    this.type = type
    this.currentTarget = currentTarget
    this.target = target || currentTarget
    this.timeStamp = Date.now()
    this.bubbles = !!bubbles
    this.cancelable = !!cancelable
    if (!this.bubbles) {
      this.cancelBubble = true
      this.stopPropagation = returnFalse
      this.isPropagationStopped = returnTrue
    }
    if (!this.cancelable) {
      this.preventDefault = returnFalse
    }
    return this
  },

  /**
   * 阻止事件默认行为
   *
   * @api public
   */
  preventDefault () {
    this.preventDefault = this.isDefaultPrevented = returnTrue
    this.returnValue = false
    return true
  },

  isDefaultPrevented: returnFalse,

  /**
   * 阻止事件冒泡
   *
   * @api public
   */
  stopPropagation () {
    this.stopPropagation = this.isPropagationStopped = returnTrue
    this.cancelBubble = true
    return true
  },

  isPropagationStopped: returnFalse,

  /**
   * 阻止事件冒泡，并且终止当前所在事件队列的后续触发
   *
   * @api public
   */
  stopImmediatePropagation () {
    this.stopPropagation()
    this.stopImmediatePropagation = this.isImmediatePropagationStopped = returnTrue
    return true
  },

  isImmediatePropagationStopped: returnFalse

})

export default assign(Event, {
  // 捕获阶段
  CAPTURING_PHASE: 1,
  // 在目标组件上上
  AT_TARGET: 2,
  // 冒泡阶段
  BUBBLING_PHASE: 3
})