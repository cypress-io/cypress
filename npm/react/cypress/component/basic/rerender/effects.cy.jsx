/// <reference types="cypress" />
import React, { useLayoutEffect, useEffect } from 'react'
import ReactDom from 'react-dom'
import { mount, getContainerEl } from '@cypress/react'

it('should not run unmount effect cleanup when rerendering', () => {
  const layoutEffectCleanup = cy.stub()
  const effectCleanup = cy.stub()

  const Component = ({ input }) => {
    useLayoutEffect(() => {
      return layoutEffectCleanup
    }, [input])

    useEffect(() => {
      return effectCleanup
    }, [])

    return <div>{input}</div>
  }

  mount(<Component input="0" />).then(({ rerender }) => {
    expect(layoutEffectCleanup).to.have.been.callCount(0)
    expect(effectCleanup).to.have.been.callCount(0)

    rerender(<Component input="0" />).then(() => {
      expect(layoutEffectCleanup).to.have.been.callCount(0)
      expect(effectCleanup).to.have.been.callCount(0)
    })

    rerender(<Component input="1" />).then(() => {
      expect(layoutEffectCleanup).to.have.been.callCount(1)
      expect(effectCleanup).to.have.been.callCount(0)
    })
  })
})

it('should run unmount effect cleanup when unmounting', () => {
  const layoutEffectCleanup = cy.stub()
  const effectCleanup = cy.stub()

  const Component = ({ input }) => {
    useLayoutEffect(() => {
      return layoutEffectCleanup
    }, [])

    useEffect(() => {
      return effectCleanup
    }, [])

    return <div>{input}</div>
  }

  mount(<Component input="0" />).then(({ rerender }) => {
    expect(layoutEffectCleanup).to.have.been.callCount(0)
    expect(effectCleanup).to.have.been.callCount(0)

    rerender(<Component input="1" />).then(() => {
      expect(layoutEffectCleanup).to.have.been.callCount(0)
      expect(effectCleanup).to.have.been.callCount(0)
    })

    cy
    .then(() => ReactDom.unmountComponentAtNode(getContainerEl()))
    .then(() => {
      expect(layoutEffectCleanup).to.have.been.callCount(1)
      expect(effectCleanup).to.have.been.callCount(1)
    })
  })
})
