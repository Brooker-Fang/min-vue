/* 
  + 为每个属性收集观察者
  + 收集依赖
  + 发送通知
*/
class Dep{
  constructor() {
    this.deps = []
  }
  // 收集依赖
  collectDep(dep) {
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