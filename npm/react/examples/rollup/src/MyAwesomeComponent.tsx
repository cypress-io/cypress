import * as React from 'react'

interface MyAwesomeComponentProps {}

export const MyAwesomeComponent: React.FC<MyAwesomeComponentProps> = ({}) => {
  return (
    <h1>
      My <strong> awesome </strong> component!
    </h1>
  )
}
