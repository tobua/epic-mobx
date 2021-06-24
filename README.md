# epic-mobx

Easy nested observable structures in MobX.

```js
import { nestable } from 'epic-mobx'

class NestedClass {
  constructor(value: number) {
    this.count = value
  }
}

class StoreClass {
  list = nestable([1, 2], NestedClass)

  constructor(value: any, type: any) {
    makeAutoObservable(this, {}, { autoBind: true })
  }
}

const Store = new StoreClass()

// Initial values automatically initialized with NestedClass
Store.list[0].count === 1
Store.list[1].count === 2

// Instead of Store.list.push(new NestedClass(3))
Store.list.extend(3)

Store.list[2].count === 3
```
