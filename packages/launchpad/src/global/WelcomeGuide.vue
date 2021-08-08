<template>
  <div class="bg-indigo-50 w-full p-12 flex relative" v-if="show">
    <Button variant="link" class="absolute top-1 right-1 sibling:absolute" :suffixIcon="IconCircleX" @click="show = !show">
      Dismiss
    </Button>
    <svg
      class="min-w-100px mr-[5%] max-w-224px self-start h-full relative w-full"
      width="224"
      height="224"
      viewBox="0 0 224 224"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M189.782 189.782C146.824 232.739 77.1759 232.739 34.2183 189.782C-8.73942 146.824 -8.73942 77.1759 34.2183 34.2183C77.1759 -8.73942 146.824 -8.73942 189.782 34.2183C232.739 77.1759 232.739 146.824 189.782 189.782Z"
        fill="#CAD2FA"
        stroke="#6B7DE8"
        stroke-width="4"
      />
    </svg>

    <div class="divide-y divide-gray-300">
      <div class="grid">
        <div class="children:leading-normal ml-2 mb-4">
          <h1 class="text-2rem text-gray-900">{{ t('welcomeGuide.header.title') }}</h1>
          <p class="text-16px text-gray-500 font-light">{{ t('welcomeGuide.header.description') }}</p>
        </div>

        <div class="grid link-wrappers justify-between">
          <WelcomeGuideLinks class="mb-5" :header="t('welcomeGuide.projectListHeader')" :items="projects.slice(0, 3)" @click="chooseProject">
            <template #="{ item }">{{ item.path }}</template>
          </WelcomeGuideLinks>
          <WelcomeGuideLinks :header="t('welcomeGuide.linkHeader')" :items="links" @click="openLink">
            <template #="{ item }">{{ item.description }}</template>
          </WelcomeGuideLinks>
        </div>
      </div>
      <div class="py-16px">
        <Checkbox
          v-model="showWelcomeGuideOnStartup"
          id="show-welcome-guide"
          :label="t('welcomeGuide.confirmWelcomeGuide')"
        ></Checkbox>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from "../composables";
import Checkbox from '../components/checkbox/Checkbox.vue'
import Button from '../components/button/Button.vue'
import WelcomeGuideLinks from './WelcomeGuideLinks.vue'
import IconCircleX from 'virtual:vite-icons/akar-icons/circle-x'

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
    href: 'https://on.cypress.io/'
  },
  {
    description: 'Learning Academy',
    href: 'https://on.cypress.io/'
  },
  {
    description: 'Cypress Releases',
    href: 'https://on.cypress.io/'
  }
]

const { t } = useI18n()

const show = ref(true)

const chooseProject = (project) => {
  // Opens the project
}

const openLink = (item) => {
  // Open the item's href
}
const showWelcomeGuideOnStartup = ref(true)
</script>

<style scoped lang="scss">
.link-wrappers {
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
.placeholder {
  /* Illustration */

  /* position: static; */
  width: 224px;
  height: 224px;
  left: 0px;
  top: 0px;

  /* Primary/Indigo/200 */

  background: #cad2fa;
  /* Primary/Indigo/400 */

  border: 4px solid #6b7de8;
  box-sizing: border-box;

  /* Inside Auto Layout */

  /* flex: none; */
  /* order: 0; */
  /* flex-grow: 0; */
  /* margin: 0px 64px; */
}
</style>
