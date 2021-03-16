/* 
  + 针对每次编译解析，需要更新的dom，都需要创建一个watcher，观察者
  + watcher实例化时，将实例添加到 Dep
   + 设置Dep的target为当前实例
   + 同时读取属性的值。触发属性的get，将watcher实例添加到Dep里
*/
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
  update() {
    this.updateFn.call(this.$vm, this.$vm[this.$key], this.$key)
  }
}