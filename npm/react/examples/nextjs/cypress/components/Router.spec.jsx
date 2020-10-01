// @ts-check
/// <reference types="cypress" />
import * as React from 'react'
import RouterPage from '../../pages/router'
import { createRouter } from 'next/router'
import { RouterContext } from 'next/dist/next-server/lib/router-context'
import { mount } from 'cypress-react-unit-test'

describe('Component with router usage', () => {
  it('renders the component that uses next.js router context', () => {
    const router = {
      pathname: '/testPath',
      route: '/testPath',
      query: {},
      asPath: '/testPath',
      components: {},
      isFallback: false,
      basePath: '',
      events: { emit: cy.spy(), off: cy.spy(), on: cy.spy() },
      push: cy.spy(),
      replace: cy.spy(),
      reload: cy.spy(),
      back: cy.spy(),
      prefetch: cy.spy(),
      beforePopState: cy.spy(),
    }

    mount(
      <RouterContext.Provider value={router}>
        <RouterPage />
      </RouterContext.Provider>,
    )

    cy.contains('Next.js route /testPath')
  })

  it('renders the component that uses next.js with parsed query', () => {
    // alternatively you can use next's internal `createRouter` function to create a real instance of NextRouter
    const router = createRouter(
      '/testPath',
      { param1: 'param1' },
      '/asTestPath',
      {
        subscription: cy.spy(),
        initialProps: {},
        App: cy.spy(),
        Component: cy.spy(),
        pageLoader: cy.spy(),
        initialStyleSheets: [],
        wrapApp: cy.spy(),
        isFallback: false,
      },
    )

    mount(
      <RouterContext.Provider value={router}>
        <RouterPage />
      </RouterContext.Provider>,
    )

    cy.contains('My query: {"param1":"param1"}')
  })

  it('pushes the new route', () => {
    const router = {
      pathname: '/router',
      route: '/router',
      query: {},
      asPath: '/router',
      components: {},
      isFallback: false,
      basePath: '',
      events: { emit: cy.spy(), off: cy.spy(), on: cy.spy() },
      push: cy.spy(),
      replace: cy.spy(),
      reload: cy.spy(),
      back: cy.spy(),
      prefetch: cy.spy(),
      beforePopState: cy.spy(),
    }

    mount(
      <RouterContext.Provider value={router}>
        <RouterPage />
      </RouterContext.Provider>,
    )

    cy.get('button')
      .click()
      .then(() => {
        // Make sure that `.then` here is required to make an assertion after component mount and retrying button
        expect(router.push).to.be.called
      })
  })
})
