// 项目下直接运行命令 rollup -c
import buble from 'rollup-plugin-buble';

var external = Object.keys( require( './package.json' ).devDependencies );

export default {
  entry: 'src/index.js',
  plugins: [ buble() ],
  external: external,
  // targets: [ // 多文件生成有BUG ！！var a,b; => var a; var b; var var a; var var b; ......
  //  { dest: 'bundle.cjs.js', format: 'cjs' },
  //  { dest: 'bundle.es.js', format: 'es' },
  //  { dest: 'bundle.umd.js', format: 'umd' },
  //  { dest: 'bundle.iife.js', format: 'iife' }
  // ],
  format: 'iife', // cjs amd es6 umd iife
  moduleName: 'Date', // umd 或 iife 模式下，若入口文件含 export，必须加上该属性
  dest: 'date.js', // 输出文件
  sourceMap: false   // 调试编译
}