/**
 * Decodes incoming string chunks into complete lines, handling partial lines across chunk boundaries.
 *
 * This class buffers incoming string data and provides an iterator interface to yield complete
 * lines. It handles the case where a line might be split across multiple chunks by maintaining
 * an internal buffer. The end() method should be called to flush any remaining buffered content
 * when processing is complete.
 */
export class LineDecoder {
  private buffer: string = ''

  /**
   * Adds a chunk of string data to the internal buffer.
   *
   * @param chunk The string chunk to add to the buffer
   */
  public write (chunk: string) {
    this.buffer += chunk
  }

  /**
   * Iterates over complete lines in the current buffer.
   *
   * This generator yields complete lines from the buffer, splitting on newline characters.
   * Any incomplete line at the end of the buffer is kept for the next iteration.
   *
   * @yields Complete lines with newline characters preserved
   */
  *[Symbol.iterator] (): Generator<string> {
    const lines = this.buffer.split('\n')

    this.buffer = lines.pop() || ''

    for (const line of lines) {
      yield `${line}${line.length > 0 ? '\n' : ''}`
    }
  }

  /**
   * Flushes the remaining buffer content and yields all remaining lines.
   *
   * This method should be called when processing is complete to ensure all buffered
   * content is yielded. It processes any remaining content in the buffer plus an
   * optional final chunk.
   *
   * @param chunk Optional final chunk to process along with the buffer
   * @yields All remaining lines from the buffer and final chunk
   */
  *end (chunk?: string) {
    for (const line of `${this.buffer}${(chunk || '')}`.split('\n')) {
      yield `${line}\n`
    }
  }
}
