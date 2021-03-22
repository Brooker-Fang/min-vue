/* 
  覆盖数组的原型方法
*/
const arrayProto = Array.prototype
const arrayMethodsProto = Object.create(arrayProto)
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
  // cache original method
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
    if (inserted) ob.observeArray(inserted)
    // 通知更新
    ob.dep.notify()
    return result
  })
})
