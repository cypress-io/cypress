import chalk from 'chalk'
import { Transform } from 'stream'

export function prefixLog (prefixStr: string): Pick<typeof console, 'log' | 'error'> {
  const prefix = `[${chalk.gray(prefixStr)}]: `

  return {
    log: (...args: string[]) => {
      return console.log(prefix, ...args)
    },
    error: (...args: string[]) => {
      return console.error(prefix, ...args.map((a) => chalk.red(a)))
    },
  }
}

/**
 * Takes a stream and prefixes with a given string
 * @param prefixStr
 * @returns
 */
export function prefixStream (prefixStr: string | (() => string)) {
  const prefix =
    typeof prefixStr === 'string'
      ? Buffer.from(`[${chalk.gray(prefixStr)}]: `)
      : () => Buffer.from(`[${chalk.gray(prefixStr())}]: `)

  // https://stackoverflow.com/a/45126242
  class PrefixStream extends Transform {
    _rest?: Buffer

    _transform (chunk: Buffer, encoding: string, cb: CallableFunction) {
      this._rest =
        this._rest && this._rest.length
          ? Buffer.concat([this._rest, chunk])
          : chunk

      let index

      while (this._rest && (index = this._rest.indexOf('\n')) !== -1) {
        const line = this._rest.slice(0, ++index)

        this._rest = this._rest.slice(index)
        this.push(
          Buffer.concat([
            typeof prefix === 'function' ? prefix() : prefix,
            line,
          ]),
        )
      }

      cb()
    }

    _flush (cb: CallableFunction) {
      if (this._rest && this._rest.length) {
        cb(
          null,
          Buffer.concat([
            typeof prefix === 'function' ? prefix() : prefix,
            this._rest,
          ]),
        )
      }
    }
  }

  return new PrefixStream()
}
