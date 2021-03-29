import * as React from 'react'
import { action } from '@storybook/addon-actions'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Input as InputComponent } from './Input'
import { IconInput as IconInputComponent } from './IconInput'

export default createStorybookConfig({
  title: 'Components/Input',
  argTypes: {
    onPrefixClick: {
      action: 'onPrefixClick',
    },
    onSuffixClick: {
      action: 'onSuffixClick',
    },
  },
})

export const Input = createStory(() => (
  <div>
    <InputComponent />
    <InputComponent label={{
      type: 'tag',
      contents: 'Labeled input',
    }}
    />
  </div>
))

/* eslint-disable no-spaced-func */
export const Icon = createStory<
{
  onPrefixClick: () => void
  onSuffixClick: () => void
    }
    >(({ onPrefixClick, onSuffixClick }) => (
      <div>
        <IconInputComponent
          prefixIcon={{
            icon: 'home',
            onClick: () => {
              console.log('click')
              action('onPrefixClick')
            },
          }}
          suffixIcon={{
            icon: 'times',
            onClick: action('onSuffixClick'),
          }}
        />
      </div>
    ))
