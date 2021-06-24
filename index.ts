import { observable, IObservableArray } from 'mobx'

type Class = { new (...args: any[]): any }

interface INestedObservableArray<T> extends IObservableArray<T> {
  extend: (value: T) => void
}

export const nestable = <T>(initial: T[], Type: Class) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    !(typeof Type === 'function' && /^\s*class\s+/.test(Type.toString()))
  ) {
    console.warn('Type needs to be a class.')
    return null
  }

  const initialInstanes = initial.map((value) => new Type(value))
  const wrapper = observable(initialInstanes)

  ;(wrapper as INestedObservableArray<T>).extend = (value: T) => {
    wrapper.push(new Type(value))
  }

  return wrapper as INestedObservableArray<T>
}
