import isNativeFunction from './isNativeFunction';

var REFERENCE_TYPE = {
  'object': !0,
  'function': !0
};

// es6 Object.create
isNativeFunction(Object.create) ||
  (Object.create = function create(object, properties) {
    if (object == null || !REFERENCE_TYPE[typeof object]) {
      throw 'Object prototype may only be an Object or null';
    }
    noop.prototype = object;
    var proto = new noop,
      prop, propName;

    if (properties) {
      if (REFERENCE_TYPE[typeof properties]) {
        for (propName in properties) {
          if (hasOwnProperty.call(properties, propName)) {
            if ((prop = properties[propName]) && REFERENCE_TYPE[typeof prop]) {
              object[propName] = prop.value;
            } else {
              throw 'Property description must be an object: value';
            }
          }
        }
      } else {
        throw 'Property description must be an object: value';
      }
    }
    return proto;
  });

// noop Function
function noop() {};


export default Object.create;