import { HttpError } from '../network/http_error'
import { SystemError } from '../network/system_error'
import { StreamStalledError } from '../upload/stream_stalled_error'
import Debug from 'debug'
import * as errors from '../../errors'

const debug = Debug('cypress:server:cloud:artifacts')

export const printProtocolUploadError = (error: Error) => {
  debug('protocol error: %O', error)
  // eslint-disable-next-line no-console
  console.log('')
  if ((error as AggregateError).errors) {
    errors.warning('CLOUD_PROTOCOL_UPLOAD_AGGREGATE_ERROR', error as AggregateError)
  } else if (HttpError.isHttpError(error)) {
    errors.warning('CLOUD_PROTOCOL_UPLOAD_HTTP_FAILURE', error)
  } else if (SystemError.isSystemError(error)) {
    errors.warning('CLOUD_PROTOCOL_UPLOAD_NETWORK_FAILURE', error)
  } else if (StreamStalledError.isStreamStalledError(error)) {
    errors.warning('CLOUD_PROTOCOL_UPLOAD_STREAM_STALL_FAILURE', error)
  } else {
    errors.warning('CLOUD_PROTOCOL_UPLOAD_UNKNOWN_ERROR', error)
  }
}
