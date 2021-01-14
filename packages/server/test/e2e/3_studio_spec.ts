import e2e from '../support/helpers/e2e'
import { projectPath } from '../support/helpers/fixtures'

const project = projectPath('studio')

describe('e2e studio', function () {
  e2e.setup()

  it('tracks events', function () {
    return e2e.exec(this, {
      project,
      spec: 'events.spec.js',
      snapshot: true,
    })
  })
})
