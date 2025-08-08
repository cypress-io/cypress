export class LineDecoder {
  private buffer: string = ''

  public write (chunk: string) {
    this.buffer += chunk
  }

  *[Symbol.iterator] (): Generator<string> {
    const lines = this.buffer.split('\n')

    this.buffer = lines.pop() || ''

    for (const line of lines) {
      yield line
    }
  }

  *end (chunk?: string) {
    for (const line of `${this.buffer}${(chunk || '')}`.split('\n')) {
      yield line
    }
  }
}
