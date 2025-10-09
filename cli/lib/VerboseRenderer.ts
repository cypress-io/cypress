// Vendored from @cypress/listr-verbose-renderer
import figures from 'figures'
import cliCursor from 'cli-cursor'
import chalk from 'chalk'
import dayjs from 'dayjs'

const formattedLog = (options: any, output: string): void => {
  const timestamp = dayjs().format(options.dateFormat)

  // eslint-disable-next-line no-console
  console.log(`${chalk.dim(`[${timestamp}]`)} ${output}`)
}

const renderHelper = (task: any, event: any, options: any): void => {
  const log = formattedLog.bind(undefined, options)

  if (event.type === 'STATE') {
    const message = task.isPending() ? 'started' : task.state

    log(`${task.title} [${message}]`)

    if (task.isSkipped() && task.output) {
      log(`${figures.arrowRight} ${task.output}`)
    }
  } else if (event.type === 'TITLE') {
    log(`${task.title} [title changed]`)
  }
}

const render = (tasks: any[], options: any): void => {
  for (const task of tasks) {
    task.subscribe(
      (event: any) => {
        if (event.type === 'SUBTASKS') {
          render(task.subtasks, options)

          return
        }

        renderHelper(task, event, options)
      },
      (err: any) => {
        // eslint-disable-next-line no-console
        console.log(err)
      },
    )
  }
}

class VerboseRenderer {
  private _tasks: any[]
  private _options: any

  constructor (tasks: any[], options: any) {
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

  end (): void {
    cliCursor.show()
  }
}

export default VerboseRenderer
