import chalk from 'chalk'
import dedent from 'dedent'

export function exit (msg: string | Error): void {
  if (msg instanceof Error) {
    console.log(msg.stack)

    return exit(msg.message)
  }

  console.error(`\n${chalk.red(dedent(msg))}\n`)
  process.exit(1)
}
