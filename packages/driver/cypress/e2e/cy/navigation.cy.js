import { $Location } from '../../../src/cypress/location'
import $SetterGetter from '../../../src/cypress/setter_getter'
import { bothUrlsMatchAndOneHasHash, historyNavigationTriggeredHashChange } from '../../../src/cy/navigation'

describe('cy/navigation', () => {
  describe('.bothUrlsMatchAndOneHasHash', () => {
    describe('matches remote url', () => {
      it('when remote url has hash', () => {
        const current = $Location.create('https://my_url.com')
        const remote = $Location.create('https://my_url.com#hash')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote)

        expect(isMatch).to.be.true
      })
    })

    describe('does not match remote url', () => {
      it('when only current url has hash', () => {
        const current = $Location.create('https://my_url.com#hash')
        const remote = $Location.create('https://my_url.com')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote)

        expect(isMatch).to.be.false
      })

      it('when remote url is missing hash', () => {
        const current = $Location.create('https://my_url.com')
        const remote = $Location.create('https://my_url.com')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote)

        expect(isMatch).to.be.false
      })

      it('when origins are different', () => {
        const current = $Location.create('https://my_url.com')
        const remote = $Location.create('https://my_other_url.com#hash')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote)

        expect(isMatch).to.be.false
      })

      it('when pathnames are different', () => {
        const current = $Location.create('https://my_url.com/home')
        const remote = $Location.create('https://my_url.com/random_page#hash')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote)

        expect(isMatch).to.be.false
      })

      it('when search is different', () => {
        const current = $Location.create('https://my_url.com/home?user=1')
        const remote = $Location.create('https://my_url.com/home#hash?user=1')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote)

        expect(isMatch).to.be.false
      })
    })

    describe('matches least one url', () => {
      it('when current url has hash', () => {
        const current = $Location.create('https://my_url.com#title')
        const remote = $Location.create('https://my_url.com')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote, true)

        expect(isMatch).to.be.true
      })

      it('when remote url has hash', () => {
        const current = $Location.create('https://my_url.com')
        const remote = $Location.create('https://my_url.com#title')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote, true)

        expect(isMatch).to.be.true
      })

      it('when both urls have a hash', () => {
        const current = $Location.create('https://my_url.com#home')
        const remote = $Location.create('https://my_url.com#title')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote, true)

        expect(isMatch).to.be.true
      })
    })

    describe('does not match either url', () => {
      it('when neither url has hash', () => {
        const current = $Location.create('https://my_url.com')
        const remote = $Location.create('https://my_url.com')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote, true)

        expect(isMatch).to.be.false
      })

      it('when origins are different', () => {
        const current = $Location.create('https://my_url.com')
        const remote = $Location.create('https://my_other_url.com#hash')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote, true)

        expect(isMatch).to.be.false
      })

      it('when pathnames are different', () => {
        const current = $Location.create('https://my_url.com/home')
        const remote = $Location.create('https://my_url.com/random_page#hash')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote, true)

        expect(isMatch).to.be.false
      })

      it('when search is different', () => {
        const current = $Location.create('https://my_url.com/home?user=1')
        const remote = $Location.create('https://my_url.com/home#hash?user=1')
        const isMatch = bothUrlsMatchAndOneHasHash(current, remote, true)

        expect(isMatch).to.be.false
      })
    })
  })

  describe('.historyNavigationTriggeredHashChange', () => {
    it('when no navHistoryDelta in state', () => {
      const state = $SetterGetter.create({ })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.false
    })

    it('when navHistoryDelta is 0', () => {
      const state = $SetterGetter.create({
        navHistoryDelta: 0,
      })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.false
    })

    it('when navHistoryDelta is null', () => {
      const state = $SetterGetter.create({
        navHistoryDelta: null,
      })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.false
    })

    it('when no urls or urlPosition in state', () => {
      const state = $SetterGetter.create({
        navHistoryDelta: 1,
      })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.false
    })

    it('when no urlPosition in state', () => {
      const state = $SetterGetter.create({
        navHistoryDelta: 1,
        url: 'https://my_url.com/',
        urls: ['https://my_url.com/', 'https://my_url.com/home'],
      })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.false
    })

    it('when neither url has a hash', () => {
      const state = $SetterGetter.create({
        navHistoryDelta: 1,
        urlPosition: 0,
        url: 'https://my_url.com/',
        urls: ['https://my_url.com/', 'https://my_url.com/home'],
      })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.false
    })

    it('when one url has a hash and navigation moves forward in history', () => {
      const state = $SetterGetter.create({
        navHistoryDelta: 1,
        urlPosition: 0,
        url: 'https://my_url.com/home',
        urls: ['https://my_url.com/home', 'https://my_url.com/home#hash'],
      })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.true
      expect(state('navHistoryDelta')).to.eq(1)
    })

    it('when one url has a hash and navigation moves back in history', () => {
      const state = $SetterGetter.create({
        navHistoryDelta: -1,
        urlPosition: 1,
        url: 'https://my_url.com/home#hash',
        urls: ['https://my_url.com/home', 'https://my_url.com/home#hash'],
      })

      const triggeredHashChange = historyNavigationTriggeredHashChange(state)

      expect(triggeredHashChange).to.be.true
      expect(state('navHistoryDelta')).to.eq(-1)
    })
  })
})
