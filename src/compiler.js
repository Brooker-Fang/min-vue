/* 
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
  + 编译解析的指令或者表达式的同时，new Watcher，传入更新函数。数据发生变化后，会通知所有watcher执行更新函数，即重新渲染相对应的dom更新
*/
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
    console.log(node)
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
      console.log(`${key}===`, this.$vm[key])
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