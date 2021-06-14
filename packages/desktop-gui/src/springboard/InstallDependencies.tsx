import { DependencyItem } from './DependencyItem'
import { TerminalCommand } from './TerminalCommand'

interface InstallDependenciesProps {
  dependencies: any[]
}

export const InstallDependencies: React.FC<InstallDependenciesProps> = (
  props,
) => (
  <div className="flex flex-col items-center">
    <div className="max-w-screen-sm">
      <div>
        <p className="text-center p-4 text-xl">
          We need you to install these dev dependencies.
        </p>
        <ul>
          {props.dependencies.map((dep) => (
            <DependencyItem key={dep.packageName} dependency={dep} />
          ))}
        </ul>
      </div>
    </div>
    <p className="text-lg m-4">Run this command in your terminal:</p>
    <TerminalCommand command="command" />
  </div>
)
