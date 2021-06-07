import type { Story, Meta } from '@storybook/react'

/**
 * Passthrough config creator for typing without casting
 */
export const createStorybookConfig = (config: Meta): Meta => config

/**
 * Compact way of declaring a new story
 */
export const createStory = <T = {}>(template: Story<T>, args?: Partial<T>) => {
  const story = template.bind({})

  story.args = args

  return story
}
