'use strict'
let __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { 'default': mod }
}

Object.defineProperty(exports, '__esModule', { value: true })
exports.FilterTaggedContent = void 0

const stream_1 = require('stream')
const string_decoder_1 = require('string_decoder')
const LineDecoder_1 = require('./LineDecoder')
const debug_1 = __importDefault(require('debug'))
const writeWithBackpressure_1 = require('./writeWithBackpressure')
const debug = (0, debug_1.default)('cypress:stderr-filtering:FilterTaggedContent')

/**
 * Filters content based on start and end tags, supporting multi-line tagged content.
 *
 * This transform stream processes incoming data and routes content between two output streams
 * based on tag detection. Content between start and end tags is sent to the filtered stream,
 * while content outside tags is sent to the main output stream. The class handles cases where
 * tags span multiple lines by maintaining state across line boundaries.
 *
 * Example usage:
 * ```typescript
 * const filter = new FilterTaggedContent('<secret>', '</secret>', filteredStream)
 * inputStream.pipe(filter).pipe(outputStream)
 * ```
 */
class FilterTaggedContent extends stream_1.Transform {
  /**
     * Creates a new FilterTaggedContent instance.
     *
     * @param startTag The string that marks the beginning of content to filter
     * @param endTag The string that marks the end of content to filter
     * @param filtered The writable stream for filtered content
     */
  constructor (startTag, endTag, wasteStream) {
    super({
      transform: (chunk, encoding, next) => this.transform(chunk, encoding, next),
      flush: (callback) => this.flush(callback),
    })

    this.startTag = startTag
    this.endTag = endTag
    this.wasteStream = wasteStream
    this.inTaggedContent = false
    /**
         * Processes incoming chunks and routes content based on tag detection.
         *
         * @param chunk The buffer chunk to process
         * @param encoding The encoding of the chunk
         * @param next Callback to call when processing is complete
         */
    this.transform = async (chunk, encoding, next) => {
      let _a; let _b; let _c

      try {
        this.ensureDecoders(encoding)
        const str = (_b = (_a = this.strDecoder) === null || _a === void 0 ? void 0 : _a.write(chunk)) !== null && _b !== void 0 ? _b : '';

        (_c = this.lineDecoder) === null || _c === void 0 ? void 0 : _c.write(str)
        debug('processing str for tags: "%s"', str)
        for (const line of Array.from(this.lineDecoder || [])) {
          await this.processLine(line)
        }
        next()
      } catch (err) {
        next(err)
      }
    }

    /**
         * Flushes any remaining buffered content when the stream ends.
         *
         * @param callback Callback to call when flushing is complete
         */
    this.flush = async (callback) => {
      let _a

      debug('flushing')
      this.ensureDecoders()
      try {
        for (const line of Array.from(((_a = this.lineDecoder) === null || _a === void 0 ? void 0 : _a.end()) || [])) {
          await this.processLine(line)
        }
        callback()
      } catch (err) {
        callback(err)
      }
    }
  }
  ensureDecoders (encoding) {
    let _a
    const enc = (_a = (encoding === 'buffer' ? 'utf8' : encoding)) !== null && _a !== void 0 ? _a : 'utf8'

    if (!this.lineDecoder) {
      this.lineDecoder = new LineDecoder_1.LineDecoder()
    }

    if (!this.strDecoder) {
      this.strDecoder = new string_decoder_1.StringDecoder(enc)
    }
  }
  /**
     * Processes a single line and routes content based on tag positions.
     *
     * This method handles the complex logic of detecting start and end tags within a line,
     * maintaining state across lines, and routing content to the appropriate streams.
     * It supports cases where both tags appear on the same line, only one tag appears,
     * or no tags appear but the line is part of ongoing tagged content.
     *
     * @param line The line to process
     */
  async processLine (line) {
    const startPos = line.indexOf(this.startTag)
    const endPos = line.lastIndexOf(this.endTag)

    if (startPos >= 0 && endPos >= 0) {
      // Both tags on same line
      if (startPos > 0) {
        await this.pass(line.slice(0, startPos))
      }

      await this.writeToWasteStream(line.slice(startPos + this.startTag.length, endPos))
      if (endPos + this.endTag.length < line.length) {
        await this.pass(line.slice(endPos + this.endTag.length))
      }
    } else if (startPos >= 0) {
      // Start tag found
      if (startPos > 0) {
        await this.pass(line.slice(0, startPos))
      }

      await this.writeToWasteStream(line.slice(startPos + this.startTag.length))
      this.inTaggedContent = true
    } else if (endPos >= 0) {
      // End tag found
      await this.writeToWasteStream(line.slice(0, endPos))
      if (endPos + this.endTag.length < line.length) {
        await this.pass(line.slice(endPos + this.endTag.length))
      }

      this.inTaggedContent = false
    } else if (this.inTaggedContent) {
      // Currently in tagged content
      await this.writeToWasteStream(line)
    } else {
      // Not in tagged content
      await this.pass(line)
    }
  }
  async writeToWasteStream (line, encoding) {
    let _a

    debug('writing to waste stream: "%s"', line)
    await (0, writeWithBackpressure_1.writeWithBackpressure)(this.wasteStream, Buffer.from(line, (_a = (encoding === 'buffer' ? 'utf8' : encoding)) !== null && _a !== void 0 ? _a : 'utf8'))
  }
  async pass (line, encoding) {
    let _a

    debug('passing: "%s"', line)
    this.push(Buffer.from(line, (_a = (encoding === 'buffer' ? 'utf8' : encoding)) !== null && _a !== void 0 ? _a : 'utf8'))
  }
}
exports.FilterTaggedContent = FilterTaggedContent
