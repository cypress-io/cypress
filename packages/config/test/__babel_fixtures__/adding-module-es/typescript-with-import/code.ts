import { defineConfig } from 'cypress'

export const foo: string = ""

const myConfig = defineConfig({
  e2e: {}
})

export default myConfig