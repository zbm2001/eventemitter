import './util/assign';

/**
 * 事件对象构造器
 *
 * @param {String} event type.
 * @return {Object} event object.
 * @api private
 */
function Event(type) {
  this.type = type;
};

Object.assign(Event.prototype, {
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
  // 时间为冒泡模型
  bubbles: true,
  // 是否已取消冒泡
  cancelBubble: false,
  // 
  cancelable: true,
  // 阻止事件默认行为
  returnValue: true,

  initEvent(bubbles, cancelable) {
    this.bubbles = !!bubbles;
    this.cancelable = !!cancelable;
    if (!this.bubbles) {
      this.stopPropagation = returnFalse;
    }
    if (!this.cancelable) {
      this.preventDefault = returnFalse;
    }
    return this;
  },

  preventDefault() {
    this.preventDefault = this.isDefaultPrevented = returnTrue;
    this.returnValue = false;
    return true;
  },

  isDefaultPrevented: returnFalse,

  stopPropagation() {
    this.stopPropagation = this.isPropagationStopped = returnTrue;
    this.cancelBubble = true;
    return true;
  },

  isPropagationStopped: returnFalse,

  stopImmediatePropagation() {
    this.returnValue = false;
    this.stopPropagation();
    this.stopImmediatePropagation = this.isImmediatePropagationStopped = returnTrue;
  },

  isImmediatePropagationStopped: returnFalse

});


Object.assign(Event, {
  // 捕获阶段
  CAPTURING_PHASE: 1,
  // 在目标组件上上
  AT_TARGET: 2,
  // 冒泡阶段
  BUBBLING_PHASE: 3,
  returnTrue: returnTrue;
  returnFalse: returnFalse;
}

function returnTrue() {
  return true;
}

function returnFalse() {
  return false;
}

export default Event;