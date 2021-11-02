<template>
  <div v-if="!backendInitialized">
    Loading...
  </div>
  <div
    v-else
    class="h-full mx-auto bg-white"
    @click="handleLinkTargetBlank"
  >
    <Main />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { gql, useMutation, useQuery } from '@urql/vue'
import Main from './Main.vue'
import { AppQueryDocument, App_DevRelaunchDocument,
  App_OpenExternalDocument,
} from './generated/graphql'

gql`
query AppQuery {
  app {
    __typename
  }
  dev {
    needsRelaunch
  }
}
`

gql`
mutation App_DevRelaunch($action: DevRelaunchAction!) {
  devRelaunch(action: $action)
}
`

gql`
mutation App_OpenExternal ($url: String!) {
  openExternal(url: $url)
}
`

const relaunchMutation = useMutation(App_DevRelaunchDocument)
const openExternalMutation = useMutation(App_OpenExternalDocument)

/**
 * Sometimes the electron app can start before the GraphQL
 * server and current project has been initialized.
 * We poll until those conditions are met, then render the app
 */
const query = useQuery({
  query: AppQueryDocument,
  requestPolicy: 'cache-and-network',
})

let interval: number
const poll = () => {
  try {
    if (backendInitialized.value) {
      window.clearInterval(interval)
    } else {
      query.executeQuery()
    }
  } catch (e) {
    // probably graphql server has not initialized yet
  }
}

let isShowingRelaunch = ref(false)

const toast = useToast()

watch(query.data, () => {
  if (query.data.value?.dev.needsRelaunch && !isShowingRelaunch.value) {
    isShowingRelaunch.value = true
    toast.info('Server updated, click to relaunch', {
      timeout: false,
      onClick: () => {
        relaunchMutation.executeMutation({ action: 'trigger' })
      },
      onClose: () => {
        isShowingRelaunch.value = false
        relaunchMutation.executeMutation({ action: 'dismiss' })
      },
    })
  }
})

interval = window.setInterval(poll, 200)

const backendInitialized = computed(() => !!query.data?.value?.app)

const handleLinkTargetBlank = (event) => {
  if (event.target.href && event.target.target === '_blank') {
    event.preventDefault()
    // TODO - use a mutation to open these links in the default user browser
  }
}

document.addEventListener('click', (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const anchor = target.closest('a[href]') as HTMLAnchorElement

  if (anchor) {
    const destination = anchor.href

    if (destination.startsWith('/')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    openExternalMutation.executeMutation({ url: anchor.href })
  }
})

</script>

<style lang="scss">
html,
body,
#app {
  @apply h-full bg-white;
}

@font-face {
  font-family: "Fira Code";
  src: local("Fira Code"),
   url('../../frontend-shared/src/assets/fonts/FiraCode-VariableFont_wght.ttf') format("truetype");
}
</style>
