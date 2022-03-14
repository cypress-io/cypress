import { options } from '@packages/config'

export const getDefaultSpecPatterns = () => {
  return {
    e2e: options.find((opt) => opt.name === 'e2e')?.defaultValue?.specPattern,
    component: options.find((opt) => opt.name === 'component')?.defaultValue?.specPattern,
  }
}
