import * as React from 'react'
// TODO: This is causing a "module not defined error"
// Find out why and fix it
// import { action } from '@storybook/addon-actions'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Input as InputComponent } from './Input'
import { IconInput as IconInputComponent } from './IconInput'

import { TextSize } from 'css'

// stub it for now
const action = (action: string) => undefined

export default createStorybookConfig({
  title: 'Core/Input',
  excludeStories: ['iconSizesWithSizes'],
})

export const Input = createStory(() => (
  <div>
    <InputComponent label={{ type: 'aria', contents: 'aria labeled input' }} />
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
      <InputComponent label={{ type: 'aria', contents: 'foo' }} />
    </div>
    <div>
      <IconInputComponent
        label={{ type: 'aria', contents: 'full width input' }}
        prefixIcon={{
          icon: 'home',
          // onPress: action('onPrefixClick'),
          'aria-label': 'onPrefixClick',
        }}
        suffixIcon={{
          icon: 'times',
          // onPress: action('onSuffixClick'),
          'aria-label': 'onSuffixClick',
        }}
      />
    </div>
    <div style={{ width: 500 }}>
      <IconInputComponent
        label={{ type: 'aria', contents: '500px width input' }}
        suffixIcon={{
          icon: 'times',
          // onPress: action('onSuffixClick'),
          'aria-label': 'onSuffixClick',
        }}
        value="This is a very long string in an IconInput. This displays the padding on the input section"
      />
      <IconInputComponent
        label={{ type: 'aria', contents: '500px width input' }}
        prefixIcon={{
          icon: 'home',
          // onPress: action('onPrefixClick'),
          'aria-label': 'onPrefixClick',
        }}
        value="This is a very long string in an IconInput. This displays the padding on the input section"
      />
      <IconInputComponent
        label={{
          type: 'tag',
          contents: 'Labeled IconInput',
        }}
        prefixIcon={{
          icon: 'home',
          // onPress: action('onPrefixClick'),
          'aria-label': 'onPrefixClick',
        }}
        suffixIcon={{
          icon: 'times',
          // onPress: action('onSuffixClick'),
          'aria-label': 'onSuffixClick',
        }}
      />
      <IconInputComponent
        label={{ type: 'aria', contents: 'trailing button only' }}
        prefixIcon={{
          icon: 'home',
        }}
        suffixIcon={{
          icon: 'times',
          // onPress: action('onSuffixClick'),
          'aria-label': 'onSuffixClick',
        }}
        placeholder="The leading icon isn't a button"
      />
      <IconInputComponent
        label={{ type: 'aria', contents: 'leading button only' }}
        prefixIcon={{
          icon: 'home',
          // onPress: action('onPrefixClick'),
          'aria-label': 'onPrefixClick',
        }}
        suffixIcon={{
          icon: 'times',
        }}
        placeholder="The trailing icon isn't a button"
      />
    </div>
  </div>
))

export const iconSizesWithSizes = (sizes: string[]) => sizes.map((key) => {
  const size = key.replace('text-', '')

  return (
    <IconInputComponent
      key={key}
      label={{ type: 'aria', contents: `input size ${size}` }}
      size={size as TextSize}
      prefixIcon={{
        icon: 'home',
        onPress: action('onPrefixClick'),
        'aria-label': 'onPrefixClick',
      }}
      suffixIcon={{
        icon: 'times',
        onPress: action('onSuffixClick'),
        'aria-label': 'onSuffixClick',
      }}
    />
  )
})

// export const IconSizes = createStory(() => (
//   <div>
//     <div style={{ width: 500 }}>
//       {iconSizesWithSizes(Object.keys(typography).filter((key) => key !== 'type' && !key.startsWith('line-height') && !key.startsWith('text-mono') && key !== 'text-3xl' && key !== 'text-4xl'))}
//     </div>
//   </div>
// ))
