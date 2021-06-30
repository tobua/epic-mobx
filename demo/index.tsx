import { useState } from 'react'
import { render } from 'react-dom'
import { Exmpl, Button, Input } from 'exmpl'
import { makeAutoObservable } from 'mobx'
import { observer } from 'mobx-react-lite'
import { nestable, NestableItem } from 'epic-mobx'

class NestedClass {
  count = 1

  constructor(value: number) {
    this.count = value
    makeAutoObservable(this, {}, { autoBind: true })
  }

  double() {
    this.count *= 2
  }
}

class StoreClass {
  count = 0
  list = nestable<number, typeof NestedClass>([1, 2], NestedClass)

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true })
  }

  add(initialCount: number) {
    this.list.extend(initialCount)
  }

  increment() {
    this.count += 2
  }
}

const Store = new StoreClass()

const Item = observer(({ item }: { item: NestedClass & NestableItem }) => (
  <div>
    <p>Count: {item.count}</p>
    <Button onClick={item.double}>Double</Button>
    <Button onClick={item.remove}>Remove</Button>
  </div>
))

const Basic = observer(() => {
  const [addValue, setAdd] = useState(3)

  return (
    <>
      <h2>All nested stores</h2>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 20 }}>
        {Store.list.map((item, index) => (
          <Item key={index} item={item} />
        ))}
      </div>
      <h2>Add another store</h2>
      <Input placeholder="Initial count" value={addValue} onValue={setAdd} />
      <Button
        onClick={() => {
          Store.add(addValue)
          setAdd(Store.list.length + 1)
        }}
      >
        Add
      </Button>
    </>
  )
})

render(
  <Exmpl title="epic-mobx Demo" npm="epic-mobx" github="tobua/epic-mobx">
    <Basic />
  </Exmpl>,
  document.body
)
