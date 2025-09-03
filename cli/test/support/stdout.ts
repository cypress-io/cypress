const _write = process.stdout.write

const stdoutModule = {
  capture (): { data: string[], toString: () => string } {
    const logs: string[] = []

    const write = process.stdout.write

    process.stdout.write = function (str: any): boolean {
      logs.push(str)

      /* eslint-disable prefer-rest-params */
      return write.apply(this, arguments as any)
    }

    return {
      data: logs,

      toString: (): string => {
        return logs.join('')
      },
    }
  },

  restore (): void {
    process.stdout.write = _write
  },
}

export default stdoutModule
