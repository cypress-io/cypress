<template>
  <div class="px-6 py-4 border-b mb-7">
    <div class="flex items-center justify-between max-content">
      <div class="flex items-center">
        <img
          class="mr-2 w-32px h-32px"
          src="../images/cypress-dark.png"
        >
        <span
          class="text-primary"
          @click="clearActiveProject"
        >Projects</span>
        <!-- TODO: Replace with a cy icon -->
        <i-oi-chevron-right
          v-if="props.gql?.app?.activeProject"
          class="text-gray-300 h-8px"
        />
        <span class="text-body-gray-700">{{ props.gql?.app?.activeProject?.title }}</span>
      </div>
      <div class="flex gap-6">
        <TopNav
          :gql="props?.gql?.app"
          :show-browsers="props.showBrowsers"
        />
        <button @click="openLogin">
          Login
        </button>
        <LoginModal v-model="isLoginOpen">
          <template #footer>
            <Auth :gql="props.gql" />
          </template>
        </LoginModal>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation } from '@urql/vue'
import { ref } from 'vue'
import { GlobalPageHeader_ClearActiveProjectDocument, HeaderBarFragment } from '../generated/graphql'
import TopNav from '../components/topnav/TopNav.vue'
import LoginModal from '../components/topnav/LoginModal.vue'

import Auth from '../setup/Auth.vue'

gql`
mutation GlobalPageHeader_clearActiveProject {
  clearActiveProject {
    app {
      isInGlobalMode
      activeProject {
        id
      }
    }
  }
}
`

gql`
fragment HeaderBar on Query {
  app {
    activeProject {
      id
      title
    }
    ...TopNav
  }
  ...Auth
}
`

const isLoginOpen = ref(false)
const clearActiveProjectMutation = useMutation(GlobalPageHeader_ClearActiveProjectDocument)

const openLogin = () => {
  isLoginOpen.value = true
}

const clearActiveProject = () => {
  if (props.gql.app.activeProject) {
    clearActiveProjectMutation.executeMutation({})
  }
}

const props = defineProps<{
  gql: HeaderBarFragment,
  showBrowsers?: Boolean
}>()

</script>
