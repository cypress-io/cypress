import React from 'react'

const OtherComponent = React.lazy(() => import('./OtherComponent'))

export default function App () {
  return (
    <div className="app">
      <React.Suspense fallback={'loading...'}>
        <OtherComponent />
      </React.Suspense>
    </div>
  )
}
