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

  let observableList: IObservableArray<ExtendedType>

  class ExtendedType extends Type {
    remove() {
      const found = observableList.find((item) => item === this)
      observableList.remove(found)
    }
  }

  const initialInstanes = initial.map((value) => new ExtendedType(value))
  observableList = observable(initialInstanes)

  Object.defineProperty(observableList, 'extend', {
    value: (value: T) => {
      observableList.push(new ExtendedType(value))
    },
    enumerable: true,
  })

  return observableList as INestedObservableArray<ExtendedType>
}
