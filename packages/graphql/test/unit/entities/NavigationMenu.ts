import { expect } from 'chai'
import { NavigationMenu } from '../../../src'

describe('NavigationMenu', () => {
  describe('#setSelectedItem', () => {
    it('allows navigation forwards', () => {
      const nav = new NavigationMenu()

      expect(nav.selected).to.eq('projectSetup')

      nav.setSelectedItem('settings')
      expect(nav.selected).to.eq('settings')
    })
  })
})
