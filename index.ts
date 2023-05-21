import { observable, IObservableArray, runInAction, makeObservable, action } from 'mobx'
import { INestedObservableArray, NestableItem } from './types'

export { nestableObject } from './object'
export { INestedObservableArray, NestableItem }

type Class = { new (...args: any[]): any }

// Used to ensure remove bound to instance as autoBind won't work with transpilation.
const createInstance = <Item extends Class>(
  Base: Item,
  values: any,
  list: IObservableArray<Item>
) => {
  const instance = new Base(values)

  Object.defineProperty(instance, '__root', {
    value: list,
    writable: false,
    enumerable: false,
  })

  // When using makeAutoObservable remove will already be observable.
  if (!instance.remove.isMobxAction) {
    makeObservable(instance, {
      remove: action.bound,
    })
  }

  return instance as Item
}

export function nestable<ConstructorValue, ItemClass extends Class>(
  initialValues: ConstructorValue[] | null,
  InputClass: ItemClass
) {
  if (process.env.NODE_ENV !== 'production' && typeof InputClass !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('epic-mobx: Type needs to be a class.')
  }

  const observableList = observable<ItemClass>([])

  // this will automatically be bound to the item from where remove is called.
  InputClass.prototype.remove = function remove(this: NestableItem) {
    // eslint-disable-next-line no-underscore-dangle
    const list = this.__root
    runInAction(() => {
      list.remove(this)
    })
  }

  // Add initial instances (which require a reference to the list).
  if (Array.isArray(initialValues)) {
    observableList.push(
      ...initialValues.map((value) => createInstance<ItemClass>(InputClass, value, observableList))
    )
  }

  Object.defineProperty(observableList, 'extend', {
    value: (value: ConstructorValue) => {
      runInAction(() => {
        observableList.push(createInstance(InputClass, value, observableList))
      })
    },
    enumerable: true,
  })

  Object.defineProperty(observableList, 'replaceAll', {
    value: (values: ConstructorValue[]) => {
      const instances = values.map((value) => createInstance(InputClass, value, observableList))
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
    InstanceType<ItemClass> & NestableItem
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
