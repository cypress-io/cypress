import * as React from 'react'
// TODO: This is causing a "module not defined error"
// Find out why and fix it
// import { action } from '@storybook/addon-actions'

import { createStory, createStorybookConfig } from 'stories/util'

import { Button as ButtonComponent, LinkButton } from './Button'
import { IconButton as IconButtonComponent } from './IconButton'

import typography from 'css/derived/jsTypography.scss'
import { TextSize } from 'css'
import { PaddedBox } from '../surface/paddedBox/PaddedBox'
import { Icon } from '../icon/Icon'

// stub it for now
const action = (action: string) => undefined

export default createStorybookConfig({
  title: 'Core/Button',
})

export const Button = createStory(() => (
  <div>
    <PaddedBox>
      <ButtonComponent aria-label="buttonPress" onPress={action('buttonPress')}>Simple button</ButtonComponent>
      <LinkButton aria-label="anchorButtonPress" onPress={action('anchorButtonPress')}>Anchor button</LinkButton>
    </PaddedBox>
    <PaddedBox style={{ backgroundColor: 'var(--brand-00)' }}>
      <ButtonComponent aria-label="buttonPress" color='white' onPress={action('buttonPress')}>Simple button</ButtonComponent>
      <LinkButton aria-label="anchorButtonPress" color='white' onPress={action('anchorButtonPress')}>Anchor button</LinkButton>
    </PaddedBox>
    <PaddedBox>
      <ButtonComponent aria-label="buttonPress" color='white' onPress={action('buttonPress')}>Simple button</ButtonComponent>
      <LinkButton aria-label="anchorButtonPress" color='white' onPress={action('anchorButtonPress')}>Anchor button</LinkButton>
    </PaddedBox>
  </div>
))

export const buttonSizesWithSizes = (sizes: string[]) => sizes.filter((key) => key !== 'type' && !key.startsWith('line-height') && !key.startsWith('text-mono')).map((key) => {
  const size = key.replace('text-', '')

  return (
    <ButtonComponent
      key={key}
      size={size as TextSize}
      aria-label="buttonPress"
    >
      {`Button ${size}`}
    </ButtonComponent>
  )
})

export const ButtonSizes = createStory(() => (
  <div>
    <div style={{ width: 500 }}>
      {buttonSizesWithSizes(Object.keys(typography))}
    </div>
  </div>
))

export const IconButton = createStory(() => (
  <div>
    <div style={{ width: 500 }}>
      <IconButtonComponent aria-label="iconButton" elementType='button' icon='horse' />
    </div>
    <PaddedBox>
      <IconButtonComponent aria-label="iconButton" elementType='button' icon='hotdog' />
      <ButtonComponent aria-label="normalButton">Text button</ButtonComponent>
      <LinkButton aria-label="linkButton">
        <Icon icon='jedi' />
        {' Inline Icon with text'}
      </LinkButton>
    </PaddedBox>
    <PaddedBox style={{ backgroundColor: 'var(--brand-00)' }}>
      <IconButtonComponent aria-label="iconButton" elementType='button' icon='hotdog' color='white' />
      <ButtonComponent aria-label="normalButton" color='white'>Text button</ButtonComponent>
      <LinkButton aria-label="linkButton" color='white'>
        <Icon icon='jedi' />
        {' Inline Icon with text'}
      </LinkButton>
    </PaddedBox>
  </div>
))
