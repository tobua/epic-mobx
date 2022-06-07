import { observable, IObservableArray, runInAction } from 'mobx'
import { INestedObservableArray, NestableItem } from './index'

// Adds remove to instances.
const enhanceFunctionInstance = (instance: any, list: any) => {
  if (!instance.remove) {
    instance.remove = function remove() {
      const found = list.find((item) => item === this)
      if (found) {
        runInAction(() => {
          list.remove(found)
        })
      }
    }
  }

  return instance
}

export const nestableObject = <ConstructorValue, ItemClass extends (...args: any) => any>(
  initialValues: ConstructorValue[],
  inputFunction: ItemClass
) => {
  if (process.env.NODE_ENV !== 'production' && typeof inputFunction !== 'function') {
    // eslint-disable-next-line no-console
    console.warn('epic-mobx: Type needs to be a function.')
    return null
  }

  const initialInstanes = Array.isArray(initialValues)
    ? initialValues.map((value) => inputFunction(value))
    : []
  const observableList: IObservableArray<ItemClass> = observable(initialInstanes)

  observableList.forEach((instance) => enhanceFunctionInstance(instance, observableList))

  Object.defineProperty(observableList, 'extend', {
    value: (value: ConstructorValue) => {
      observableList.push(inputFunction(value))
    },
    enumerable: true,
  })

  Object.defineProperty(observableList, 'replaceAll', {
    value: (values: ConstructorValue[]) => {
      const instances = values.map((value) => inputFunction(value))
      return observableList.replace(instances)
    },
    enumerable: true,
  })

  return observableList as INestedObservableArray<
    ConstructorValue,
    ReturnType<ItemClass> & NestableItem
  >
}
