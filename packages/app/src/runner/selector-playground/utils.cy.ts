import { useSelectorPlaygroundStore } from '../../store/selector-playground-store'
import { useStudioStore } from '../../store/studio-store'
import { getMethodPrefix, getMethodPrefixLength, SELECTOR_METHODS, closePlayground, openPlayground, togglePlayground } from './utils'
import type { AutIframe } from '../aut-iframe'

// Helper to create a mock jQuery-like object that matches the interface expected by closeStudioAssertionsMenu
const createMock$Body = () => {
  return {
    length: 1,
    get: (index: number) => index === 0 ? document.body : undefined,
  } as any
}

// Helper to create a mock AutIframe for testing
const createMockAutIframe = (options?: { withBody?: boolean }) => {
  const autIframe = {
    toggleSelectorPlayground: cy.stub(),
    toggleSelectorHighlight: cy.stub(),
  } as any

  if (options?.withBody) {
    autIframe._body = cy.stub().returns(createMock$Body())
  } else {
    autIframe._body = cy.stub()
  }

  return autIframe as unknown as AutIframe
}

describe('selector-playground/utils', () => {
  describe('SELECTOR_METHODS', () => {
    it('contains both get and contains methods', () => {
      expect(SELECTOR_METHODS).to.have.length(2)
      expect(SELECTOR_METHODS[0].value).to.eq('get')
      expect(SELECTOR_METHODS[0].display).to.eq('cy.get')
      expect(SELECTOR_METHODS[1].value).to.eq('contains')
      expect(SELECTOR_METHODS[1].display).to.eq('cy.contains')
    })
  })

  describe('getMethodPrefix', () => {
    it('returns correct prefix for get method', () => {
      expect(getMethodPrefix('get')).to.eq('cy.get(‘')
    })

    it('returns correct prefix for contains method', () => {
      expect(getMethodPrefix('contains')).to.eq('cy.contains(’')
    })
  })

  describe('getMethodPrefixLength', () => {
    it('returns correct length for get method', () => {
      // 'cy.get(‘' is 8 characters, +1 = 9
      expect(getMethodPrefixLength('get')).to.eq(9)
    })

    it('returns correct length for contains method', () => {
      // 'cy.contains(’' is 13 characters, +1 = 14
      expect(getMethodPrefixLength('contains')).to.eq(14)
    })

    it('uses getMethodPrefix internally', () => {
      // This test verifies the function uses getMethodPrefix correctly
      // The actual implementation should call getMethodPrefix and add 1

      expect(getMethodPrefixLength('get')).to.eq(getMethodPrefix('get').length + 1)
      expect(getMethodPrefixLength('contains')).to.eq(getMethodPrefix('contains').length + 1)
    })
  })

  describe('closePlayground', () => {
    it('closes playground and turns off all highlighting', () => {
      const selectorPlaygroundStore = useSelectorPlaygroundStore()
      const autIframe = createMockAutIframe()

      // Set initial state to open
      selectorPlaygroundStore.setShow(true)
      selectorPlaygroundStore.setEnabled(true)
      selectorPlaygroundStore.setShowingHighlight(true)

      closePlayground(autIframe)

      expect(selectorPlaygroundStore.show).to.be.false
      expect(selectorPlaygroundStore.isEnabled).to.be.false
      expect(selectorPlaygroundStore.isShowingHighlight).to.be.false
      expect(autIframe.toggleSelectorPlayground).to.have.been.calledWith(false)
      expect(autIframe.toggleSelectorHighlight).to.have.been.calledWith(false)
    })
  })

  describe('openPlayground', () => {
    it('opens playground and enables highlighting', () => {
      const selectorPlaygroundStore = useSelectorPlaygroundStore()
      const autIframe = createMockAutIframe({ withBody: true })

      // Set initial state to closed
      selectorPlaygroundStore.setShow(false)
      selectorPlaygroundStore.setEnabled(false)
      selectorPlaygroundStore.setShowingHighlight(false)

      openPlayground(autIframe)

      expect(selectorPlaygroundStore.show).to.be.true
      expect(selectorPlaygroundStore.isEnabled).to.be.true
      expect(selectorPlaygroundStore.isShowingHighlight).to.be.true
      expect(autIframe.toggleSelectorPlayground).to.have.been.calledWith(true)
      expect(autIframe.toggleSelectorHighlight).to.have.been.calledWith(true)
    })

    it('closes assertions menu when Studio is active', () => {
      const studioStore = useStudioStore()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()
      const autIframe = createMockAutIframe({ withBody: true })

      // Set Studio to active
      studioStore.setActive(true)
      selectorPlaygroundStore.setShow(false)

      openPlayground(autIframe)

      // Verify body was accessed (indicating we tried to close the menu)
      expect(autIframe._body).to.have.been.called
      expect(selectorPlaygroundStore.show).to.be.true
    })

    it('does not try to close assertions menu when Studio is not active', () => {
      const studioStore = useStudioStore()
      const selectorPlaygroundStore = useSelectorPlaygroundStore()
      const autIframe = createMockAutIframe()

      // Set Studio to inactive
      studioStore.setActive(false)
      selectorPlaygroundStore.setShow(false)

      openPlayground(autIframe)

      // Verify body was NOT accessed (since Studio is not active)
      expect(autIframe._body).not.to.have.been.called
      expect(selectorPlaygroundStore.show).to.be.true
    })
  })

  describe('togglePlayground', () => {
    it('closes playground when it is currently open', () => {
      const selectorPlaygroundStore = useSelectorPlaygroundStore()
      const autIframe = createMockAutIframe()

      // Set initial state to open
      selectorPlaygroundStore.setShow(true)
      selectorPlaygroundStore.setEnabled(true)

      togglePlayground(autIframe)

      expect(selectorPlaygroundStore.show).to.be.false
      expect(autIframe.toggleSelectorPlayground).to.have.been.calledWith(false)
    })

    it('opens playground when it is currently closed', () => {
      const selectorPlaygroundStore = useSelectorPlaygroundStore()
      const autIframe = createMockAutIframe()

      // Set initial state to closed
      selectorPlaygroundStore.setShow(false)
      selectorPlaygroundStore.setEnabled(false)

      togglePlayground(autIframe)

      expect(selectorPlaygroundStore.show).to.be.true
      expect(autIframe.toggleSelectorPlayground).to.have.been.calledWith(true)
    })
  })
})
