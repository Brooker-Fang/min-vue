## MVVM框架
+ M是Model、V是View、VM是ViewModel
## Vue的响应式原理
+ Vue初始化时，会把data里的所有数据通过Object.defineProperty进行数据劫持，即重写数据的get和set
+ data里的每个属性，都有属于自己的依赖收集，即dep