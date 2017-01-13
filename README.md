# utils

## 安装
npm i z-EventEmitter

## 组件接口

var EM = require('z-EventEmitter');
var em = new EM();

### em.on('eventName', handleEvent)
向实例注册事件侦听器

#### 示例
em.on('foo', (e) => {
  // some code...
})

### em.once('eventName', handleEvent)
向实例注册只执行一次的事件侦听器

#### 示例
em.once('foo', (e) => {
  // some code...
})

### em.onlimit('eventName', limit, handleEvent)
向实例注册只执行指定次数的事件侦听器

#### 示例
em.onlimit('foo', 3, (e) => {
  // some code...
})

### em.onAll(handleEvent)
删除实例已注册的事件侦听器件

#### 示例
em.onAll(handleEvent)

### em.off('eventName', handleEvent)
删除实例已注册的事件侦听器

#### 示例
em.off('foo', handleEvent)

### em.offALL(handleEvent)
删除实例所有已注册的事件类型的事件侦听器

#### 示例
em.offAll(handleEvent)

## 组件构建

### 从配置文件构建（rollup.config.js）
npm run build // rollup -c

或者：

### 自定义构建
npm run build:js // node rollup
