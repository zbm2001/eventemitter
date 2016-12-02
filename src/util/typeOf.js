var toString = Object.prototype.toString;

export default function typeOf(object) {
  return toString.call(object).slice(8, -1);
}