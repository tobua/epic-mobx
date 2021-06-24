import { makeAutoObservable, autorun } from 'mobx'
import { nestable } from '../index'

class NestedClass {
  count = 1

  constructor(value: number) {
    this.count = value
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
  expect(consoleWarnMock.mock.calls[0][0]).toEqual('Type needs to be a class.')
})
