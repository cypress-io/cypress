// Progress callback called with percentage `0 <= p <= 1` of compression progress.
type OnProgress = (p: number) => void

export type ProcessOptions = {
  videoName: string
  compressedVideoName: string
  videoCompression: number
  chaptersConfig?: string
  onProgress?: OnProgress
  outputOptions?: string[]
  videoFilters?: string
}

export type WriteVideoFrame = (data: Buffer) => void

export type VideoRecording = {
  api: RunModeVideoApi
  controller?: BrowserVideoController
}

/**
 * Interface yielded by the browser to control video recording.
 */
export type BrowserVideoController = {
  /**
   * A function that resolves once the video is fully captured and flushed to disk.
   */
  endVideoCapture: (waitForMoreFrames: boolean) => Promise<void>
  /**
   * Timestamp of when the video capture started - used for chapter timestamps.
   */
  startedVideoCapture: Date
  postProcessFfmpegOptions?: Partial<ProcessOptions>
  /**
   * Used in single-tab mode to restart the video capture to a new file without relaunching the browser.
   */
  restart: () => Promise<void>
  writeVideoFrame: WriteVideoFrame
}

/**
 * Interface passed to the browser to enable capturing video.
 */
export type RunModeVideoApi = {
  onError: (err: Error) => void
  videoName: string
  compressedVideoName: string
  /**
   * Create+use a new VideoController that uses ffmpeg to stream frames from `writeVideoFrame` to disk.
   */
  useFfmpegVideoController: (opts?: { webmInput?: boolean}) => Promise<BrowserVideoController>
  /**
   * Register a non-ffmpeg video controller.
   */
  useVideoController: (videoController?: BrowserVideoController) => void
  /**
   * Registers a handler for project.on('capture:video:frames').
   */
  onProjectCaptureVideoFrames: (fn: (data: Buffer) => void) => void
}
