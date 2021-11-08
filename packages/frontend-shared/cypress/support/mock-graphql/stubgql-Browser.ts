import type { Browser } from '../generated/test-graphql-types.gen'

import { testNodeId } from './clientTestUtils'
import { longBrowsersList } from './stubgql-App'

export const stubBrowsers = longBrowsersList.map((browser, i): Browser => {
  return {
    ...testNodeId('Browser'),
    ...browser,
    disabled: false,
    isSelected: i === 0,
  }
})
