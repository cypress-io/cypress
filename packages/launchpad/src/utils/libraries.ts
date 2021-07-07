export interface Library {
    id: string
    name: string
    package: string
}

export const SupportedLibraryVue = {
  id: 'vue',
  name: 'VueJs',
  package: '@cypress/vue',
}

export const SupportedLibraryReact = {
  id: 'react',
  name: 'ReactJs',
  package: '@cypress/react',
}
