## Vue的响应式实现流程
+ Vue初始化时，会把data里的所有数据通过Object.defineProperty进行数据劫持，即重写数据的get和set。所以只有初始化时的属性才有响应式，新增的属性得通过$set,才会进行响应式处理
+ data里的每个属性，都会有属于自己的依赖收集的实例，new Dep。属性get时，进行依赖收集，属性set时，通知所有watcher执行更新函数
+ 对数据做响应式处理后，执行编译。当编译到指令执行dom更新时，同时创建watcher，传入更新函数
+ watcher初始化时，通过触发属性的get，将watcher添加到相对应属性的 依赖收集里。
+ 在对属性重新设值的时候，dep会同时触发所有watcher的更新函数

## 源码实现
### Vue类实现
1、 使用
```js
new Vue({
      el: '#app',
      data() {
        return {
          count: 1,
          inputVal: 'input',
          obj: {
            name: 'whh'
          },
          vHtml: '<span style="color: red">vHtml</span>'
        }
      },
      methods: {
        changeCount() {
          this.count++
        },
        changeObject() {
          this.obj = {
            name: this.obj.name + 'h'
          }
        }
      }
    })
```
2、需要实现：
 + 保存传入的配置选项，el、data等
 + 对data里的数据代理到Vue实例上，代理后才能使用this.[key]的形式访问
 + 执行Observer，对data里的数据做响应式处理
 + 执行编译compiler，解析模板指令、差值表达式等
```js
class Vue{
  constructor(options) {
    // 保存配置选项
    this.$options = options
    this.$el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el
    this.$data = typeof options.data === 'function' ? options.data() : options.data
    // 将data里的数据代理到实例上
    this._proxy(this.$data)
    // 响应式处理
    new Observer(this.$data)
    // 执行编译
    new Compiler(this.$el, this)
  }
  // 代理属性
  _proxy(data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        enumerable: true,
        configurable: true,
        get() {
          return data[key]
        },
        set(v) {
          if (v !== data[key]) {
            data[key] = v
          }
        }
      })
    })
  }
}
```
### Observer响应式属性实现
需实现：
 + 对传入的data里的每个属性做响应式处理，并且为每个属性创建一个依赖收集dep
    + 如果属性的值也是一个对象，同样递归处理对象里的每个属性为响应式。
    + 如果是属性的值是数组，则需对此数组实例覆盖原有方法，并对数组里的每一项做响应式处理
  + 响应式处理：
    + 使用Object.defineProperty,对每个属性进行劫持，重写get、set
    + get，当属性被读取时，将watcher添加到当前属性的dep中。此时watcher会存于Dep类的静态属性target中
    + set，当属性改变时，通知当前属性的dep下的所有的watcher，执行更新操作
```js
class Observer{
  constructor(data) {
    if (Array.isArray(data)) {
      // 如果是数组 覆盖数组实例的原型
      // ...TODO
    } else { 
      // 遍历对象属性 做响应式
      this.walk(data)
    }
  }
  walk(data) {
    if (!data || typeof data !== 'object') {
      return
    }
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }
  defineReactive(obj, key, val) {
    const self = this
    // 如果值是一个对象，递归处理val里的属性
    this.walk(val)
    // 为每个属性 创建dep，收集依赖
    const dep = new Dep()
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        if (Dep.target) {
          dep.addSub(Dep.target)
        }
        return val
      },
      set(v) {
        if(v !== val){
          self.walk(v)
          val = v
          // 状态改变  发送通知
          dep.notify()
        }
      }
    })
  }
}
```
### Dep类实现
需实现：
  + 用数组收集watcher
  + 发送通知，执行watcher的更新函数
```js
class Dep{
  constructor() {
    this.deps = []
  }
  // 收集依赖
  addSub(dep) {
    if (dep && dep.update) {
      this.deps.push(dep)
    }
  }
  // 通知更新
  notify() {
    this.deps.forEach(dep => {
      dep.update()
    })
  }
}
```
### Watcher类实现
需实现：
+ watcher实例化时，将实例添加到 Dep
   + 设置Dep的target为当前实例
   + 同时读取属性的值。触发属性的get，将watcher实例添加到Dep里
   + 属性更新时，执行watcher的更新函数
```js
class Watcher{
  constructor(vm, key, updateFn) {
    this.$vm = vm
    this.$key = key
    this.updateFn = updateFn
    Dep.target = this
    // 触发属性的get
    vm[key]
    Dep.target = null
  }
  // 更新函数
  update() {
    this.updateFn.call(this.$vm, this.$vm[this.$key], this.$key)
  }
}
```
### Complier类实现
需实现：
+ 遍历el下的所有dom元素，进行编译
  + 通过nodeType判断是元素节点还是文本节点，1为元素节点，3为文本节点
  + 元素节点需要遍历解析属性，文本节点则主要解析差值表达式
  + 编译即解析dom里的指令和差值表达式，执行不同的更新操作：
    编译元素节点
      + v-text 替换元素的textContent
      + v-html
      + v-model 注册input事件，数据改变时，改变input的值，input输入时，同时改变数据 
      + v-on 取出事件类型和事件名，监听事件
    编译文本节点
      + 差值表达式 用正则获取差值表达式的 key，然后得到vue实例中data里key的值，替换文本节点 textContent = val
  + 编译解析的指令或者表达式的同时，new Watcher创建watcher，传入更新函数。数据发生变化后，会通知所有watcher执行更新函数，即重新渲染相对应的dom更新
```js
class Compiler{
  constructor(el, vm) {
    this.$el = el
    this.$vm = vm
    this.compiler(el)
  }
  compiler(el) {
    window.el = el
    // 遍历子元素
    el.childNodes.forEach(node => {
      // 编译元素节点
      if (node.nodeType === 1) {
        this.compilerElement(node)
      } else if (this.isTextNode(node)) {
        // 编译文本节点
        this.compilerTextElement(node)
      }
      if(node.childNodes && node.childNodes.length) {
        this.compiler(node)
      }
    })
  }
  // 解析文本节点
  compilerTextElement(node) {
    // 用正则获取key
    const reg = /\{\{(.+?)\}\}/
    const text = node.textContent
    if (reg.test(text)) {
      const key = RegExp.$1.trim()
      console.log('value===', JSON.stringify(this.$vm[key]))
      node.textContent = text.replace(reg, this.$vm[key] && typeof this.$vm[key]==='object' ? JSON.stringify(this.$vm[key]): this.$vm[key])
      new Watcher(this.$vm, key, val => {
        let value = val && typeof val ==='object' ? JSON.stringify(val): val
        node.textContent = text.replace(reg, value)
      })
    }
  }
  // 编译元素节点
  compilerElement(node) {
    Array.from(node.attributes).forEach(attr => {
      const attrName = attr.name 
      const key = attr.value
      // 判断是不是v-开头
      if(this.isDirective(attrName)) {
        // 截取指令名称 text、model、html
        const dir = attrName.slice(2)
        // 是否v-on
        if(this.isOnDirective(attrName)) {
          // v-on:click 取出事件名 click
          const eventName = attrName.split(':')[1]
          this.onEventListener(node, eventName, key)
          return
        }
        const methodUpdater = dir + 'Updater'
        // 执行对应的更新函数，
        this[methodUpdater] && this[methodUpdater](node, this.$vm[key], key)
        new Watcher(this.$vm, key, (val, key) => {
          this[methodUpdater](node, val, key)
        })
      } else if (this.isOnDirective(attrName)) {
        // 这里只处理 @click="method"的情况，不包括传参情况
        const eventName = attrName.split('@')[1]
        const methodName = node.getAttribute(attrName)
        this.onEventListener(node, eventName, methodName)
      }
    })
  }
  onEventListener(node, eventName, methodName) {
    node.addEventListener(eventName, (e) => {
      this.$vm.$options.methods[methodName] && this.$vm.$options.methods[methodName].call(this.$vm)
    })
  }
  // 处理v-text
  textUpdater(node, value) {
    node.textContent = value
  }
  // 处理v-html
  htmlUpdater(node, value) {
    node.innerHTML = value
  }
  // 处理v-model
  modelUpdater(node, value, key) {
    node.value = value
    node.addEventListener('input', (e) => {
      this.$vm[key] = e.target.value
      console.log(`model change ===`, this.$vm[key])
    })
  }
  // 判断是否是指令
  isDirective(attrName) {
    return attrName.startsWith('v-')
  }
  // 判断是否是事件指令 @
  isOnDirective(attrName) {
    return attrName.startsWith('v-on') || attrName.startsWith('@')
  }
  // 判断是否是文本节点 且 是差值表达式
  isTextNode(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent)
  }
}
```
## 关键点
### watcher怎么与属性依赖收集建立关系
+ 在属性get的时候，会将Dep.target添加到当前属性的dep依赖收集里
+ 在实例化watcher时，会将Dep.target设置为当前实例，然后触发下属性的get，此时watcher即加入到属性的dep里，在把Dep.target设置为null
### 属性更新时，怎么让dom重新渲染
+ 实例化watcher时，同时传入更新函数
+ 属性set的时候，会执行dep里所有的watcher的更新函数
### 数组怎么做响应式
+ 在对数据做响应式时，如果是数组实例，则覆盖当前数组实例的7个原型方法，有push、pop、shift、unshift、splice、sort、reverse，当执行这几个方法时，同时调用数组实例的__ob__.dep.notify,即执行notify操作。(在实例化Observe时，同时会将当前Observe实例保存到__ob__中，并且同时实例化一个dep，即可以通过__ob__.dep.notify执行更新操作)
+ 处理数组时，还需对数组里的每一项做响应式处理(主要是对对象和数组添加observer对象)。并且做数组添加时，如push、splice、unshift，也需要对添加的项做响应式处理(主要是对对象和数组添加observer对象)
+ 因为数组的响应式是通过覆盖原型方法实现的，没有实现检测数组的变动，所以通过修改数组的长度 和 通过索引修改数组的项. 如：this.arr.length = n, this.arr[0] = 1这两种形式(Object.defineProperty是可以检测到数组索引的变化的，但是由于性能代价于用户体验收益不成正比，所以没有做)
### 源码中数组的响应式实现
```js
/* 
  覆盖数组的原型方法
*/
const arrayProto = Array.prototype
// 复制数组原型
const arrayMethodsProto = Object.create(arrayProto)
// 要覆盖的7个方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
function def (obj, key, val) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: true,
    writable: true,
    configurable: true
  })
}
methodsToPatch.forEach(function (method) {
  const original = arrayProto[method]
  def(arrayMethodsProto, method, function mutator (...args) {
    // 数组方法的默认行为
    const result = original.apply(this, args)

    // 获取数组属性的 dep
    const ob = this.__ob__
    // 插入操作：会导致新元素进入，需要做响应式处理
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    // 
    if (inserted) ob.observeArray(inserted)
    // 通知更新
    ob.dep.notify()
    return result
  })
})

```