import type { Request, Response } from 'express'
import send from 'send'
import { getPathToDist } from '@packages/resolve-dist'

export const runner = {
  handle (req: Request, res: Response) {
    return send(req, encodeURI(req.params[0] ?? ''), { root: getPathToDist('runner') }).pipe(res)
  },
}
