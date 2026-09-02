import { join } from 'path'

const example = {
  getPathToE2E (): string {
    return join(__dirname, '..', 'cypress', 'e2e')
  },
}

export = example
