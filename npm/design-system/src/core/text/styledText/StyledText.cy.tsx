import * as React from 'react'

import { mountAndSnapshot } from 'util/testing'

import { styledTextWithSizes } from './StyledText.stories'

// TODO: Autogenerate from stories
describe('<StyledText />', () => {
  it('StyledText', () => {
    const StyledText = () => (
      <>
        {styledTextWithSizes(['text-xs', 'text-s', 'text-ms', 'text-m', 'text-ml', 'text-l', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'])}
      </>
    )

    mountAndSnapshot(<StyledText />)
  })
})
