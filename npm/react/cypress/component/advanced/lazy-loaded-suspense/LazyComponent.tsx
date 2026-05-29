import * as React from 'react'

const LazyDog = React.lazy(async () => {
  const comp = await import('./Dog')

  await new Promise<void>((resolve) => setTimeout(resolve, 10))

  return comp
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
