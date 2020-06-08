import { MessagePort } from 'worker_threads'

export type RewriteRequest = {
  /**
   * used for resolving references in sourcemaps
   */
  url: string
  port: MessagePort
  isHtml?: boolean
  source: string
  /**
   * If true, terminate the worker.
   */
  shutdown?: true
  /**
   * If true, return the sourcemap and not the generated source.
   */
  sourceMap?: true
  inputSourceMap?: string
}

export type RewriteResponse = {
  threadMs: number
  /**
   * If set, this message is a notification that a source map may need to be generated for a given
   * JS snippet, and should be set aside for later.
   */
  deferredSourceMap?: {
    url: string
    js: string
  }
  /**
   * If set, this is the final output of the rewrite in progress.
   */
  output?: any
  error?: Error
}
