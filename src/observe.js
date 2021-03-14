/* 
  + 对传入的data里的每个属性做响应式处理
  + 如果属性的值也是一个对象，同样递归处理对象里的每个属性为响应式
  + 重写属性的get，但属性被读取时，创建一个watcher观察者
  + 重写属性的set，当属性改变时
*/
class Observe{
  constructor(data) {
    this.walk(data)
  }
  walk(data) {
    console.log('data===', data)
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
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        return val
      },
      set(v) {
        if(v !== val){
          self.walk(data)
          val = v
        }
      }
    })
  }
}

