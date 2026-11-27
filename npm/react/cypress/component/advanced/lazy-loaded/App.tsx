import React, { Suspense } from 'react'

const OtherComponent = React.lazy(() => import('./OtherComponent'))

export default function App () {
  return (
    <div className="app">
      <Suspense fallback={null}>
        <OtherComponent />
      </Suspense>
    </div>
  )
}
