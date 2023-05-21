import { makeAutoObservable } from 'mobx'
import { INestedObservableArray, nestable, NestableItem } from '../index'

class Counter {
  count = 1

  constructor(value: number) {
    this.count = value
    makeAutoObservable(this, {}, { autoBind: true })
  }
}

class NestedClass {
  count = 1
  anotherList: INestedObservableArray<number, Counter & NestableItem>

  constructor(value: number) {
    this.anotherList = nestable([1, 2], Counter)
    this.count = value
    makeAutoObservable(this, {}, { autoBind: true })
  }

  double() {
    this.count *= 2
  }
}

class StoreClass {
  count = 0
  list: INestedObservableArray<any, NestedClass & NestableItem>
  secondList: INestedObservableArray<any, NestedClass & NestableItem>

  constructor(value: any, type: any) {
    this.list = nestable(value, type)
    this.secondList = nestable(value, type)
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

test('Item methods still work even when nestable is nested and remove applied to new elements.', () => {
  const Store = new StoreClass([1, 2], NestedClass)

  // Removing of extended items works when not nested.
  expect(Store.list.length).toBe(2)
  Store.list.extend([6, 7, 8])
  Store.list.extend([9])
  expect(Store.list.length).toBe(4)
  Store.list[2].remove()
  expect(Store.list.length).toBe(3)
  expect(Store.list[0].anotherList.length).toBe(2)

  // Multiple nestables have been problematic.
  expect(Store.secondList.length).toBe(2)
  Store.secondList.extend([6, 7, 8])
  Store.secondList.extend([9])
  expect(Store.secondList.length).toBe(4)
  Store.secondList[2].remove()
  expect(Store.secondList.length).toBe(3)
  expect(Store.secondList[0].anotherList.length).toBe(2)

  // Removing of extended and nested item.
  Store.list[0].anotherList.extend(3)
  // @ts-expect-error
  Store.list[0].anotherList.extend('4')
  expect(Store.list[0].anotherList.length).toBe(4)
  // Removing item not previously in list.
  Store.list[0].anotherList[2].remove()
  expect(Store.list[0].anotherList.length).toBe(3)
})
