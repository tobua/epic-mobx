import { makeAutoObservable, autorun } from 'mobx'
import { nest } from '../index'

class StoreClass {
  count = 0

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  increment() {
    this.count += 2
  }
}

const Store = new StoreClass()

const countMock = jest.fn(() => {
  console.log(Store.count)
})

const dispose = autorun(countMock)

afterAll(dispose)

test('Basic example.', () => {
  expect(Store.count).toEqual(0)
  expect(countMock.mock.calls.length).toEqual(1)

  Store.increment()

  expect(Store.count).toEqual(2)
  expect(countMock.mock.calls.length).toEqual(2)

  expect(nest).toBeDefined()
})
