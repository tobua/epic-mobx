import { observable, IObservableArray, runInAction } from 'mobx'

type Class = { new (...args: any[]): any }

interface INestedObservableArray<InputValue, ItemClass>
  extends IObservableArray<ItemClass> {
  extend: (value: InputValue) => void
}

export interface NestableItem {
  remove: () => void
}

// Used to ensure remove bound to instance as autoBind won't work with transpilation.
const createInstance = (Base: Class, values: any) => {
  const instance = new Base(values)
  instance.remove = instance.remove.bind(instance)
  return instance
}

export const nestable = <ConstructorValue, ItemClass extends Class>(
  initialValues: ConstructorValue[],
  InputClass: ItemClass
) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    typeof InputClass !== 'function'
  ) {
    // eslint-disable-next-line no-console
    console.warn('epic-mobx: Type needs to be a class.')
    return null
  }

  let observableList: IObservableArray<ItemClass>
  // Create a class instance so we can later extract it's type.
  const inputInstance = new InputClass(null)

  InputClass.prototype.remove = function remove() {
    const found = observableList.find((item) => item === this)
    if (found) {
      runInAction(() => {
        observableList.remove(found)
      })
    }
  }

  const initialInstanes = initialValues.map((value) =>
    createInstance(InputClass, value)
  )
  observableList = observable(initialInstanes)

  Object.defineProperty(observableList, 'extend', {
    value: (value: ConstructorValue) => {
      observableList.push(createInstance(InputClass, value))
    },
    enumerable: true,
  })

  return observableList as INestedObservableArray<
    ConstructorValue,
    typeof inputInstance & NestableItem
  >
}
