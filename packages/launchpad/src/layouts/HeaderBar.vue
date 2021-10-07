<template>
  <div class="px-6 py-4 border-b mb-7">
    <div class="flex items-center justify-between max-content">
      <div class="flex items-center">
        <img class="mr-2 w-32px h-32px" src="../images/cypress-dark.png" />
        <span class="text-primary" @click="clearActiveProject">Projects</span>
        <!-- TODO: Replace with a cy icon -->
        <i-oi-chevron-right v-if="props.gql?.app?.activeProject" class="text-gray-300 h-8px" />
        <span class="text-body-gray-700">{{ props.gql?.app?.activeProject?.title }}</span>
      </div>
      <div class="flex gap-6">
        <TopNav :gql="props.gql.app" :show-browsers="props.showBrowsers">
          <template v-if="!!props.gql.cloudViewer" #login-title>
            <div
              :style="`background-image: url(${gravatarUrl(props.gql.cloudViewer?.email)});`"
              class="rounded-50px w-24px h-24px border-1px border-gray-200 overflow-hidden bg-cover"
            />
          </template>
          <template v-if="!!props.gql.cloudViewer" #login-panel>
            <div class="min-w-248px">
              <div class="flex border-b-gray-100 border-b p-16px">
                <div
                  v-if="props.gql.cloudViewer"
                  :style="`background-image: url(${gravatarUrl(props.gql.cloudViewer?.email)});`"
                  class="rounded-50px w-48px mr-16px h-48px border-1px border-gray-200 overflow-hidden bg-cover"
                />
                <div>
                  <span class="text-gray-800">{{ props.gql.cloudViewer?.fullName }}</span>
                  <br />
                  <span class="text-gray-600">{{ props.gql.cloudViewer?.email }}</span>
                  <br>
                  <a class="text-indigo-500 outline-transparent hocus:underline" href="https://dashboard-staging.cypress.io/profile">Profile Settings</a>
                </div>
              </div>

              <div class="p-16px">
                <Auth :gql="props.gql" :show-logout="true" />
              </div>
            </div>
          </template>
        </TopNav>
        <div class>
          <button
            v-if="!props.gql.cloudViewer"
            @click="openLogin"
            class="flex group items-center text-gray-600  focus:outline-transparent"
          >
            <i-cy-profile_x16
              class="block icon-dark-gray-500 icon-light-gray-100 group-hocus:icon-dark-indigo-500 group-hocus:icon-light-indigo-50 h-16px w-16px mr-8px"
            />
            <span class="group-hocus:text-indigo-500">Log In</span>
          </button>
        </div>
      </div>
      <LoginModal v-model="isLoginOpen" :gql="props.gql" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { gql, useMutation } from '@urql/vue'
import { ref } from 'vue'
import { GlobalPageHeader_ClearActiveProjectDocument, HeaderBarFragment } from '../generated/graphql'
import TopNav from '../components/topnav/TopNav.vue'
import LoginModal from '../components/topnav/LoginModal.vue'
import gravatar from 'gravatar'
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

const gravatarUrl = (email) => {
  let opts: { size: string, default: string, forcedefault?: string } = { size: '48', default: 'mm' }

  if (!email) {
    opts.forcedefault = 'y'
  }

  return gravatar.url(email, opts, true)
}

const props = defineProps<{
  gql: HeaderBarFragment,
  showBrowsers?: Boolean
}>()

</script>
