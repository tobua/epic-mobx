import { IObservableArray } from 'mobx'

export interface INestedObservableArray<InputValue, ItemClass> extends IObservableArray<ItemClass> {
  extend: (value: InputValue) => void
  replaceAll: (values: InputValue[]) => ItemClass[]
}

export interface NestableItem {
  remove: () => void
  __root: INestedObservableArray<any, any>
}
