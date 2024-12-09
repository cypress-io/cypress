import { isObject } from 'lodash'
import axios, { AxiosError } from 'axios'

export const transformError = (err: AxiosError | Error & { error?: any, statusCode: number }): never => {
  const { data, status } = axios.isAxiosError(err) ?
    { data: err.response?.data, status: err.status } :
    { data: err.error, status: err.statusCode }

  if (isObject(data)) {
    const body = JSON.stringify(data, null, 2)

    err.message = [status, body].join('\n\n')
  }

  throw err
}
