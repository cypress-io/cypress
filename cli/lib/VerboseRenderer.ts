// Vendored from @cypress/listr-verbose-renderer; listr2 v6+ uses event APIs (not rxjs subscribe)
import { ListrTaskEventType, type ListrRenderer } from 'listr2'
import figures from 'figures'
import cliCursor from 'cli-cursor'
import chalk from 'chalk'
import dayjs from 'dayjs'

const formattedLog = (options: any, output: string): void => {
  const timestamp = dayjs().format(options.dateFormat)

  console.log(`${chalk.dim(`[${timestamp}]`)} ${output}`)
}

const renderHelperState = (task: any, options: any): void => {
  const log = formattedLog.bind(undefined, options)
  const message = task.isPending() ? 'started' : task.state

  log(`${task.title} [${message}]`)

  if (task.isSkipped() && task.output) {
    log(`${figures.arrowRight} ${task.output}`)
  }
}

const renderHelperTitle = (task: any, options: any): void => {
  const log = formattedLog.bind(undefined, options)

  log(`${task.title} [title changed]`)
}

const render = (tasks: any[], options: any): void => {
  for (const task of tasks) {
    task.on(ListrTaskEventType.SUBTASK, (subtasks: any[]) => {
      render(subtasks, options)
    })

    task.on(ListrTaskEventType.STATE, () => {
      renderHelperState(task, options)
    })

    task.on(ListrTaskEventType.TITLE, () => {
      renderHelperTitle(task, options)
    })
  }
}

class VerboseRenderer implements ListrRenderer {
  static rendererOptions: Record<PropertyKey, any> = {}
  static rendererTaskOptions: Record<PropertyKey, any> = {}

  private readonly _tasks: any[]
  private readonly _options: any

  constructor (tasks: any[], options: any, _events?: unknown) {
    this._tasks = tasks
    this._options = Object.assign({
      dateFormat: 'HH:mm:ss',
    }, options)
  }

  static get nonTTY (): boolean {
    return true
  }

  render (): void {
    cliCursor.hide()
    render(this._tasks, this._options)
  }

  end (_err?: Error): void {
    cliCursor.show()
  }
}

export default VerboseRenderer
