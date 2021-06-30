import { makeAutoObservable } from 'mobx'
import { nestable } from '../index'

class Counter {
  count = 1

  constructor(value: number) {
    this.count = value
  }
}

class NestedClass {
  count = 1
  anotherList = nestable([1, 2], Counter)

  constructor(value: number) {
    this.count = value
    makeAutoObservable(this, {}, { autoBind: true })
  }

  double() {
    this.count *= 2
  }
}

class StoreClass {
  count = 0
  list = null

  constructor(value: any, type: any) {
    this.list = nestable(value, type)
    makeAutoObservable(this, {}, { autoBind: true })
  }

  increment() {
    this.count += 2
  }
}

test('Nestable can be nested deeply.', () => {
  const Store = new StoreClass([1, 2], NestedClass)

  expect(Store.list[0].count).toBe(1)
  expect(Store.list[1].count).toBe(2)
  expect(Store.list.length).toBe(2)

  expect(Store.list[0].anotherList[0].count).toBe(1)
  expect(Store.list[0].anotherList.length).toBe(2)

  Store.list[0].anotherList[0].remove()

  expect(Store.list[0].anotherList.length).toBe(1)

  Store.list[0].anotherList.extend(3)

  expect(Store.list[0].anotherList.length).toBe(2)
})
