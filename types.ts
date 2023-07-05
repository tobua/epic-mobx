import { IObservableArray } from 'mobx'

export interface INestedObservableArray<InputValue, ItemClass> extends IObservableArray<ItemClass> {
  extend: (value: InputValue) => void
  byId: (id: any) => ItemClass
  replaceAll: (values: InputValue[]) => ItemClass[]
}

export interface NestableItem {
  remove: () => void
  update: (data: any) => NestableItem
  __root: INestedObservableArray<any, any>
}
