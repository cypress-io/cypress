import _ from 'lodash'
import React from 'react'
import { shallow } from 'enzyme'
import sinon from 'sinon'

import NoAutomation from './no-automation'

const noBrowsers = []
const browsersWithChosen = [
  { name: 'canary', displayName: 'Canary', version: '52.7', majorVersion: 52 },
  { name: 'chrome', displayName: 'Chrome', version: '52.2', majorVersion: 52, default: true },
  { name: 'chromium', displayName: 'Chromium', version: '53.2', majorVersion: 53 },
]
const browsersWithoutChosen = [
  { name: 'canary', displayName: 'Canary', version: '52.7', majorVersion: 52 },
  { name: 'chrome', displayName: 'Chrome', version: '52.2', majorVersion: 52 },
  { name: 'chromium', displayName: 'Chromium', version: '53.2', majorVersion: 53 },
]

describe('<NoAutomation />', () => {
  it('renders the message', () => {
    const component = shallow(<NoAutomation browsers={noBrowsers} />)

    expect(component.find('p').first()).to.have.text('Whoops, we can\'t run your tests.')
  })

  describe('when there are supported browsers', () => {
    it('renders <Dropdown /> with chosen browser', () => {
      const component = shallow(<NoAutomation browsers={browsersWithChosen} />)

      expect(component.find('Dropdown')).to.have.prop('chosen', browsersWithChosen[1])
    })

    it('renders <Dropdown /> with first browser as chosen when there is none chosen', () => {
      const component = shallow(<NoAutomation browsers={browsersWithoutChosen} />)

      expect(component.find('Dropdown')).to.have.prop('chosen', browsersWithoutChosen[0])
    })

    it('renders <Dropdown /> with other browsers, keys included', () => {
      const component = shallow(<NoAutomation browsers={browsersWithChosen} />)

      expect(component.find('Dropdown').prop('others')[0]).to.eql(_.extend({}, browsersWithChosen[0], { key: 'canary52.7' }))
      expect(component.find('Dropdown').prop('others')[1]).to.eql(_.extend({}, browsersWithChosen[2], { key: 'chromium53.2' }))
    })

    it('renders browser in <Dropdown /> with icon based on browser displayName', () => {
      const component = shallow(<NoAutomation browsers={browsersWithChosen} />)
      const browser = shallow(component.find('Dropdown').prop('renderItem')(browsersWithChosen[0]))

      expect(browser.find('BrowserIcon').prop('browserName')).to.equal('Canary')
    })

    it('renders browser in <Dropdown /> with browser name and version', () => {
      const component = shallow(<NoAutomation browsers={browsersWithChosen} />)
      const browser = shallow(component.find('Dropdown').prop('renderItem')(browsersWithChosen[2]))

      expect(browser.find('span').at(1)).to.have.text('Run Chromium 53')
    })

    it('calls onLaunchBrowser when browser is selected', () => {
      const onLaunchBrowser = sinon.spy()
      const component = shallow(<NoAutomation browsers={browsersWithChosen} onLaunchBrowser={onLaunchBrowser} />)

      component.find('Dropdown').prop('onSelect')('chrome')
      expect(onLaunchBrowser).to.have.been.calledWith('chrome')
    })
  })

  describe('when there are no supported browsers', () => {
    it('renders no supported browsers message', () => {
      const component = shallow(<NoAutomation browsers={noBrowsers} />)

      expect(component.find('p.muted')).to.have.text().match(/We couldn't find any supported browsers/)
    })

    it('renders a button to download Chrome', () => {
      const component = shallow(<NoAutomation browsers={noBrowsers} />)

      expect(component.find('a').at(0)).to.have.text('Download Chrome')
    })
  })
})
