/* 
  + 对传入的data里的每个属性做响应式处理
  + 如果属性的值也是一个对象，同样递归处理对象里的每个属性为响应式
  + 重写属性的get，但属性被读取时，创建一个watcher观察者
  + 重写属性的set，当属性改变时
*/
const arrayMethods = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
class Observer{
  constructor(data) {
    // 用于收集对象本身的依赖,即 对对象本身做响应式
    this.dep = new Dep()
    // 存储Observer对象
    data.__ob__ = this
    // 遍历对象属性 做响应式
    this.walk(data)
    
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

