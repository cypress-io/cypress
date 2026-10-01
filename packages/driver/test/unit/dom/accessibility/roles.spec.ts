import { elementRoles } from 'aria-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AccessibilityCache } from '../../../../src/dom/accessibility/cache'
import {
  getAccessibleDescription,
  getAccessibleName,
  getNativeTagNames,
  getRoleSelector,
  getRoles,
  hasNativeRole,
  hasRole,
  isInaccessible,
  summarizeRoles,
} from '../../../../src/dom/accessibility/roles'

const render = (html: string) => {
  document.body.innerHTML = html
}

const $ = (selector: string) => document.querySelector(selector) as Element

describe('dom/accessibility/roles', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  describe('getRoles', () => {
    it.each([
      ['<button id="el"></button>', 'button'],
      ['<input id="el" type="submit">', 'button'],
      ['<input id="el" type="checkbox">', 'checkbox'],
      ['<input id="el">', 'textbox'],
      ['<input id="el" type="text">', 'textbox'],
      ['<input id="el" type="not-a-type">', 'textbox'],
      ['<input id="el" type="search">', 'searchbox'],
      ['<input id="el" type="email" list="options">', 'combobox'],
      ['<a id="el" href="/">x</a>', 'link'],
      ['<a id="el">x</a>', 'generic'],
      ['<h2 id="el">x</h2>', 'heading'],
      ['<ul><li id="el">x</li></ul>', 'listitem'],
      ['<img id="el" alt="x">', 'img'],
      ['<img id="el" alt="">', 'presentation'],
      ['<select id="el"></select>', 'combobox'],
      ['<select id="el" multiple></select>', 'listbox'],
      ['<select id="el" size="1"></select>', 'combobox'],
      ['<select id="el" size="abc"></select>', 'combobox'],
      ['<select id="el" size="4"></select>', 'listbox'],
      ['<select id="el" size="1" multiple></select>', 'listbox'],
      ['<nav id="el"></nav>', 'navigation'],
      ['<section id="el" aria-label="x"></section>', 'region'],
      ['<header id="el"></header>', 'banner'],
    ])('gives %s the implicit role %s', (html, role) => {
      render(html)

      expect(getRoles($('#el'))).toEqual([role])
    })

    it('uses only the first valid token of an explicit role', () => {
      render('<div id="el" role="switch checkbox"></div>')

      expect(getRoles($('#el'))).toEqual(['switch'])
      expect(hasRole($('#el'), 'checkbox')).toBe(false)
    })

    it.each([
      ['an unknown role', 'foo button', 'button'],
      ['an abstract role', 'widget button', 'button'],
      ['several invalid roles', 'foo widget doc-chapter', 'doc-chapter'],
    ])('skips %s before a valid one', (_name, role, expected) => {
      render(`<div id="el" role="${role}"></div>`)

      expect(getRoles($('#el'))).toEqual([expected])
    })

    it('keeps the implicit role when no token is a valid role', () => {
      render('<button id="el" role="foo widget"></button>')

      expect(getRoles($('#el'))).toEqual(['button'])
      expect(hasRole($('#el'), 'foo')).toBe(false)
    })

    it.each([
      ['empty', ''],
      ['blank', '   '],
    ])('keeps the implicit role when the role attribute is %s', (_name, role) => {
      render(`<button id="el" role="${role}"></button>`)

      expect(getRoles($('#el'))).toEqual(['button'])
    })

    it('ignores whitespace around the first token of an explicit role', () => {
      render('<div id="el" role="  switch checkbox"></div>')

      expect(getRoles($('#el'))).toEqual(['switch'])
    })

    it('prefers an explicit role over the implicit one', () => {
      render('<button id="el" role="tab"></button>')

      expect(hasRole($('#el'), 'tab')).toBe(true)
      expect(hasRole($('#el'), 'button')).toBe(false)
    })

    it('gives an element with no role mapping no roles', () => {
      render('<custom-widget id="el"></custom-widget>')

      expect(getRoles($('#el'))).toEqual([])
    })
  })

  describe('implicit role rules', () => {
    // roles.ts turns these constraints into selectors and property checks, so
    // a new one in an aria-query upgrade would otherwise be silently ignored.
    it('handles every attribute constraint aria-query uses', () => {
      const constraints = new Set<string>()

      for (const [entry] of elementRoles.entries()) {
        for (const attribute of entry.attributes ?? []) {
          for (const constraint of (attribute.constraints ?? []) as string[]) {
            constraints.add(constraint)
          }
        }
      }

      expect([...constraints].sort()).toEqual(['>1', 'set', 'undefined'])
    })

    it('does not give an element a role meant for another tag', () => {
      render('<div id="el" type="text" size="4"></div>')

      expect(getRoles($('#el'))).toEqual(['generic'])
    })
  })

  describe('getNativeTagNames', () => {
    it('lists the tags that can give an element the role', () => {
      expect(getNativeTagNames('button').sort()).toEqual(['button', 'input'])
      expect(getNativeTagNames('heading')).toEqual(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    })

    it('is empty for widget roles that HTML has no element for', () => {
      expect(getNativeTagNames('tab')).toEqual([])
      expect(getNativeTagNames('menuitem')).toEqual([])
    })
  })

  describe('hasNativeRole', () => {
    it.each([
      ['<button id="el"></button>', true],
      ['<input id="el" type="submit">', true],
      ['<button id="el" role="button"></button>', true],
      ['<div id="el" role="button"></div>', false],
      ['<a id="el" href="/" role="button">x</a>', false],
      ['<span id="el" role="button"></span>', false],
    ])('for %s is %s', (html, expected) => {
      render(html)

      expect(hasNativeRole($('#el'), 'button')).toBe(expected)
    })

    it('counts a native element whose implicit role is a different one it can have', () => {
      render('<table role="grid"><tr><td id="el" role="gridcell">x</td></tr></table><div id="div" role="gridcell">x</div>')

      expect(hasNativeRole($('#el'), 'gridcell')).toBe(true)
      expect(hasNativeRole($('#div'), 'gridcell')).toBe(false)
    })
  })

  describe('getRoleSelector', () => {
    it('matches explicit roles and every tag that can imply the role', () => {
      render(`
        <button id="a"></button>
        <input id="b" type="submit">
        <div id="c" role="button"></div>
        <div id="d"></div>
      `)

      const ids = Array.from(document.querySelectorAll(getRoleSelector('button')), (el) => el.id)

      expect(ids).toEqual(['a', 'b', 'c'])
    })

    it('escapes quotes and backslashes in the role', () => {
      render(`<div id="a" role='x"y'></div><div id="b" role="x\\y"></div><div id="c" role="x'y"></div>`)

      expect(document.querySelector(getRoleSelector('x"y'))?.id).toBe('a')
      expect(document.querySelector(getRoleSelector('x\\y'))?.id).toBe('b')
      expect(document.querySelector(getRoleSelector('x\'y'))?.id).toBe('c')
    })
  })

  describe('isInaccessible', () => {
    it.each([
      ['hidden', '<div hidden><button id="el"></button></div>'],
      ['aria-hidden', '<div aria-hidden="true"><button id="el"></button></div>'],
      ['display: none', '<div style="display: none"><button id="el"></button></div>'],
      ['visibility: hidden', '<button id="el" style="visibility: hidden"></button>'],
    ])('is true for an element hidden with %s', (_name, html) => {
      render(html)

      expect(isInaccessible($('#el'))).toBe(true)
    })

    it('is false for a visible element', () => {
      render('<div aria-hidden="false"><button id="el"></button></div>')

      expect(isInaccessible($('#el'))).toBe(false)
    })

    it('is true for an element inside the shadow tree of a hidden host', () => {
      render('<div id="host" aria-hidden="true"></div>')

      const shadowRoot = $('#host').attachShadow({ mode: 'open' })

      shadowRoot.innerHTML = '<button id="el"></button>'

      expect(isInaccessible(shadowRoot.querySelector('#el') as Element)).toBe(true)
    })

    it('reads each ancestor style once per cache', () => {
      render('<div><div><button id="a"></button><button id="b"></button></div></div>')

      const cache = new AccessibilityCache()
      const getComputedStyle = vi.spyOn(window, 'getComputedStyle')

      isInaccessible($('#a'), cache)
      isInaccessible($('#b'), cache)

      const readElements = getComputedStyle.mock.calls.map(([el]) => el)

      expect(new Set(readElements).size).toBe(readElements.length)

      getComputedStyle.mockRestore()
    })
  })

  describe('getAccessibleName', () => {
    it.each([
      ['content', '<button id="el">Save</button>', 'Save'],
      ['aria-label', '<button id="el" aria-label="Close">x</button>', 'Close'],
      ['aria-labelledby', '<span id="label">Search</span><input id="el" aria-labelledby="label">', 'Search'],
      ['a wrapping label', '<label>Email <input id="el"></label>', 'Email'],
      ['a label with for', '<label for="el">Password</label><input id="el" type="password">', 'Password'],
      ['alt text', '<img id="el" alt="Logo">', 'Logo'],
      ['title', '<button id="el" title="Help"></button>', 'Help'],
    ])('reads the name from %s', (_source, html, name) => {
      render(html)

      expect(getAccessibleName($('#el'))).toBe(name)
    })
  })

  describe('getAccessibleName with a hidden aria-labelledby target', () => {
    it('includes the hidden content of a target that is itself hidden', () => {
      render('<button id="el" aria-labelledby="label">x</button><span id="label" aria-hidden="true"><span style="display: none">Export</span></span>')

      expect(getAccessibleName($('#el'))).toBe('Export')
    })

    it('leaves out hidden content again in a nested reference to a visible node', () => {
      render('<button id="el" aria-labelledby="a">x</button><div id="a" hidden><span aria-labelledby="b">Inner</span></div><span id="b">Visible <span style="display: none">Secret</span></span>')

      expect(getAccessibleName($('#el'))).not.toContain('Secret')
    })

    it('leaves out the hidden content of a visible target', () => {
      render('<button id="el" aria-labelledby="label">x</button><span id="label">Shown <span style="display: none">Hidden</span></span>')

      expect(getAccessibleName($('#el'))).toBe('Shown')
    })
  })

  describe('getAccessibleDescription', () => {
    it('reads aria-describedby', () => {
      render('<button id="el" aria-describedby="desc">Delete</button><p id="desc">This cannot be undone</p>')

      expect(getAccessibleDescription($('#el'))).toBe('This cannot be undone')
    })
  })

  describe('summarizeRoles', () => {
    it('lists each accessible role with the names of its elements, leaving out generic', () => {
      render(`
        <main>
          <h1>Title</h1>
          <button>One</button>
          <button>Two</button>
          <button aria-hidden="true">Hidden</button>
          <a>generic</a>
        </main>
      `)

      expect(summarizeRoles([document.body])).toEqual([
        { role: 'main', names: [''] },
        { role: 'heading', names: ['Title'] },
        { role: 'button', names: ['One', 'Two'] },
      ])
    })

    it('includes inaccessible elements when hidden is true', () => {
      render('<div aria-hidden="true"><button>Hidden</button></div>')

      expect(summarizeRoles([document.body], { hidden: true })).toEqual([
        { role: 'button', names: ['Hidden'] },
      ])
    })

    it('looks inside shadow roots it is given', () => {
      render('<div id="host"></div>')

      const shadowRoot = $('#host').attachShadow({ mode: 'open' })

      shadowRoot.innerHTML = '<button>Inside</button>'

      expect(summarizeRoles([shadowRoot])).toEqual([
        { role: 'button', names: ['Inside'] },
      ])
    })

    it('leaves out the roots themselves, which a query never matches', () => {
      render('<nav aria-label="Main"><a href="/">Home</a></nav>')

      expect(summarizeRoles([$('nav')])).toEqual([
        { role: 'link', names: ['Home'] },
      ])
    })

    it('lists each element once when the roots are nested', () => {
      render('<div id="outer"><div id="inner"><button>Save</button></div></div>')

      expect(summarizeRoles([$('#outer'), $('#inner')])).toEqual([
        { role: 'button', names: ['Save'] },
      ])
    })
  })
})
