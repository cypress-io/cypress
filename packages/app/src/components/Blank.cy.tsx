import { initial } from './Blank'
import { ROOT_ID } from '@cypress/mount-utils'

describe('initial', () => {
  it('works', () => {
    const root = document.getElementById(ROOT_ID)!

    root.innerHTML = initial()
  })
})
