import { useI18n, defaultMessages } from '@cy/i18n'
import ja from './ja.json?raw'
const jaMessages = JSON.parse(ja)

describe('i18n', () => {
  it('renders different locales when changed', () => {
    let i18n

    cy.mount({
      render: () => (<div>{i18n.t('sideBar.settings')}</div>),
      setup () {
        i18n = useI18n()
        i18n.locale.value = 'en-US'

        return {
          i18n,
        }
      },
    })
    .get('body')
    .findByText(defaultMessages.sideBar.settings)
    .then(() => {
      const locale = i18n?.locale

      locale.value = 'ja'
    })
    .get('body')
    .findByText(jaMessages.sideBar.settings)
  })
})
