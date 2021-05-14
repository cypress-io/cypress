import { mount } from '@cypress/vue'
import CalcButton from './Button.vue'

describe('<CalcButton />', () => {
  it('should look like a button', () => {
    mount(() => <CalcButton value="5" />)
    cy.screenshot()
  })

  it('should be orange when operator variant', () => {
    mount(() => <CalcButton variant="operator" value="+" />)
    cy.screenshot()
  })

  it('should be darkened when dark variant', () => {
    mount(() => <CalcButton variant="dark" value="AC" />)
    cy.screenshot()
  })

  it('should be wider when wide variant', () => {
    mount(CalcButton, {
      props: {
        value: '0',
        variant: 'wide',
      },
      data () {
        return {
          test: 7,
        }
      },
    })

    cy.screenshot()
  })

  it('should emit a click when clicking on the button', () => {
    const stub = cy.stub().as('onClick')

    // @ts-ignore JSX is being mean when using vetur
    mount(() => <CalcButton onClick={stub} value="5" />).then(() =>
      cy
      .get('button')
      .click()
      .then(() => {
        expect(stub).to.have.been.called
      }))
  })
})
