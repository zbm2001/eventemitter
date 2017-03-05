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

### EventEmitter原型方法和属性

eventEmitter._events (属性)
eventEmitter.eventTypeDelimiter (属性)
eventEmitter.addListener (方法)
eventEmitter.on (方法)
eventEmitter.addOnceListener (方法)
eventEmitter.once (方法)
eventEmitter.addLimitListener (方法)
eventEmitter.onlimit (方法)
eventEmitter.removeListener (方法)
eventEmitter.off (方法)
eventEmitter.addAllListeners (方法)
eventEmitter.onAll (方法)
eventEmitter.removeAllListeners (方法)
eventEmitter.offAll (方法)
eventEmitter.emitEvent (方法)
eventEmitter.emitEventPropagation (方法)
eventEmitter.createEvent (方法)
eventEmitter.emit (方法)
eventEmitter.bind (方法)
eventEmitter.parent (属性)

### EventEmitter静态方法和属性

EventEmitter.inherito (方法)
EventEmitter.Event (方法)

## 组件构建

### 从配置文件构建（rollup.config.js）
npm run build // rollup -c

或者：

### 自定义构建
npm run dev // node rollup

### 文档生成
npm install -global esdoc
echo '{"source": "./src", "destination": "./doc"}' > .esdoc.json
esdoc
#### 文档
doc/index.html

或者：

### dox
[https://github.com/tj/dox](https://github.com/tj/dox)