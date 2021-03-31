import * as React from 'react'
import { action } from '@storybook/addon-actions'

import { createStory, createStorybookConfig } from '../../stories/util'

import { Button as ButtonComponent, LinkButton } from './Button'
import { IconButton as IconButtonComponent } from './IconButton'

import typography from '../../css/derived/jsTypography.scss'
import { TextSize } from '../../css'
import { PaddedBox } from '../surface/paddedBox/PaddedBox'
import { Icon } from '../icon/Icon'

export default createStorybookConfig({
  title: 'Core/Button',
})

export const Button = createStory(() => (
  <div>
    <PaddedBox>
      <ButtonComponent onPress={action('buttonPress')}>Simple button</ButtonComponent>
      <LinkButton onPress={action('anchorButtonPress')}>Anchor button</LinkButton>
    </PaddedBox>
    <PaddedBox style={{ backgroundColor: 'var(--brand-00)' }}>
      <ButtonComponent color='white' onPress={action('buttonPress')}>Simple button</ButtonComponent>
      <LinkButton color='white' onPress={action('anchorButtonPress')}>Anchor button</LinkButton>
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
            size={size as TextSize}
          >
            {`Button ${size}`}
          </ButtonComponent>
        )
      })}
    </div>
  </div>
))

export const IconButton = createStory(() => (
  <div>
    <div style={{ width: 500 }}>
      <IconButtonComponent elementType='button' icon='horse' />
    </div>
    <PaddedBox>
      <IconButtonComponent elementType='button' icon='hotdog' />
      <ButtonComponent>Text button</ButtonComponent>
      <LinkButton>
        <Icon icon='jedi' />
        {' Inline Icon with text'}
      </LinkButton>
    </PaddedBox>
    <PaddedBox style={{ backgroundColor: 'var(--brand-00)' }}>
      <IconButtonComponent elementType='button' icon='hotdog' color='white' />
      <ButtonComponent color='white'>Text button</ButtonComponent>
      <LinkButton color='white'>
        <Icon icon='jedi' />
        {' Inline Icon with text'}
      </LinkButton>
    </PaddedBox>
  </div>
))
