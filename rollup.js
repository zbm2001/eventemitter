// 项目下直接命令$ node rollup.js

const fs = require('fs')
const rollup = require('rollup')
const uglifyjs = require('uglify-js')
const rollupConfig = require('./rollup.config.js')
const rc = {
  entry: rollupConfig.entry,
  plugins: rollupConfig.plugins
}

let targets = rollupConfig.targets ? rollupConfig.targets.map(target => ({
      format: target.format,
      dest: target.dest
    })) : [{
      format: rollupConfig.format,
      dest: rollupConfig.dest
    }]

targets.forEach(function (target) {
  target.banner = this.banner
  target.moduleName = this.moduleName
  target.sourceMap = this.sourceMap
}, rollupConfig)

/**
 * JS压缩最小化
 * @param  {String} code JS代码源文本
 * @return {String} 返回压缩后的代码文本
 */
function minify(code) {
  let minifyOptions = {
    fromString: true
  }
  let result = uglifyjs.minify(code, minifyOptions)
  return result.code
}

rollup.rollup(rc).then(bundle => {

  targets.forEach(target => {
    let result = bundle.generate(target)

    // dest 生成的目标文件
    fs.writeFileSync(target.dest, result.code)

    // 若指定压缩最小化文件
    if (target.minimize) {
      let minMain = target.dest.replace(/(?=\.js$)/, '.min')
      minMain === target.dest && (minMain += '.min')
      fs.writeFileSync(minMain, target.banner + '\n' + minify(result.code))
    }

  })

  // bundle写入方式
  // targets.forEach(bundle.write, bundle)

}).catch(e => {
  process.stderr.write(e.message + '\n')
  process.exit(1)
})