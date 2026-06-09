import execa from 'execa'

export interface RunCommandInProjectOptions {
  ignoreEngines?: boolean
}

export const runCommandInProject = (
  command: string,
  projectPath: string,
  options: RunCommandInProjectOptions = {},
) => {
  let finalCommand = command

  if (options.ignoreEngines && command.startsWith('yarn ')) {
    finalCommand = `yarn --ignore-engines ${command.slice('yarn '.length)}`
  }

  const [ex, ...args] = finalCommand.split(' ')

  return execa(ex, args, { cwd: projectPath, stdio: 'inherit' })
}
