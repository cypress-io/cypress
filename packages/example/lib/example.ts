import { join } from 'path'

export default {
  getPathToE2E (): string {
    return join(__dirname, '..', 'cypress', 'e2e')
  },
}
