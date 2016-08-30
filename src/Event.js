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

  CAPTURING_PHASE: 1,

  AT_TARGET: 2,

  BUBBLING_PHASE: 3,

  eventPhase: 0,

  currentTarget: null,

  target: null,

  bubbles: true,

  cancelBubble: false,

  cancelable: true,

  returnValue: true,

  eventPhase: 0,

  function initEvent(type, canBubble, cancelable) {
    this.type = type;
    this.bubbles = !!canBubble;
    this.cancelable = !!canBubble;
    if (!this.cancelBubble) {
      this.stopPropagation = returnFalse;
    }
    if (!this.cancelable) {
      this.preventDefault = returnFalse;
    }
    return this;
  },

  function preventDefault() {
    this.preventDefault = this.isDefaultPrevented = returnTrue;
    this.returnValue = false;
    return true;
  },

  isDefaultPrevented: returnFalse,

  function stopPropagation() {
    this.stopPropagation = this.isPropagationStopped = returnTrue;
    return true;
  },

  isPropagationStopped: returnFalse,

  function stopImmediatePropagation() {
    this.returnValue = false;
    this.stopPropagation();
    this.stopImmediatePropagation = this.isImmediatePropagationStopped = returnTrue;
  },

  isImmediatePropagationStopped: returnFalse

});

function returnTrue() {
  return true;
}

function returnFalse() {
  return false;
}

export default Event;