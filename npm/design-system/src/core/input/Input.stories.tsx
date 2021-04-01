import * as React from 'react'
import { action } from '@storybook/addon-actions'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Input as InputComponent } from './Input'
import { IconInput as IconInputComponent } from './IconInput'

import typography from '../../css/derived/jsTypography.scss'
import { TextSize } from '../../css'

export default createStorybookConfig({
  title: 'Core/Input',
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

export const Icon = createStory(() => (
  <div>
    <div>
      <input />
    </div>
    <div>
      <IconInputComponent
        prefixIcon={{
          icon: 'home',
          onClick: action('onPrefixClick'),
        }}
        suffixIcon={{
          icon: 'times',
          onClick: action('onSuffixClick'),
        }}
      />
    </div>
    <div style={{ width: 500 }}>
      <IconInputComponent
        suffixIcon={{
          icon: 'times',
          onClick: action('onSuffixClick'),
        }}
      />
    </div>
    <div style={{ width: 500 }}>
      <IconInputComponent
        prefixIcon={{
          icon: 'home',
          onClick: action('onPrefixClick'),
        }}
      />
    </div>
    <div style={{ width: 500 }}>
      <IconInputComponent
        label={{
          type: 'tag',
          contents: 'Labeled IconInput',
        }}
        prefixIcon={{
          icon: 'home',
          onClick: action('onPrefixClick'),
        }}
        suffixIcon={{
          icon: 'times',
          onClick: action('onSuffixClick'),
        }}
      />
    </div>
    <div style={{ width: 500 }}>
      <IconInputComponent
        prefixIcon={{
          icon: 'home',
        }}
        suffixIcon={{
          icon: 'times',
          onClick: action('onSuffixClick'),
        }}
        placeholder="The leading icon isn't a button"
      />
      <IconInputComponent
        prefixIcon={{
          icon: 'home',
          onClick: action('onPrefixClick'),
        }}
        suffixIcon={{
          icon: 'times',
        }}
        placeholder="The trailing icon isn't a button"
      />
    </div>
  </div>
))

export const IconSizes = createStory(() => (
  <div>
    <div style={{ width: 500 }}>
      {Object.keys(typography).filter((key) => key !== 'type' && !key.startsWith('line-height') && !key.startsWith('text-mono') && key !== 'text-3xl' && key !== 'text-4xl').map((key) => {
        const size = key.replace('text-', '')

        return (
          <IconInputComponent
            key={key}
            size={size as TextSize}
            prefixIcon={{
              icon: 'home',
              onClick: action('onPrefixClick'),
            }}
            suffixIcon={{
              icon: 'times',
              onClick: action('onSuffixClick'),
            }}
          />
        )
      })}
    </div>
  </div>
))
