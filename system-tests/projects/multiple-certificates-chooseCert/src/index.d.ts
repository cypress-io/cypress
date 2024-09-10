declare namespace Express {
  export interface Request {
    user?: {
      isAuthorized: boolean
      type: 'admin' | 'user' | null
    }
  }
}
