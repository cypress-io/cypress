import { defaultMessages } from '@cy/i18n'
import { h } from 'vue'

// Subject Under Test
import Select from './Select.vue'
import IconHeart from '~icons/mdi/heart'

const selectText = defaultMessages.components.select

// Selectors
const optionsSelector = '[role=option]'
const inputSelector = '[aria-haspopup=true]'
const caretIconSelector = '[data-testid=icon-caret]'
const checkIconSelector = '[data-testid=icon-check]'

// Helpers
const openSelect = () => cy.get(inputSelector).click()
const selectFirstOption = () => cy.get(optionsSelector).first().click().get(optionsSelector).first()

// Fixtures
const defaultOptions = [
  { value: 'Blue', key: 'blue' },
  { value: 'Orange', key: 'orange' },
  { value: 'Fuchsia', key: 'fuchsia' },
]

// Mount wrapper to setup the component with default options
// and some root styles

const mountSelect = (props: any = {}) => {
  // v-model setup
  let value = defaultOptions[0]

  // The width and padding need to be here so that
  // a click on the body dismisses the options
  return cy.mount(() => (
    <div class="p-12 w-[300px]">
      <label id="mock-label">Mock Label</label>
      <Select
        options={defaultOptions}
        modelValue={value}
        labelId="mock-label"
        {...props}
        v-slots={props.vSlots}
      />
    </div>
  ))
}

describe('<Select />', () => {
  /**
     * Using the Select Component within a template:
     *
     * <Select v-model="value" :options="options">
     *  <template #item-body="{ value, open, selected }">
     *    {{ value }} {{ selected ? 'is selected' : '' }}
     *  </template>
     * </Select>
     */

  it('renders a list of options', () => {
    mountSelect().then(openSelect).get(optionsSelector).should('be.visible')
    cy.percySnapshot()
  })

  it('can open and choose an option', () => {
    mountSelect().then(openSelect)
    .then(selectFirstOption)
    .then(($selectedOption) => {
      cy.get(inputSelector).should('have.text', $selectedOption.text())
    }).get(optionsSelector).should('not.exist')

    cy.percySnapshot()
  })

  it('closes when clicking off of the options when open', () => {
    mountSelect().then(openSelect)
    .get(optionsSelector)
    .should('be.visible')
    .get('html').click(0, 0)
    .get(optionsSelector).should('not.exist')
  })

  describe('#items', () => {
    it('uses item keys and values for what to render', () => {
      // Used for testing that "item-value" supports nested accessors
      // e.g. 'profile.firstName'
      const nestedOptions = [
        { profile: { firstName: 'Lachlan' }, id: 'ewiofjdew' },
        { profile: { firstName: 'Jess' }, id: '1i24u' },
        { profile: { firstName: 'Bart' }, id: 'ewopf' },
      ]

      mountSelect({
        options: nestedOptions,
        modelValue: nestedOptions[0],
        itemKey: 'id',
        itemValue: 'profile.firstName',
      }).then(openSelect)
      .get(optionsSelector).first()
      .should('have.text', nestedOptions[0].profile.firstName)
    })
  })

  describe('#icons', () => {
    it('marks the selected item with a check by default', () => {
      mountSelect().then(openSelect)
      .then(selectFirstOption)
      .then(openSelect)
      .get(optionsSelector).first()
      .find(checkIconSelector).should('be.visible')
      .percySnapshot('Selected has check icon')
    })

    it('marks the selected item with custom itemKey', () => {
      const nestedOptions = [
        { profile: { firstName: 'Lachlan' }, id: 'ewiofjdew' },
        { profile: { firstName: 'Jess' }, id: '1i24u' },
        { profile: { firstName: 'Bart' }, id: 'ewopf' },
      ]

      mountSelect({
        options: nestedOptions,
        // To break strict equality
        modelValue: { ...nestedOptions[0] },
        itemKey: 'id',
        itemValue: 'profile.firstName',
      }).then(openSelect)
      .then(selectFirstOption)
      .then(openSelect)
      .get(optionsSelector).first()
      .find(checkIconSelector).should('be.visible')
    })

    it('renders a caret by default', () => {
      mountSelect().get(caretIconSelector).should('be.visible')
    })
  })

  describe('#placeholder', () => {
    it('default placeholder when theres no value selected', () => {
      mountSelect({ modelValue: undefined })
      .get(inputSelector)
      .should('contain.text', selectText.placeholder)
    })

    it('custom placeholder when theres no value selected', () => {
      mountSelect({
        placeholder: 'My placeholder',
        modelValue: undefined,
      }).get(inputSelector).should('contain.text', 'My placeholder')
    })

    it('does not render the placeholder after selecting an option', () => {
      // The width and padding need to be here so that
      // a click on the body dismisses the options
      cy.mount({
        components: { Select },
        data () {
          return {
            model: undefined,
          }
        },
        render () {
          return h(Select, {
            modelValue: this.model,
            'onUpdate:modelValue': (value: any) => this.model = value,
            options: defaultOptions,
            placeholder: 'A placeholder',
            label: 'Pick a color',
            'label-id': 'label',
          })
        },
      }).then(() => {
        cy.get(inputSelector)
        .should('contain.text', 'A placeholder')
        .then(openSelect)
        .then(selectFirstOption)

        cy.get(inputSelector)
        .should('not.contain.text', 'A placeholder')
      })
    })

    it('does not render the placeholder when there is a value selected', () => {
      mountSelect({
        placeholder: 'A placeholder',
        modelValue: defaultOptions[0],
      }).get(inputSelector).should('not.contain.text', 'A placeholder')
    })
  })

  describe('#slots', () => {
    it('renders all of the slots', () => {
      const vSlots = {
        'item-body': () => 'Item Body',
        'item-prefix': () => <IconHeart data-testid="item-prefix"></IconHeart>,
        'item-suffix': () => <IconHeart data-testid="item-suffix"></IconHeart>,
        'selected': () => 'Selected',
        'input-prefix': () => <IconHeart data-testid="input-prefix"></IconHeart>,
        'input-suffix': () => <IconHeart data-testid="input-suffix">suffix</IconHeart>,
        'footer': () => <div>This is the footer</div>,
      }

      mountSelect({ vSlots })

      // The input and tis prefixes and suffixes should be visible
      cy.findByText('Selected').should('be.visible')
      .get(`[data-testid=input-prefix]`).should('be.visible')
      .get(`[data-testid=input-suffix]`).should('be.visible')

      // The caret icon shouldn't exist because we overwrote it
      .get(caretIconSelector).should('not.exist')

      // Open the select
      .then(openSelect)

      // The options and their prefixes + suffixes should be visible
      .get(optionsSelector).should('be.visible')
      .get(`[data-testid=item-prefix]`).should('be.visible')
      .get(`[data-testid=item-suffix]`).should('be.visible')
      .percySnapshot()

      // Choose an option
      .then(selectFirstOption)

      cy.contains('This is the footer').should('be.visible')

      // The options list should be closed
      cy.get(optionsSelector).should('not.exist')
      .get(inputSelector).should('have.text', 'Selected')
      .then(openSelect)

      // The check mark shouldn't exist because we overwrote it
      .get(checkIconSelector).should('not.exist')
    })
  })
})
