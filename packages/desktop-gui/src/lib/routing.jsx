import React from 'react'

import viewStore from './view-store'

const Link = ({ children, to }) => {
  const navigate = (e) => {
    e.preventDefault()
    to.navigate()
  }

  return (
    <a href='#' onClick={navigate} className={to.isActive() ? 'active' : ''}>
      {children}
    </a>
  )
}

const routes = {
  intro: () => ({
    navigate: viewStore.showIntro.bind(viewStore),
    isActive: () => false,
  }),

  specs: (project) => ({
    navigate: viewStore.showProjectSpecs.bind(viewStore, project),
    isActive: viewStore.isProjectSpecs,
  }),

  runs: (project) => ({
    navigate: viewStore.showProjectRuns.bind(viewStore, project),
    isActive: viewStore.isProjectRuns,
  }),

  config: (project) => ({
    navigate: viewStore.showProjectConfig.bind(viewStore, project),
    isActive: viewStore.isProjectConfig,
  }),
}

export default {
  Link,
  routes,
}
