import typeOf from './typeOf';

const sNativeCode = (s => s.slice(s.indexOf('{')))(Array.prototype.pop + '');

export default function isNativeFunction(func) {
  return typeOf(func) === 'Function' && sNativeCode === (func += '').slice(func.indexOf('{'));
}