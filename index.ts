import { observable, IObservableArray, runInAction, makeObservable, action } from 'mobx'
import { INestedObservableArray, NestableItem } from './types'

export { nestableObject } from './object'
export { INestedObservableArray, NestableItem }

type Class = { new (...args: any[]): any }

// Used to ensure remove bound to instance as autoBind won't work with transpilation.
const createInstance = (Base: Class, values: any) => {
  const instance = new Base(values)

  // When using makeAutoObservable remove will already be observable.
  if (!instance.remove.isMobxAction) {
    makeObservable(instance, {
      remove: action.bound,
    })
  }

  return instance
}

export const nestable = <ConstructorValue, ItemClass extends Class>(
  initialValues: ConstructorValue[] | null,
  InputClass: ItemClass
) => {
  if (process.env.NODE_ENV !== 'production' && typeof InputClass !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('epic-mobx: Type needs to be a class.')
  }

  let observableList: IObservableArray<ItemClass>
  // Create a class instance so we can later extract it's type.
  // Instead of new InputClass(null) to avoid constructor call.
  const inputInstance = Object.create(InputClass.prototype)

  InputClass.prototype.remove = function remove() {
    const found = observableList.find((item) => item === this)
    if (found) {
      runInAction(() => {
        observableList.remove(found)
      })
    }
  }

  const initialInstanes = Array.isArray(initialValues)
    ? initialValues.map((value) => createInstance(InputClass, value))
    : []
  observableList = observable(initialInstanes)

  Object.defineProperty(observableList, 'extend', {
    value: (value: ConstructorValue) => {
      runInAction(() => {
        observableList.push(createInstance(InputClass, value))
      })
    },
    enumerable: true,
  })

  Object.defineProperty(observableList, 'replaceAll', {
    value: (values: ConstructorValue[]) => {
      const instances = values.map((value) => createInstance(InputClass, value))
      let result
      runInAction(() => {
        result = observableList.replace(instances)
      })
      return result
    },
    enumerable: true,
  })

  return observableList as INestedObservableArray<
    ConstructorValue,
    typeof inputInstance & NestableItem
  >
}

export const placeAll = (instance: object, ...values: any[]) => {
  values.forEach((properties) => {
    if (Array.isArray(properties)) {
      properties.forEach((innerProperties) => {
        Object.keys(innerProperties).forEach((key) => {
          instance[key] = innerProperties[key]
        })
      })
    } else {
      Object.keys(properties).forEach((key) => {
        instance[key] = properties[key]
      })
    }
  })
}
