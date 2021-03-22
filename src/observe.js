/* 
  + 对传入的data里的每个属性做响应式处理，并且为每个属性创建一个依赖收集dep
    + 如果属性的值也是一个对象，同样递归处理对象里的每个属性为响应式。
    + 如果是属性的值是数组，则需对此数组实例覆盖原有方法，并对数组里的每一项做响应式处理
  + 响应式处理：
    + 使用Object.defineProperty,对每个属性进行劫持，重写get、set
    + get，当属性被读取时，将watcher观察者添加到当前属性的dep中。此时watcher会存于Dep类的静态属性target中
    + set，当属性改变时，通知当前属性的dep下的所有观察者，执行更新操作
*/
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

