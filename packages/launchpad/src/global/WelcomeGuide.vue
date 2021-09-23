<template>
  <div
    v-if="show"
    class="bg-indigo-50 border-b-1 border-b-indigo-100 w-full p-12 flex relative"
  >
    <Button
      variant="link"
      class="absolute top-1 right-1 sibling:absolute"
      :suffix-icon="IconCircleX"
      @click="show = !show"
    >
      {{ t('components.modal.dismiss') }}
    </Button>
    <IconPlaceholder
      class="min-w-100px mr-[5%] max-w-224px self-start h-full relative justify-center w-full text-indigo-600"
    />
    <div class="divide-y divide-gray-300">
      <div class="grid">
        <div class="children:leading-normal ml-2 mb-4">
          <h1 class="text-2rem text-gray-900">
            {{ t('welcomeGuide.header.title') }}
          </h1>
          <p class="text-16px text-gray-500 font-light">
            {{ t('welcomeGuide.header.description') }}
          </p>
        </div>

        <div class="grid link-wrappers justify-between">
          <WelcomeGuideLinks
            class="mb-2"
            :header="t('welcomeGuide.projectListHeader')"
            :items="projects.slice(0, 3)"
            @click="chooseProject"
          >
            <template #="{ item }">
              {{ item.path }}
            </template>
          </WelcomeGuideLinks>
          <WelcomeGuideLinks
            :header="t('welcomeGuide.linkHeader')"
            :items="links"
            @click="openLink"
          >
            <template #="{ item }">
              {{ item.description }}
            </template>
          </WelcomeGuideLinks>
        </div>
      </div>
      <div class="py-16px">
        <Checkbox
          id="show-welcome-guide"
          v-model="showWelcomeGuideOnStartup"
          :label="t('welcomeGuide.confirmWelcomeGuide')"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from '../composables'
import Checkbox from '../components/checkbox/Checkbox.vue'
import Button from '../components/button/Button.vue'
import WelcomeGuideLinks from './WelcomeGuideLinks.vue'
import IconCircleX from 'virtual:vite-icons/akar-icons/circle-x'
import IconPlaceholder from 'virtual:vite-icons/icons8/circle-thin'

const projects = [
  { path: '~/Documents/GitHub/web' },
  { path: '~/Documents/GitHub/web/vue-ts-starter' },
  { path: '~/Documents/GitHub/marketing' },

  // Only show the first 3
  { path: '~Documents/wherever/definitely-foo' },
  { path: '~Documents/somewhere/else' },
]

const links = [
  {
    description: 'Getting Started',
    href: 'https://on.cypress.io/',
  },
  {
    description: 'Learning Academy',
    href: 'https://on.cypress.io/',
  },
  {
    description: 'Cypress Releases',
    href: 'https://on.cypress.io/',
  },
]

const { t } = useI18n()
const show = ref(true)
const showWelcomeGuideOnStartup = ref(true)

const chooseProject = (project) => {
  // TODO: Opens the project
}

const openLink = (item) => {
  // TODO: Open the item's href
}
</script>

<style scoped lang="scss">
.link-wrappers {
  // for some reason, I can't get this to work inside of an inline class.
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
</style>
