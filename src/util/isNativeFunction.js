import typeOf from './typeOf';

var sPop = Array.prototype.pop + '';
const sNativeCode = sPop.slice(sPop.indexOf('{'));

export default (Function.isNativeFunction = function isNativeFunction(func) {
  return typeOf(func) === 'Function' && sNativeCode === (func += '').slice(func.indexOf('{'));
})