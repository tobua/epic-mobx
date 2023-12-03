import { makeAutoObservable, autorun, IReactionDisposer } from 'mobx'
import { test, expect, afterEach, vi, Mock } from 'vitest'
import { nestable, nestableObject } from '../index'

const nested = (count = 1) => ({
  count,
  double() {
    this.count *= 2
  },
})

const store = (value: any) => ({
  count: 0,
  list: nestableObject(value, nested),
  increment() {
    this.count += 2
  },
})

const consoleWarnMock = vi.fn()
// eslint-disable-next-line no-console
console.warn = consoleWarnMock

const noop = (() => {}) as (...values: any[]) => void

let countMock: Mock
let dispose: IReactionDisposer

const createStore = <T extends Object>(definition: (...args: any[]) => T, value: any) => {
  const Store = makeAutoObservable(definition(value), undefined, { autoBind: true })

  countMock = vi.fn(() => {
    // @ts-ignore
    noop(Store.count)
  })

  dispose = autorun(countMock)

  return Store as T
}

afterEach(() => dispose && dispose())

test('Basic store works and export is defined.', () => {
  const instance = createStore(store, [1, 2])

  expect(instance.count).toEqual(0)
  expect(countMock.mock.calls.length).toEqual(1)

  instance.increment()

  expect(instance.count).toEqual(2)
  expect(countMock.mock.calls.length).toEqual(2)

  expect(nestable).toBeDefined()
})

test('List is added to Store and can be accessed.', () => {
  const instance = createStore(store, [1, 2])

  expect(instance.list).toBeDefined()
  expect(instance.list[0].count).toBe(1)
  expect(instance.list[1].count).toBe(2)
  expect(instance.list.length).toBe(2)
})

test('Nested store can be added with extend.', () => {
  const instance = createStore(store, [1, 2])

  instance.list.extend(3)

  expect(instance.list.length).toBe(3)
  expect(instance.list[2].count).toBe(3)
})

test('Nested stores can be removed.', () => {
  const instance = createStore(store, [1, 2])

  expect(instance.list.length).toEqual(2)

  const secondNestedStore = instance.list[1]

  expect(secondNestedStore.remove).toBeDefined()

  secondNestedStore.remove()

  expect(instance.list.length).toEqual(1)
})

test('Works with empty initial values and inline type.', () => {
  const list = nestableObject([] as number[], nested)

  expect(list.length).toEqual(0)

  list.extend(1)

  expect(list.length).toEqual(1)

  // @ts-expect-error
  list.extend('1')
})

test('Works with empty initial values and generic types.', () => {
  const list = nestableObject<number, typeof nested>([], nested)

  expect(list.length).toEqual(0)

  list.extend(1)

  expect(list.length).toEqual(1)
})

test('Works with object types.', () => {
  type Car = {
    color: string
    speed: number
  }

  const initializeStore = (car = { color: 'red', speed: 5 }) => ({
    car,
    faster() {
      this.car.speed *= 2
    },
  })

  const list = nestableObject([{ color: 'blue', speed: 55 }] as Car[], initializeStore)

  expect(list.length).toEqual(1)

  list.extend({ color: 'green', speed: 65 })

  expect(list.length).toEqual(2)

  list[0].remove()

  expect(list.length).toEqual(1)

  expect(list[0].car.color).toBe('green')

  list[0].faster()

  expect(list[0].car.speed).toBe(65 * 2)
})

test('Documentation example works.', () => {
  const createItem = (count: number) => ({
    count,
  })

  const createContainer = () => ({
    list: nestableObject([1, 2], createItem),
  })

  const instance = makeAutoObservable(createContainer(), undefined, { autoBind: true })

  expect(instance.list[0].count).toBe(1)
  expect(instance.list[1].count).toBe(2)

  instance.list.extend(3)

  expect(instance.list[2].count).toBe(3)
  expect(instance.list.length).toBe(3)

  instance.list[1].remove()

  expect(instance.list.length).toBe(2)
})

test('Item methods still work even when remove is applied to new elements and nested elements.', () => {
  const simpleCreateItem = (count: number) => ({
    count,
  })

  const createItem = (count: number) => ({
    count,
    nestedList: nestableObject([3, 4], simpleCreateItem),
    anotherNestedList: nestableObject([5, 6], simpleCreateItem),
  })

  const list = nestableObject([1, 2], createItem)

  expect(list.length).toBe(2)
  list[1].remove()
  expect(list.length).toBe(1)
  list.extend(5)
  expect(list.length).toBe(2)
  expect(list[1].count).toBe(5)
  list[1].remove()
  expect(list.length).toBe(1)
  list.extend(6)
  list.extend(7)
  expect(list.length).toBe(3)
  list[2].remove()
  list[1].remove()
  expect(list.length).toBe(1)

  list.extend(8)

  expect(list.length).toBe(2)
  expect(list[0].nestedList.length).toBe(2)
  expect(list[0].nestedList[1].count).toBe(4)
  expect(list[1].anotherNestedList.length).toBe(2)

  list[0].nestedList[1].remove()

  expect(list[0].nestedList.length).toBe(1)
  expect(list[1].anotherNestedList.length).toBe(2)

  list[0].nestedList.extend(7)
  list[1].anotherNestedList.extend(8)
  list[1].anotherNestedList.extend(9)

  expect(list[0].nestedList.length).toBe(2)
  expect(list[1].anotherNestedList.length).toBe(4)

  list[0].nestedList[1].remove()
  list[1].anotherNestedList[3].remove()

  expect(list[0].nestedList.length).toBe(1)
  expect(list[1].anotherNestedList.length).toBe(3)

  list.extend(9)
  list[2].anotherNestedList.extend(10)

  expect(list[2].anotherNestedList[2].count).toBe(10)

  list[2].anotherNestedList[2].remove()

  expect(list[2].anotherNestedList.length).toBe(2)
})
