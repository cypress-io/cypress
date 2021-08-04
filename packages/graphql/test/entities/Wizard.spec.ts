import { expect } from 'chai'
import { Wizard, WIZARD_STEP } from '../../src'

describe('Wizard', () => {
  describe('#navigate', () => {
    it('allows navigation forwards', () => {
      const wizard = new Wizard()

      wizard.navigate('forward')
      expect(wizard.step).to.eq('selectFramework')
    })

    it('allows navigation backward', () => {
      const wizard = new Wizard()

      expect(wizard.step).to.eq('welcome')
      wizard.navigate('forward')
      wizard.navigate('back')
      expect(wizard.step).to.eq('welcome')
    })

    it('disallows navigation backwards when on first step', () => {
      const wizard = new Wizard()

      expect(wizard.step).to.eq('welcome')
      wizard.navigate('back')
      expect(wizard.step).to.eq('welcome')
    })

    it('disallows navigation forward when on first step', () => {
      const wizard = new Wizard()

      // navigate to last step
      WIZARD_STEP.forEach(() => {
        wizard.navigate('forward')
      })

      expect(wizard.step).to.eq(WIZARD_STEP[WIZARD_STEP.length - 1])

      // navigate some more, should be the same step
      wizard.navigate('forward')
      expect(wizard.step).to.eq(WIZARD_STEP[WIZARD_STEP.length - 1])
    })
  })
})
