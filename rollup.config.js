// 项目下直接运行命令 rollup -c
const buble = require('rollup-plugin-buble');
const pkg = require('./package.json');
const banner = '/*\n' +
'name,version,description,author,license'.split(',')
.map((k) => ` * @${k}: ${pkg[k]}`).join('\n') +
'\n */';
const external = Object.keys(pkg.devDependencies);

module.exports = {
  entry: 'src/index.js',
  plugins: [
    // 结合 buble 比 babel 更快
    buble({
      exclude: 'node_modules/**'
    })
  ],
  external: external,
  targets: [ // 多文件生成有BUG ！！var a,b; => var a; var b; var var a; var var b; ......
    {
      dest: 'index.js',
      format: 'cjs'
    }/*, {
      dest: 'EventEmitter.amd.js',
      format: 'amd'
    }, {
      dest: 'EventEmitter.cjs.js',
      format: 'cjs'
    }*/, {
      dest: 'EventEmitter.es.js',
      format: 'es'
    }/*, {
      dest: 'EventEmitter.iife.js',
      format: 'iife'
    }, {
      dest: 'EventEmitter.umd.js',
      format: 'umd'
    }*/
  ],
  banner: banner,
  // format: 'iife', // cjs amd es6 umd iife
  moduleName: 'EventEmitter', // umd 或 iife 模式下，若入口文件含 export，必须加上该属性
  // dest: 'EventEmitter.js', // 输出文件
  // sourceMap: false   // 调试编译
}