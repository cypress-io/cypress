import * as React from 'react'

const LazyDog = React.lazy(() => {
  return import(/* webpackChunkName: "Dog" */ './Dog')
  .then((comp) => new Promise((resolve) => setTimeout(() => resolve(comp), 10)))
})

interface LazyComponentProps {}

export const LazyComponent: React.FC<LazyComponentProps> = () => {
  return (
    <div>
      Loading a dog:
      <React.Suspense fallback={'loading...'}>
        <LazyDog />
      </React.Suspense>
    </div>
  )
}
