import * as React from 'react'
import { action } from '@storybook/addon-actions'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Button as ButtonComponent } from './Button'

import typography from '../../css/derived/jsTypography.scss'
import { TextSize } from '../../css'
import { PaddedBox } from '../surface/paddedBox/PaddedBox'

export default createStorybookConfig({
  title: 'Core/Button',
})

export const Button = createStory(() => (
  <div>
    <PaddedBox>
      <ButtonComponent elementType='button' onPress={action('buttonPress')}>Simple button</ButtonComponent>
      <ButtonComponent elementType='a' onPress={action('anchorButtonPress')}>Anchor button</ButtonComponent>
    </PaddedBox>
    <PaddedBox style={{ backgroundColor: 'var(--brand-00)' }}>
      <ButtonComponent elementType='button' color='white' onPress={action('buttonPress')}>Simple button</ButtonComponent>
      <ButtonComponent elementType='a' color='white' onPress={action('anchorButtonPress')}>Anchor button</ButtonComponent>
    </PaddedBox>
  </div>
))

export const ButtonSizes = createStory(() => (
  <div>
    <div style={{ width: 500 }}>
      {Object.keys(typography).filter((key) => key !== 'type' && !key.startsWith('line-height') && !key.startsWith('text-mono')).map((key) => {
        const size = key.replace('text-', '')

        return (
          <ButtonComponent
            key={key}
            elementType='button'
            size={size as TextSize}
          >
            {`Button ${size}`}
          </ButtonComponent>
        )
      })}
    </div>
  </div>
))
