/* 
  + 遍历el下的所有dom元素，进行编译
  + 通过nodeType判断是元素节点还是文本节点，1为元素节点，3为文本节点
  + 元素节点需要遍历解析属性，文本节点则主要解析差值表达式
  + 编译即解析dom里的指令和差值表达式，执行不同的更新操作：
    编译元素节点
      + v-text 替换元素的textContext
      + v-html
      + v-model 注册input事件，数据改变时，改变input的值，input输入时，同时改变数据 
      + v-on 取出事件类型和事件名，监听事件
    编译文本节点
      + 差值表达式 用正则获取差值表达式的 key，然后得到vue实例中data里key的值，替换文本节点 textContent = val
  + 数据变化后，执行更新dom操作
*/
class Compiler{
  constructor(el, vm) {
    this.$el = el
    this.$vm = vm
    this.compiler(el)
  }
  compiler(el) {
    // 遍历子元素
    el.childrenNodes.forEach(node => {
      // 编译元素节点
      if (node.nodeType === 1) {
        this.compilerElement(node)
      } else if (this.isTextNode(node)) {
        // 编译文本节点
        this.compilerTextElement(node)
      }
      if(node.childrenNodes && node.childrenNodes.length) {
        this.compiler(node)
      }
    })
  }
  // 解析文本节点
  compilerTextElement(node) {
    // 用正则获取key
    const reg = /\{\}(.+?)\}\}/
    const text = node.textContext
    if (reg.test(text)) {
      const key = RegExp.$1.trim()
      node.textContext = text.replace(reg, this.$vm[key])
    }
  }
  // 编译元素节点
  compilerElement(node) {
    Array.form(node.attributes).forEach(attr => {
      const attrName = attr.name 
      const attrVal = attr.value
      // 判断是不是v-开头
      if(this.isDirective(attrName)) {
        // 截取指令名称 text、model、html
        const dir = attrName.slice(2)
        const methodUpdater = dir + 'Updater'
        // attrVal 即为 vm里的key
        this[methodUpdater] && this[methodUpdater](node, this.$vm[attrVal])
      }
    })
  }
  // 处理v-text
  textUpdater(node, value) {
    node.textContext = value
  }
  // 处理v-html
  htmlUpdate(node, value) {
    node.innerHTML = value
  }
  // 处理v-model
  // 判断是否是指令
  isDirective(attrName) {
    return attrName.startsWith(attrName)
  }
  // 判断是否是文本节点 且 是差值表达式
  isTextNode(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContext)
  }
}