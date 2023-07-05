import { makeAutoObservable, autorun } from 'mobx'
import { test, expect, afterEach, vi } from 'vitest'
import { nestable, INestedObservableArray } from '../index'

class GenericNestedClass<T> {
  count: T

  constructor(value: T) {
    this.count = value
    makeAutoObservable(this, {}, { autoBind: true })
  }
}

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
  list: INestedObservableArray<unknown, any> | null = null

  constructor(value: any, type: any) {
    this.list = nestable(value, type)
    makeAutoObservable(this, {}, { autoBind: true })
  }

  increment() {
    this.count += 2
  }
}

const consoleWarnMock = vi.fn()
console.warn = consoleWarnMock

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (...values: any[]) => {}

let Store
let countMock
let dispose

const createStore = (value: any, type: any) => {
  Store = new StoreClass(value, type)

  countMock = vi.fn(() => {
    noop(Store.count)
  })

  dispose = autorun(countMock)
}

afterEach(() => dispose && dispose())

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

  expect(() => createStore([1, 2], {})).toThrow()

  expect(consoleWarnMock.mock.calls.length).toEqual(1)
  expect(consoleWarnMock.mock.calls[0][0]).toContain('Type needs to be a class.')
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

  // @ts-expect-error
  list.extend('1')
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

  const list = nestable([{ color: 'blue', speed: 55 }] as Car[], GenericNestedClass<Car>)

  expect(list.length).toEqual(1)

  list.extend({ color: 'green', speed: 65 })

  expect(list.length).toEqual(2)

  list[0].remove()

  expect(list.length).toEqual(1)

  expect(list[0].count.color).toBe('green')
})

test('Instantiation only takes place when there is data.', () => {
  const constructorMock = vi.fn()

  class NestedClassMock {
    constructor(value: object) {
      constructorMock(value)
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  class StoreClassMock {
    list = nestable<object, typeof NestedClassMock>([], NestedClassMock)

    constructor() {
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  class StoreClassNullMock {
    list = nestable<object, typeof NestedClassMock>(null, NestedClassMock)

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

test('Remove still works even if makeAutoObservable missing.', () => {
  class NestedNotBound {
    value: number

    constructor(value: number) {
      this.value = value
    }
  }

  class StoreNotBound {
    list = nestable([1, 2, 3], NestedNotBound)

    constructor() {
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  const Data = new StoreNotBound()

  expect(Data.list.length).toEqual(3)

  Data.list[1].remove()

  expect(Data.list.length).toEqual(2)
})

test('Observable<Array>.replaceAll will insert instances.', () => {
  class NestedNotBound {
    value: number

    constructor(value: number) {
      this.value = value
    }
  }

  class StoreNotBound {
    list = nestable([1, 2, 3], NestedNotBound)

    constructor() {
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  const Data = new StoreNotBound()

  expect(Data.list.length).toBe(3)

  const result = Data.list.replaceAll([4, 5, 6, 7, 8, 9])

  expect(Data.list.length).toBe(6)

  // Default MobX replace returns previous elements (which isn't very useful).
  expect(result.length).toBe(3)
  expect(result[1].value).toBe(2)

  expect(Data.list[3].value).toEqual(7)

  Data.list[3].remove()

  expect(Data.list.length).toBe(5)
})

test('Types for items in list are inferred properly.', () => {
  const list = nestable<number, typeof NestedClass>([1, 2], NestedClass)

  // @ts-expect-error
  list.extend('hello')
  // @ts-expect-error
  list.extend({})

  list.extend(7)

  const firstItem = list[0]

  list.extend(firstItem.count)
  // @ts-expect-error
  list.extend(firstItem.hello)
})

test('Update method on item can be used to update arbitrary values.', () => {
  type CarInput = { id: string; color: string; speed: number; active?: boolean }
  class CarClass {
    id: string
    color: string
    speed: number
    active?: boolean

    constructor(value: CarInput) {
      this.id = value.id
      this.color = value.color
      this.speed = value.speed
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  const list = nestable<CarInput, typeof CarClass>(
    [
      { id: '1', color: 'red', speed: 50 },
      { id: '2', color: 'green', speed: 25 },
    ],
    CarClass
  )

  expect(list.length).toBe(2)
  expect(list[1].color).toBe('green')

  list[1].update({ color: 'blue' })

  expect(list[1].color).toBe('blue')

  list[1].update({ color: 'green', speed: 75, active: true })

  expect(list[1].color).toBe('green')
  expect(list[1].speed).toBe(75)
  expect(list[1].active).toBe(true)

  list[1].update({ active: undefined })

  expect(list[1].speed).toBe(75)
  expect(list[1].active).toBe(undefined)
})

test('Update method can be overridden on item.', () => {
  type CarInput = { id: string; color: string; speed: number; active?: boolean }
  class CarClass {
    id: string
    color: string
    speed: number
    active?: boolean

    constructor(value: CarInput) {
      this.id = value.id
      this.color = value.color
      this.speed = value.speed
      makeAutoObservable(this, {}, { autoBind: true })
    }

    update(value: CarInput) {
      this.color = value.color ?? this.color
    }
  }

  const list = nestable<CarInput, typeof CarClass>([{ id: '1', color: 'red', speed: 50 }], CarClass)

  expect(list.length).toBe(1)
  expect(list[0].color).toBe('red')

  list[0].update({ color: 'blue' })

  expect(list[0].color).toBe('blue')

  list[0].update({ speed: 75 })

  expect(list[0].color).toBe('blue')
  expect(list[0].speed).toBe(50)
})

test('byId method on list can be used to quickly find an item.', () => {
  type CarInput = { id: string; color: string; speed: number; active?: boolean }
  class CarClass {
    id: string
    color: string
    speed: number
    active?: boolean

    constructor(value: CarInput) {
      this.id = value.id
      this.color = value.color
      this.speed = value.speed
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  const list = nestable<CarInput, typeof CarClass>(
    [
      { id: '1', color: 'red', speed: 50 },
      { id: '2', color: 'green', speed: 25 },
    ],
    CarClass
  )

  expect(list.byId('1').color).toBe('red')
  expect(list.byId('2').color).toBe('green')

  list.byId('2').update({ id: '3', color: 'green' })

  expect(list.byId('3').color).toBe('green')
})
