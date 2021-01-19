import { openStudio } from '../support'
import { externalTest } from '../support/external'

describe('extends external test', () => {
  openStudio()

  externalTest()
})
