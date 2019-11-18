import _ from 'lodash'
import { shallow } from 'enzyme'
import React from 'react'

import Routes, { RoutesList, Route, RouteListModel } from './routes'
import RouteModel from './route-model'

const routeModel = (props?: Partial<RouteModel>) => {
  return _.extend<RouteModel>({
    id: _.uniqueId('r'),
    name: 'route',
    numResponses: 0,
    method: 'GET',
    isStubbed: false,
    url: '/posts$/',
    alias: 'getPosts',
  }, props)
}

const model = (props?: RouteListModel) => {
  return _.extend({
    routes: [routeModel(), routeModel()],
  }, props)
}

describe('<Routes />', () => {
  it('renders without no-routes class if there are routes', () => {
    const component = shallow(<Routes model={model()} />)

    expect(component).not.to.have.className('no-routes')
  })

  it('renders with no-routes class if there are no routes', () => {
    const component = shallow(<Routes model={model({ routes: [] })} />)

    expect(component).to.have.className('no-routes')
  })

  it('renders collapsible header with number of routes', () => {
    const component = shallow(<Routes model={model()} />)

    expect(component.find('Collapsible')).to.have.prop('header', 'Routes (2)')
  })

  it('renders tooltip around number of routes table head item', () => {
    const component = shallow(<Routes model={model()} />)

    expect(component.find('th').last().find('Tooltip')).to.have.prop('title', 'Number of responses which matched this route')
  })

  context('<RoutesList />', () => {
    it('is rendered', () => {
      const component = shallow(<Routes model={model()} />)

      expect(component.find(RoutesList).first()).to.exist
    })

    it('renders a <Route /> for each route in model', () => {
      const component = shallow(<RoutesList model={model()} />)

      expect(component.find(Route).length).to.equal(2)
    })
  })

  context('<Route />', () => {
    it('renders without no-responses class if numResponses is non-zero', () => {
      const component = shallow(<Route model={routeModel({ numResponses: 1 })} />)

      expect(component).not.to.have.className('no-responses')
    })

    it('renders with no-responses class if zero numResponses', () => {
      const component = shallow(<Route model={routeModel()} />)

      expect(component).to.have.className('no-responses')
    })

    it('renders the method', () => {
      const component = shallow(<Route model={routeModel()} />)

      expect(component.find('td').first()).to.have.text('GET')
    })

    it('renders the url', () => {
      const component = shallow(<Route model={routeModel()} />)

      expect(component.find('td').at(1)).to.have.text('/posts$/')
    })

    it('renders isStubbed as Yes if stubbed', () => {
      const component = shallow(<Route model={routeModel({ isStubbed: true })} />)

      expect(component.find('td').at(2)).to.have.text('Yes')
    })

    it('renders isStubbed as No if not stubbed', () => {
      const component = shallow(<Route model={routeModel({ isStubbed: false })} />)

      expect(component.find('td').at(2)).to.have.text('No')
    })

    it('renders the alias', () => {
      const component = shallow(<Route model={routeModel()} />)

      expect(component.find('.route-alias')).to.have.text('getPosts')
    })

    it('renders a Tooltip around the alias', () => {
      const component = shallow(<Route model={routeModel()} />)

      expect(component.find('.route-alias').parent()).to.have.prop('title', 'Aliased this route as: \'getPosts\'')
    })

    it('renders the numResponses if non-zero', () => {
      const component = shallow(<Route model={routeModel({ numResponses: 1 })} />)

      expect(component.find('.response-count')).to.have.text('1')
    })

    it('renders the numResponses as "-" if zero', () => {
      const component = shallow(<Route model={routeModel()} />)

      expect(component.find('.response-count')).to.have.text('-')
    })
  })
})
