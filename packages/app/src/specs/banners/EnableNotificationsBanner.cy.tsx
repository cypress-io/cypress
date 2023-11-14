import { EnableNotificationsBanner_SetPreferencesDocument, EnableNotificationsBanner_ShowNotificationDocument } from '../../generated/graphql-test'
import EnableNotificationsBanner from './EnableNotificationsBanner.vue'
import { dayjs } from '../../runs/utils/day.js'

describe('EnableNotificationsBanner', () => {
  context('render', () => {
    [1200, 800].forEach((viewportWidth) => {
      it(`renders at ${viewportWidth}px width`, { viewportWidth }, () => {
        cy.mount(<EnableNotificationsBanner />)
        cy.percySnapshot()
      })
    })
  })

  context('actions', () => {
    it('calls mutations to enable notifications', (done) => {
      cy.stubMutationResolver(EnableNotificationsBanner_SetPreferencesDocument, (defineResult, variables) => {
        expect(variables.value).to.eq('{"desktopNotificationsEnabled":true}')
      })

      cy.stubMutationResolver(EnableNotificationsBanner_ShowNotificationDocument, (defineResult, variables) => {
        expect(variables.title).to.eq('Notifications Enabled')
        expect(variables.body).to.eq('Nice, notifications are enabled!')
        done()
      })

      cy.mount(<EnableNotificationsBanner />)

      cy.contains('button', 'Enable desktop notifications').click()
    })

    it('calls mutations to remind me later', (done) => {
      cy.stubMutationResolver(EnableNotificationsBanner_SetPreferencesDocument, (defineResult, variables) => {
        const in3Days = dayjs().add(dayjs.duration({ days: 3 }))

        const parsed = JSON.parse(variables.value)

        // To make this test stable, ensure that the timestamp that we write has a date that is 3 days out
        expect(dayjs(parsed.dismissNotificationBannerUntil).day()).to.eq(in3Days.day())

        done()
      })

      cy.mount(<EnableNotificationsBanner />)

      cy.contains('button', 'Remind me later').click()
    })

    it('calls mutations to dismiss banner', (done) => {
      cy.stubMutationResolver(EnableNotificationsBanner_SetPreferencesDocument, (defineResult, variables) => {
        expect(variables.value).to.eq('{"desktopNotificationsEnabled":false}')
        done()
      })

      cy.mount(<EnableNotificationsBanner />)

      cy.findByRole('button', { name: 'Dismiss banner' }).click()
    })
  })
})
