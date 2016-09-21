// 项目下直接命令 node rollup.js
// import fs from 'fs';
// import rollup from 'rollup';
// import buble from 'rollup-plugin-buble';
// import uglify from 'rollup-plugin-uglify';

const fs = require('fs');
const rollup = require('rollup');
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify');
const uglifyjs = require('uglify-js');

var minifyOptions = { fromString: true };
function minify(code){
  var result = uglifyjs.minify(code, minifyOptions);
  return result.code;
}

var pkg = JSON.parse(fs.readFileSync('./package.json'));

var banner = '/*\n' +
'name,version,description,author,license'.split(',')
.map((k) => ` * @${k}: ${pkg[k]}`).join('\n') +
'\n */';

rollup.rollup({
  entry: 'src/index.js',
  plugins: [
    // 结合 buble 比 babel 更快
    buble({
      exclude: 'node_modules/**'
    })
    // 其他插件，如压缩代码等
    // ,uglify()
  ]
}).then(bundle => {

  var result = bundle.generate({
    // output format - 'amd', 'cjs', 'es', 'iife', 'umd'
    format: 'iife',
    moduleName: 'Validator', // umd 或 iife 模式下，若入口文件含 export，必须加上该属性
    sourceMap: false
  });

  // dest 生成的目标文件
  fs.writeFileSync( 'validator.js', banner + '\n' + result.code );
  fs.writeFileSync( 'validator.min.js', banner + '\n' + minify(result.code) );
  
  
  // // bundle写入方式
  // bundle.write({
  //   // output format - 'amd', 'cjs', 'es6', 'iife', 'umd'
  //   format: 'iife',
  //   moduleName: 'Date', // umd 或 iife 模式下，若入口文件含 export，必须加上该属性
  //   dest: 'date.js',
  //   banner: banner,
  //   sourceMap: false
  // });

}).catch(e => {
  process.stderr.write(e.message + '\n');
  process.exit(1);
});