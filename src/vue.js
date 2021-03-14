/* 
 + 保存传入的配置选项，el、data等
 + 对data里的数据代理到Vue实例上
 + 执行observe，对data里的数据做响应式处理
 + 执行编译compiler，解析模板指令、差值表达式、
*/
class Vue{
  constructor(options) {
    // 保存配置选项
    this.$options = options
    this.$el = typeof options.el === 'string' ? document.querySelector(options.el) : options.el
    this.$data = typeof options.data === 'function' ? options.data() : options.data
    // 将data里的数据代理到实例上
    this._proxy(this.$data)
    // 响应式处理
    new Observe(this.$data)
    // 执行编译
    new Compiler(this.$el, this)
  }
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