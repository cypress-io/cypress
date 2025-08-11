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
   * Normalizes line endings to \n and splits on newlines.
   *
   * @param text The text to process
   * @returns Array of lines with normalized line endings
   */
  private splitLines (text: string): string[] {
    // Normalize \r\n to \n, then split
    return text.replace(/\r\n/g, '\n').split('\n')
  }

  /**
   * Iterates over complete lines in the current buffer.
   *
   * This generator yields complete lines from the buffer, splitting on newline characters.
   * Any incomplete line at the end of the buffer is kept for the next iteration.
   * Handles both Windows (\r\n) and Unix (\n) line endings.
   *
   * @yields Complete lines with newline characters preserved
   */
  *[Symbol.iterator] (): Generator<string> {
    const lines = this.splitLines(this.buffer)

    this.buffer = lines.pop() || ''

    for (const line of lines) {
      yield `${line}\n`
    }
  }

  /**
   * Flushes the remaining buffer content and yields all remaining lines.
   *
   * This method should be called when processing is complete to ensure all buffered
   * content is yielded. It processes any remaining content in the buffer plus an
   * optional final chunk. Handles both Windows (\r\n) and Unix (\n) line endings.
   *
   * @param chunk Optional final chunk to process along with the buffer
   * @yields All remaining lines from the buffer and final chunk
   */
  *end (chunk?: string) {
    const content = `${this.buffer}${(chunk || '')}`
    const lines = this.splitLines(content)

    for (const line of lines) {
      yield `${line}\n`
    }
  }
}
