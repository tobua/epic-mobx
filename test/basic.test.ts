import { makeAutoObservable, autorun } from 'mobx'
import { nestable } from '../index'

class NestedClass {
  count = 1

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

const consoleWarnMock = jest.fn()
console.warn = consoleWarnMock

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (...values: any[]) => {}

let Store
let countMock
let dispose

const createStore = (value: any, type: any) => {
  Store = new StoreClass(value, type)

  countMock = jest.fn(() => {
    noop(Store.count)
  })

  dispose = autorun(countMock)
}

afterEach(() => dispose())

test('Basic store works and export is defined.', () => {
  createStore([1, 2], NestedClass)

  expect(Store.count).toEqual(0)
  expect(countMock.mock.calls.length).toEqual(1)

  Store.increment()

  expect(Store.count).toEqual(2)
  expect(countMock.mock.calls.length).toEqual(2)

  expect(nestable).toBeDefined()
})

test('Warning if second argument is not a class.', () => {
  expect(consoleWarnMock.mock.calls.length).toEqual(0)

  createStore([1, 2], {})

  expect(consoleWarnMock.mock.calls.length).toEqual(1)
  expect(consoleWarnMock.mock.calls[0][0]).toContain(
    'Type needs to be a class.'
  )
})

test('List is added to Store and can be accessed.', () => {
  createStore([1, 2], NestedClass)

  expect(Store.list).toBeDefined()
  expect(Store.list[0].count).toBe(1)
  expect(Store.list[1].count).toBe(2)
  expect(Store.list.length).toBe(2)
})

test('Nested store can be added with extend.', () => {
  createStore([1, 2], NestedClass)

  Store.list.extend(3)

  expect(Store.list.length).toBe(3)
  expect(Store.list[2].count).toBe(3)
})

test('Nested stores can be removed.', () => {
  createStore([1, 2], NestedClass)

  expect(Store.list.length).toEqual(2)

  const secondNestedStore = Store.list[1]

  expect(secondNestedStore.remove).toBeDefined()

  secondNestedStore.remove()

  expect(Store.list.length).toEqual(1)
})

test('Works with empty initial values and inline type.', () => {
  const list = nestable([] as number[], NestedClass)

  expect(list.length).toEqual(0)

  list.extend(1)

  expect(list.length).toEqual(1)
})

test('Works with empty initial values and generic types.', () => {
  const list = nestable<number, typeof NestedClass>([], NestedClass)

  expect(list.length).toEqual(0)

  list.extend(1)

  expect(list.length).toEqual(1)
})

test('Works with object types.', () => {
  type Car = {
    color: string
    speed: number
  }

  const list = nestable([{ color: 'blue', speed: 55 }] as Car[], NestedClass)

  expect(list.length).toEqual(1)

  list.extend({ color: 'green', speed: 65 })

  expect(list.length).toEqual(2)

  list[0].remove()

  expect(list.length).toEqual(1)

  expect(list[0].count.color).toBe('green')
})

test('Instantiation only takes place when there is data.', () => {
  const constructorMock = jest.fn()

  class NestedClassMock {
    constructor(value: object) {
      constructorMock(value)
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  class StoreClassMock {
    list = nestable([], NestedClassMock)

    constructor() {
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  class StoreClassNullMock {
    list = nestable(null, NestedClassMock)

    constructor() {
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  const StoreMock = new StoreClassMock()

  expect(constructorMock.mock.calls.length).toBe(0)

  StoreMock.list.extend({ hello: 'world' })

  expect(constructorMock.mock.calls.length).toBe(1)
  expect(constructorMock.mock.calls[0][0]).toEqual({ hello: 'world' })

  const StoreNullMock = new StoreClassNullMock()

  expect(constructorMock.mock.calls.length).toBe(1)

  StoreNullMock.list.extend({ hello: 'world' })

  expect(constructorMock.mock.calls.length).toBe(2)
})
