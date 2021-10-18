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
            :items="projects"
            @itemSelected="setActiveProject"
          >
            <template #default="{ item }">
              {{ item.description }}
            </template>
          </WelcomeGuideLinks>
          <WelcomeGuideLinks
            :header="t('welcomeGuide.linkHeader')"
            :items="links"
            @itemSelected="openLink"
          >
            <template #default="{ item }">
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
import { computed, ref } from 'vue'
import { useI18n } from '@cy/i18n'
import Checkbox from '@cy/components/Checkbox.vue'
import Button from '@cy/components/Button.vue'
import WelcomeGuideLinks from './WelcomeGuideLinks.vue'
import IconCircleX from '~icons/akar-icons/circle-x'
import IconPlaceholder from '~icons/icons8/circle-thin'
import { gql } from '@urql/core'
import { WelcomeGuideFragment, WelcomeGuide_SetActiveProjectDocument } from '../generated/graphql'
import { useMutation } from '@urql/vue'

const links = [
  {
    description: 'Getting Started',
    path: 'https://on.cypress.io/',
  },
  {
    description: 'Learning Academy',
    path: 'https://on.cypress.io/',
  },
  {
    description: 'Cypress Releases',
    path: 'https://on.cypress.io/',
  },
]

gql`
fragment WelcomeGuide on App {
  projects {
    id
    projectRoot
    title
  }
}`

gql`
mutation WelcomeGuide_SetActiveProject($path: String!) {
  setActiveProject(path: $path) {
    activeProject {
      id
      title
      projectId
      projectRoot
      isFirstTimeCT
      isFirstTimeE2E
    }
  }
}
`

const { t } = useI18n()
const show = ref(true)
const showWelcomeGuideOnStartup = ref(true)

const props = defineProps<{
  gql: WelcomeGuideFragment
}>()

const projects = computed(() => {
  if (props.gql.projects) {
    return props.gql.projects.slice(0, 3).map((x) => {
      return {
        description: `${x.title} (${x.projectRoot})`,
        path: x.projectRoot,
      }
    })
  }

  return []
})

const setActiveProjectMutation = useMutation(WelcomeGuide_SetActiveProjectDocument)
const setActiveProject = ({ path }: { path: string }) => {
  setActiveProjectMutation.executeMutation({ path })
}

const openLink = ({ path }: { path: string }) => {
  // TODO: Open the item's href
}
</script>

<style scoped lang="scss">
.link-wrappers {
  // for some reason, I can't get this to work inside of an inline class.
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
}
</style>
