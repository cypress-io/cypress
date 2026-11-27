import { beforeEach, describe, expect, it } from 'vitest'

import { compareTreeOrder } from '../../../../src/dom/elements/shadow'

describe('dom/elements/shadow', () => {
  describe('compareTreeOrder', () => {
    let root: ShadowRoot
    let nestedRoot: ShadowRoot

    beforeEach(() => {
      document.body.innerHTML = `
        <button id="before"></button>
        <div id="host"><span id="light-child"></span></div>
        <button id="after"></button>
      `

      root = document.getElementById('host')!.attachShadow({ mode: 'open' })
      root.innerHTML = '<button id="inside"></button><div id="nested-host"></div><button id="inside-after"></button>'

      nestedRoot = root.getElementById('nested-host')!.attachShadow({ mode: 'open' })
      nestedRoot.innerHTML = '<button id="nested"></button>'
    })

    const byId = (id: string) => {
      return document.getElementById(id) ?? root.getElementById(id) ?? nestedRoot.getElementById(id)!
    }

    it('sorts nodes into document order, placing a shadow tree at its host', () => {
      const ids = ['after', 'nested', 'inside-after', 'light-child', 'inside', 'host', 'before', 'nested-host']
      const sorted = ids.map(byId).sort(compareTreeOrder).map((el) => el.id)

      expect(sorted).toEqual(['before', 'host', 'inside', 'nested-host', 'nested', 'inside-after', 'light-child', 'after'])
    })

    it('treats a node as equal to itself', () => {
      expect(compareTreeOrder(byId('nested'), byId('nested'))).toBe(0)
    })
  })
})
