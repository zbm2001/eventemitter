// 项目下直接运行命令 rollup -c

const babel = require('rollup-plugin-babel')
const buble = require('rollup-plugin-buble')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const pkg = require('./package.json')
const banner = '/*\n' +
    'name,version,description,author,license'.split(',')
        .map((k) => ` * @${k}: ${pkg[k]}`).join('\n') +
    '\n */'
const external = Object.keys(pkg.devDependencies)

module.exports = {
  input: 'src/index.js', // entry -> input
  plugins: [
    // resolve({
    //   jsnext: true,
    //   main: true,
    //   browser: true,
    // }),
    // commonjs(),
    // babel 遵循 es2015+ 标准，但执行较慢
    // babel({
    //   exclude: 'node_modules/**'
    // }),
    // 结合 buble 比 babel 更快
    buble({
      exclude: 'node_modules/**'
    }),
    replace({
      exclude: 'node_modules/**',
      ENV: JSON.stringify(process.env.NODE_ENV || 'development')
    })
  ],
  external: external,
  targets: [
    {
      file: 'index.js', // dest -> file
      format: 'cjs'
    }/*, {
      file: 'EventEmitter.amd.js',
      format: 'amd'
    }, {
      file: 'EventEmitter.cjs.js',
      format: 'cjs'
    }, {
      file: 'EventEmitter.es.js',
      format: 'es'
    }, {
      file: 'EventEmitter.iife.js',
      format: 'iife'
    }, {
      file: 'EventEmitter.umd.js',
      format: 'umd'
    }*/
  ],
  banner: banner,
  // format: 'iife', // cjs amd es6 umd iife
  name: 'EventEmitter' // umd 或 iife 模式下，若入口文件含 export，必须加上该属性 moduleName -> name
  // file: 'EventEmitter.js', // 输出文件 dest -> file
  // sourcemap: false   // 调试编译 sourceMap -> sourcemap
}