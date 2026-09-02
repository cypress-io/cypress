import path from 'path'

const example = {
  getPathToE2E (): string {
    return path.join(__dirname, '..', 'cypress', 'e2e')
  },
}

export = example
