import { useTooltip } from './VTooltip';

export const usePlugins = () => {
  return [
    useTooltip()
  ]
}

export * from './VTooltip'