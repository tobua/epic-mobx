<p align="center">
  <img src="https://github.com/tobua/epic-mobx/raw/main/logo.png" alt="epic-mobx" height="150">
</p>

# epic-mobx

Makes it easy to work with lists of nested stores in MobX.

- Automatic store instantiation
- Remove nested stores without parent reference

[![Demo](https://img.shields.io/static/v1?label=epic-mobx&message=Demo&color=brightgreen)](https://tobua.github.io/epic-mobx)
[![npm](https://img.shields.io/npm/v/epic-mobx)](https://npmjs.com/epic-mobx)

## Usage

```js
import { makeAutoObservable } from 'mobx'
import { nestable } from 'epic-mobx'

class Item {
  constructor(value: number) {
    this.count = value
    makeAutoObservable(this, {}, { autoBind: true })
  }
}

class Container {
  list = nestable([1, 2], Item)

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }
}

const Store = new StoreClass()

// Initial values automatically initialized with NestedClass
Store.list[0].count === 1
Store.list[1].count === 2

// Instead of Store.list.push(new NestedClass(3))
Store.list.extend(3)

Store.list[2].count === 3

// Remove individual elements without a reference to the containing store.
Store.list[1].remove()
```

## Methods

### Create

```ts
nestable(['hello', 'world'], Item)
// Without generic type inferrable from first array argument.
nestable<string, typeof Item>([], Item)
// To avoid specifying both generic types, type the first argument.
nestable([] as string[], Test)
```

Creates a MobX `observable` that can later quickly be extended with the store constructor
passed in the second argument.

### Extend

```ts
const myList = nestable([{ color: 'red', speed: 50 }], Item)

myList.extend({ color: 'blue', speed: 100 })
myList.extend({ color: 'green', speed: 75 })
```

This plugin will create a new instance of the store defined at the start.

### Find

```ts
const myList = nestable([{ id: '1', color: 'red', speed: 50 }, { id: '2', color: 'green', speed: 25 }], Item)

myList.byId('2').remove()
```

`byId` will find the first element in the list with a matching id and return it.

### Update

```ts
const myList = nestable([{ id: '1', color: 'red', speed: 50 }, { id: '2', color: 'green', speed: 25 }], Item)

myList[1].update({ color: 'blue', speed: 75, newProperty: false })
```

Using the [`placeAll()`]() method this will update any passed properties on the list item. When an `update` method is already present on the item it will have precedence.

### Remove

```ts
myList[1].remove() // => Item({ color: 'blue', speed: 100 }) removed from the myList list
```

Removing items this way avoids the need for a refrence to the observable. This
is especially useful when `.map`'ing over a list in React and then removing
individual elements in their specific component without access to the list anymore.

```tsx
import { NestableItem } from 'epic-mobx'

const Item = observer(({ item }: { item: Item & NestableItem }) => (
  <Button onClick={item.remove}>Remove</Button>
))
```

To ensure the added methods like `remove` are available in typescript you can add them
with the exported `NestableItem` class.

### replaceAll

Use this function instead of `observable.replace` to replace all items with new instances of the nestable class.

```ts
const myNestable = nestable([{ color: 'red', speed: 50 }], Item)

nestable.replaceAll([
  { color: 'blue', speed: 100 },
  { color: 'green', speed: 75 },
])
```

## Structuring Stores

To keep in line with the idea of one class per file the following structure has proven useful.

```
my-app
├── data
│   ├── index.ts
│   ├── project.ts
│   └── user.ts
├── markup
|   └── Button.tsx
└── index.tsx
```

Place all MobX Stores inside a folder we now call `data` and export a single root store with all the nested stores imported from different files accessible by importing the root store instance.

```ts
import { makeAutoObservable } from 'mobx'
import { nestable } from 'epic-mobx'
import { Project } from './project'
import { User } from './user'

class Store {
  user = nestable([{ name: 'Jimmy' }], User)
  project = nestable([], Project)

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  randomProject() {
    return this.project[Math.floor(Math.random() * this.project.length) + 1]
  }
}

export const Data = new Store()
```

## Utility Method: placeAll

Use this method to avoid assigning long lists of initial values onto an instance. Make sure to call it before `makeAutoObservable`.

```ts
import { placeAll } from 'epic-mobx'

type ItemInput = { title: string; text: string; date: string }

class Item {
  constructor({ title, text, date }: ItemInput) {
    this.title = title
    this.text = text
    this.date = date
  }
  // =>
  constructor(data: ItemInput) {
    placeAll(this, data)
  }
  // Also works with multiple arguments.
  constructor(...args) {
    placeAll(this, args)
  }
}
```

## Experimental: Usage with Objects

```js
import { makeAutoObservable } from 'mobx'
import { nestableObject } from 'epic-mobx'

const createItem = (count: number) => ({
  count,
})

const createContainer = () => ({
  // Use nestableObject instead of nestable when not using classes.
  list: nestableObject([1, 2], createItem),
})

const store = makeAutoObservable(createContainer(), undefined, { autoBind: true })

// Initial values automatically initialized with NestedClass
store.list[0].count === 1
store.list[1].count === 2

// Instead of store.list.push(new NestedClass(3))
store.list.extend(3)

store.list[2].count === 3

// Remove individual elements without a reference to the containing store.
store.list[1].remove()
```
