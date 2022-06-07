import { makeAutoObservable, autorun } from 'mobx'
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

const consoleWarnMock = jest.fn()
console.warn = consoleWarnMock

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (...values: any[]) => {}

let Store
let countMock
let dispose

const createStore = <Type extends (...args: any[]) => object>(
  definition: (...args: any[]) => ReturnType<Type>,
  value: any
) => {
  Store = makeAutoObservable(definition(value), undefined, { autoBind: true }) as ReturnType<Type>

  countMock = jest.fn(() => {
    noop(Store.count)
  })

  dispose = autorun(countMock)

  return Store
}

afterEach(() => dispose())

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

  // TODO instance is any
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
