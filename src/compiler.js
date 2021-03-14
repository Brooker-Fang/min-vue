/* 
  + 遍历el下的所有dom元素，进行编译
  + 通过nodeType判断是元素节点还是文本节点，1为元素节点，3为文本节点
  + 元素节点需要遍历解析属性，文本节点则主要解析差值表达式
  + 编译即解析dom里的指令和差值表达式，执行不同的更新操作：
    + v-text 替换元素的innerHTML,
    + v-model 注册input事件，数据改变时，改变input的值，input输入时，同时改变数据 
    + v-on 取出事件类型和事件名，监听事件
    + 差值表达式 用正则直接替换为 data里的属性的值
  + 数据变化后，执行更新dom操作
*/
class Compiler{
  constructor(el, vm) {
    this.$el = el
    this.$vm = vm
  }
}