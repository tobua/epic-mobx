import { makeAutoObservable } from 'mobx'
import { placeAll } from '../index'

test('Can use placeAll helper to distribute properties.', () => {
  class Store {
    title: string
    content: string
    date: string

    constructor(data: { title: string; content: string; date: string }) {
      placeAll(this, data)
      makeAutoObservable(this, {}, { autoBind: true })
    }

    setContent(value: string) {
      this.content = value
    }
  }

  const Data = new Store({ title: 'Hello', content: 'World', date: '1984' })

  expect(Data.title).toBe('Hello')
  expect(Data.content).toBe('World')

  Data.content = 'Another'

  expect(Data.content).toBe('Another')

  Data.setContent('Some')
})

test('Can use placeAll with multiple arguments.', () => {
  class Store {
    title: string
    content: string
    date: string

    constructor(...data: [{ title: string; content: string }, { date: string }]) {
      placeAll(this, data)
      makeAutoObservable(this, {}, { autoBind: true })
    }

    setContent(value: string) {
      this.content = value
    }
  }

  const Data = new Store({ title: 'Hello', content: 'World' }, { date: '1984' })

  expect(Data.content).toBe('World')
  expect(Data.date).toBe('1984')
})

test('Works with nested objects.', () => {
  class Store {
    nested: {
      title: string
      content: string
    }

    constructor(data: { nested: { title: string; content: string } }) {
      placeAll(this, data)
      makeAutoObservable(this, {}, { autoBind: true })
    }
  }

  const Data = new Store({ nested: { title: 'Hello', content: 'World' } })

  expect(Data.nested.title).toBe('Hello')
  // @ts-ignore
  expect(Data.content).toBeUndefined()
})
