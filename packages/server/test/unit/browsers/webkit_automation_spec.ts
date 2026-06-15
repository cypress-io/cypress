import '../../spec_helper'
import { expect } from 'chai'
import { resolveAutFrame } from '../../../lib/browsers/webkit-automation'

const makeFrame = (name: string, url: string) => {
  return {
    name: () => name,
    url: () => url,
    childFrames: () => [],
  }
}

const makePage = (frames: any[], childFrames: any[] = []) => {
  const mainFrame = {
    name: () => '',
    url: () => 'http://localhost:1234/__/',
    childFrames: () => childFrames,
  }

  return {
    frames: () => [mainFrame, ...frames],
    mainFrame: () => mainFrame,
  }
}

describe('lib/browsers/webkit-automation', () => {
  context('resolveAutFrame', () => {
    it('resolves the AUT frame by name even when it is on a different origin (cy.origin)', () => {
      // top frame is on localhost; AUT frame is cross-origin
      const autFrame = makeFrame(`Your project: 'my-app'`, 'https://example.com/login')
      const specBridge = makeFrame('Spec Bridge: https://example.com', 'https://example.com/__cypress/spec-bridge-iframes')
      const page = makePage([autFrame, specBridge])

      const resolved = resolveAutFrame(page as any)

      expect(resolved.url()).to.equal('https://example.com/login')
    })

    it('falls back to the first child frame of the top frame when the name is missing', () => {
      const autFrame = makeFrame('', 'https://example.com/')
      // no frame matches by name; AUT is the first child of the top frame
      const page = makePage([], [autFrame])

      const resolved = resolveAutFrame(page as any)

      expect(resolved.url()).to.equal('https://example.com/')
    })

    it('throws when no AUT frame can be found', () => {
      const page = makePage([])

      expect(() => resolveAutFrame(page as any)).to.throw('Could not find AUT frame')
    })
  })
})
