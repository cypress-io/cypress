import * as React from 'react'

const LazyDog = React.lazy(() => import(/* webpackChunkName: "Dog" */ './Dog'))
interface LazyComponentProps {}

export const LazyComponent: React.FC<LazyComponentProps> = ({}) => {
  return (
    <div>
      Loading a dog:
      <React.Suspense fallback={'loading...'}>
        <LazyDog />
      </React.Suspense>
    </div>
  )
}
