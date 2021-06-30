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
const myNestable = nestable([{ color: 'red', speed: 50 }], Item)

nestable.extend({ color: 'blue', speed: 100 })
nestable.extend({ color: 'green', speed: 75 })
```

This plugin will create a new instance of the store defined at the start.

### Remove

```ts
myNestable[1].remove() // => Item({ color: 'blue', speed: 100 }) removed from the myNestable list
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
