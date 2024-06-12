import SnapshotToggle from './SnapshotToggle.vue'

describe('<SnapshotToggle/>', () => {
  it('renders two segments', () => {
    const messages = [{ text: '1', id: '1' }, { text: '2', id: '2' }]

    cy.mount(() => (<SnapshotToggle class="m-20" messages={messages} />))

    .get('body')
    .findByText('2')
    .click()
    .parent()
    .findByText('1')
    .click()
  })

  it('renders longer text', () => {
    const messages = [{ text: 'Request', id: '1' }, { text: 'Response', id: '2' }]

    cy.mount(() => (<SnapshotToggle class="m-20" messages={messages} />))

    .get('body')
    .findByText('Request')
    .click()
    .parent()
    .findByText('Response')
    .click()
  })

  it('emits a select event with the active message', () => {
    const messages = [{ text: 'Request', id: '1' }, { text: 'Response', id: '2' }]

    const onSelectSpy = cy.spy().as('onSelect')

    cy.mount(() => (<SnapshotToggle class="m-20" onSelect={onSelectSpy} messages={messages} />))

    cy.get('body')
    .findByText('Request')
    .click()
    .get('@onSelect')
    .should('have.been.calledWith', { message: messages[0], idx: 0 })
    .get('body')
    .findByText('Response')
    .click()
    .get('@onSelect')
    .should('have.been.calledWith', { message: messages[1], idx: 1 })
  })
})
