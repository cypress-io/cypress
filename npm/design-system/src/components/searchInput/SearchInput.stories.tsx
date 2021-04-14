import * as React from 'react'

import { createStory, createStorybookConfig } from '../../stories/util'

import { SearchInput as SearchInputComponent } from './SearchInput'
import { useState } from 'react'

export default createStorybookConfig({
  title: 'Components/SearchInput',
})

export const SearchInput = createStory(() => {
  const [value, setValue] = useState('')

  return (
    <div>
      <SearchInputComponent value={value} placeholder='Search specs' aria-label="Search" onInput={setValue} />
    </div>
  )
})
