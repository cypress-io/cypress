import React from 'react'

import viewStore from './view-store'

const Link = ({ children, to, onClick }) => {
  const navigate = (e) => {
    e.preventDefault()
    if (onClick) onClick()

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

  settings: (project) => ({
    navigate: viewStore.showProjectSettings.bind(viewStore, project),
    isActive: viewStore.isProjectSettings,
  }),
}

export {
  Link,
  routes,
}
