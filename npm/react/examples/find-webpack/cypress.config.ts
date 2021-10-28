import { defineConfig } from 'cypress'

export default defineConfig({
  'video': true,
  'projectId': 'jq5xpp',
  'component': {
    'testFiles': '**/*.spec.{js,ts,jsx,tsx}',
    'componentFolder': 'src',
  },
  'env': {
    'cypress-react-selector': {
      'root': '#__cy_root',
    },
  },
})
