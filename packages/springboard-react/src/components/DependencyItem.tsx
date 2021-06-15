import gql from 'graphql-tag'
import * as React from 'react'

interface DependencyItemProps {
  dependency: {
    packageName: string
    description: string
  }
}

export const DependencyItemFragment = gql`
  fragment DependencyItem on WizardDependency {
    packageName
    description
  }
`

export const DependencyItem: React.FC<DependencyItemProps> = (props) => {
  return (
    <li data-cy="dep" className="bg-blue-50 p-4">
      <p className="flex justify-between pb-2">
        <div className="text-md font-bold">{props.dependency.packageName}</div>
        <a className="underline text-blue-800 text-sm">Learn more</a>
      </p>
      <p className="text-md">{props.dependency.description}</p>
    </li>
  )
}
