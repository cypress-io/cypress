import React from 'react'
import { DependencyItem, DependencyItemFragment } from './DependencyItem'
import { TerminalCommand } from './TerminalCommand'
import type { Dependency } from '../types/supportedFrameworks'
import gql from 'graphql-tag'

interface InstallDependenciesProps {
  dependencies: Dependency[]
}

export const InstallDependenciesFragment = gql`
  fragment InstallDependencies on Wizard {
    packageManager
    dependenciesToInstall {
      ...DependencyItem
    }
  }
  ${DependencyItemFragment}
`

export const InstallDependencies: React.FC<InstallDependenciesProps> = (
  props,
) => {
  return (
    <div className="flex flex-col items-center">
      <div className="max-w-screen-sm">
        <div>
          <p className="text-center p-4 text-xl">
            We need you to install these dev dependencies.
          </p>
          <ul>
            {props.dependencies.map((dependency) => (
              <DependencyItem
                key={dependency.packageName}
                dependency={dependency}
              />
            ))}
          </ul>
        </div>
      </div>
      <p className="text-lg m-4">Run this command in your terminal:</p>
      <TerminalCommand command="command" />
    </div>
  )
}
