import isNativeFunction from './isNativeFunction';

export default isNativeFunction(Object.assign) ? Object.assign :
  (Object.assign = function assign(target, ...args) {
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var output = Object(target),
      i = -1,
      l = args.length,
      prop, source;
    while (++i < l) {
      source = args[i];
      if (source != null) {
        for (prop in source) {
          if (source.hasOwnProperty(prop)) {
            output[prop] = source[prop];
          }
        }
      }
    }
    return output;
  });