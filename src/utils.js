/**
 * string of 4 chars
 * return {String} length{4} 0-9 or a-f 范围内的一个32位十六进制数
 */
export function S4() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).slice(1)
}

/**
 * 生成一个全局唯一标识符
 * @return {String} length{36} 返回格式为：“xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx” 的字符串
 */
export function uuid() {
  return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
}

/**
 * function allways return false
 * @return {Boolean} false
 */
export function returnFalse () {
  return false
}

/**
 * function allways return true
 * @return {Boolean} true
 */
export function returnTrue () {
  return true
}
