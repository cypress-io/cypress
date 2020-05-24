// compare to Skeleton.story.js
/// <reference types="cypress" />
import React from 'react'
import { mount } from 'cypress-react-unit-test'

import SideBySide from './SideBySide'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'

const Box = ({ children }) => (
  <a
    style={{
      border: '1px solid #ccc',
      display: 'block',
      fontSize: 16,
      lineHeight: 2,
      padding: 20,
      marginBottom: 10,
      width: 100,
    }}
  >
    {children}
  </a>
)

describe('Skeleton', () => {
  it('with wrapper', () =>
    mount(
      <SideBySide>
        <Skeleton count={5} wrapper={Box} />
        <div>
          <Box key={1}>A</Box>
          <Box key={2}>B</Box>
          <Box key={3}>C</Box>
          <Box key={4}>D</Box>
        </div>
      </SideBySide>,
    ))

  it('with wrapper and theme', () =>
    mount(
      <SideBySide>
        <SkeletonTheme color="#333" highlightColor="#666">
          <Skeleton count={5} wrapper={Box} />
        </SkeletonTheme>
        <div>
          <Box key={1}>A</Box>
          <Box key={2}>B</Box>
        </div>
      </SideBySide>,
    ))

  it('with dynamic theme', () => {
    const Dynamic = () => {
      const [theme, setTheme] = React.useState('light')
      const skeletonColor =
        theme === 'light' ? 'rgba(0, 0, 0, .1)' : 'rgba(255, 255, 255, .1)'
      const skeletonHighlight =
        theme === 'light' ? 'rgba(0, 0, 0, .2)' : 'rgba(255,255,255, .2)'

      const handleToggle = () => {
        setTheme(oldTheme => (oldTheme === 'light' ? 'dark' : 'light'))
      }

      const backgroundColor = theme === 'light' ? 'white' : '#222'

      return (
        <div style={{ backgroundColor }}>
          <button onClick={handleToggle}>Toggle Theme</button>
          <SideBySide>
            <SkeletonTheme
              color={skeletonColor}
              highlightColor={skeletonHighlight}
            >
              <Skeleton count={5} wrapper={Box} />
            </SkeletonTheme>
            <div>
              <Box key={1}>A</Box>
              <Box key={2}>B</Box>
            </div>
          </SideBySide>
        </div>
      )
    }

    mount(<Dynamic />)
    cy.contains('Toggle Theme')
      .click()
      .wait(500)
      .click()
      .wait(500)
      .click()
      .wait(500)
      .click()
      .wait(500)
      .click()
      .wait(500)
      .click()
  })

  it('with different durations', () => {
    const Test = () => (
      <div>
        <Skeleton count={1} duration={1} />
        <Skeleton count={1} duration={2} />
        <Skeleton count={1} duration={3} />
        <Skeleton count={1} duration={4} />
      </div>
    )
    mount(<Test />)
  })

  it('with different widths', () => {
    const Test = () => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Skeleton count={1} />
        <Skeleton count={1} width={50} />
        <Skeleton count={1} width={100} />
        <Skeleton count={1} width={200} />
        <Skeleton count={1} width="50em" />
      </div>
    )
    mount(<Test />)
  })

  it('with different heights', () => {
    const Test = () => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Skeleton count={1} />
        <Skeleton count={1} height={200} />
        <Skeleton count={1} height={400} />
        <Skeleton count={1} height={600} />
        <Skeleton count={1} height="50em" />
      </div>
    )
    mount(<Test />)
  })

  it('Skeleton displayed as circle', () => {
    const Test = () => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Skeleton count={1} height={50} width={50} circle={true} />
      </div>
    )
    mount(<Test />)
  })
})
