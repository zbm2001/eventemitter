// 项目下直接命令$ node rollup.js

const fs = require('fs')
const rollup = require('rollup')
const uglifyjs = require('uglify-js')
const rollupConfig = require('./rollup.config.js')
const rc = {
  input: rollupConfig.input, // entry -> input
  plugins: rollupConfig.plugins
}

let targets = rollupConfig.targets ? rollupConfig.targets.map(target => ({
  format: target.format,
  file: target.file // dest -> file
})) : [{
  format: rollupConfig.format,
  file: rollupConfig.file // dest -> file
}]

const noBannerFormats = {'cjs': !0, 'es': !0}
targets.forEach(function (target) {
  target.banner = noBannerFormats[target.format] ? '' : this.banner
  target.name = this.name // moduleName -> name
  target.sourcemap = this.sourcemap // sourceMap -> sourcemap
}, rollupConfig)

/**
 * JS压缩最小化
 * @param  {String} code JS代码源文本
 * @return {String} 返回压缩后的代码文本
 */
function minify (code) {
  let minifyOptions = {
    fromString: true
  }
  let result = uglifyjs.minify(code, minifyOptions)
  return result.code
}

rollup.rollup(rc).then(bundle => {

  targets.forEach(target => {
    bundle.generate(target).then(({code, map}) => {
      // file 生成的目标文件 dest -> file
      fs.writeFileSync(target.file, code)

      // 若指定压缩最小化文件
      if (target.minimize) {
        let minMain = target.file.replace(/(?=\.js$)/, '.min')
        minMain === target.file && (minMain += '.min')
        fs.writeFileSync(minMain, target.banner + minify(code))
      }
    })
  })

  // bundle写入方式
  // targets.forEach(bundle.write, bundle)

}).catch(e => {
  process.stderr.write(e.message + '\n')
  process.exit(1)
})