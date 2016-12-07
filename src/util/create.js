import isNativeFunction from './isNativeFunction';


if (!isNativeFunction(Object.create)) {

  let hasOwnProperty = Object.prototype.hasOwnProperty;
  let REFERENCE_TYPE = {
    'object': !0,
    'function': !0
  };
  // es5 Object.create
  (Object.create = function create(object, properties) {
    if (object == null || !REFERENCE_TYPE[typeof object]) {
      throw 'Object prototype may only be an Object or null';
    }
    var proto = { __proto__: object },
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

}

export default Object.create;