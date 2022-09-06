import SpecsListHoverCell from './SpecsListHoverCell.vue'

const contentSelector = '[data-testid=content]'
const hoverSelector = '[data-testid=hover]'

describe('<SpecsListHoverCell/>', () => {
  it('should show hover when hover enabled', () => {
    cy.mount(() => (
      <SpecsListHoverCell
        isHoverDisabled={false}
        // @ts-ignore - doesn't know about vSlots
        vSlots={{
          content: () => <div data-testid="content">content</div>,
          hover: () => <div data-testid="hover">Hover</div>,
        }}
      />
    )).get(contentSelector)
    .should('be.visible')
    .get(hoverSelector)
    .should('not.exist')
    .log('hover content to show hover slot')
    .get(contentSelector)
    .trigger('mouseenter')
    .should('not.exist')
    .get(hoverSelector)
    .should('be.visible')
    .log('hover slot should stay visible if hovering the hover slot')
    .get(hoverSelector)
    .trigger('mouseenter')
    .should('be.visible')
    .get(contentSelector)
    .should('not.exist')
    .log('hover content will be removed from DOM if no longer hovering it or the content slot')
    .get(hoverSelector)
    .trigger('mouseleave')
    .should('not.exist')
    .get(contentSelector)
    .should('be.visible')
  })

  it('should not show hover when hover disabled', () => {
    cy.mount(() => (
      <SpecsListHoverCell
        isHoverDisabled={true}
        // @ts-ignore - doesn't know about vSlots
        vSlots={{
          content: () => <div data-testid="content">content</div>,
          hover: () => <div data-testid="hover">Hover</div>,
        }}
      />
    )).get(contentSelector)
    .should('be.visible')
    .get(hoverSelector)
    .should('not.exist')
    .get(contentSelector)
    .trigger('mouseenter')
    .should('exist')
    .get(hoverSelector)
    .should('not.exist')
  })
})
