## Vue2的响应式实现流程
+ Vue初始化时，会把data里的所有数据通过Object.defineProperty进行数据劫持，即重写数据的get和set。所以只有初始化时的属性才有响应式，新增的属性得通过$set,才会进行响应式处理
+ data里的每个属性，都会有属于自己的依赖收集的实例，new Dep。属性get时，进行收集观察者，属性set时，通知所有观察者执行更新函数
+ 对数据做响应式处理后，执行编译。当编译到指令执行dom更新时，同时创建观察者，传入更新函数
+ 观察者初始化时，通过触发属性的get，将观察者添加到相对应属性的 依赖收集里。
+ 在对属性重新设值的时候，dep会同时触发所有观察者的更新函数

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
            name: 'fhh'
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
## 关键点
### 观察者怎么与属性依赖收集建立关系
### 属性更新时，怎么让dom重新渲染
### 数组怎么做响应式