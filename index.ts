import { createAtom } from 'mobx'

export const nest = createAtom(
  'Nest',
  () => console.log('start observing'),
  () => console.log('stop observing')
)
