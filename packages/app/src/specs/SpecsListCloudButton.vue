<template>
  <Button
    v-if="!!buttonOptions.text"
    data-cy="cloud-button"
    variant="link"
    :prefix-icon="buttonOptions.icon"
    :disabled="!buttonOptions.emits"
    prefix-icon-class="icon-light-indigo-500 icon-dark-indigo-500"
    @click.stop.prevent="handleClick"
  >
    {{ buttonOptions.text }}
  </Button>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import PlayIcon from '~icons/cy/play-small_x16.svg'
import { computed } from 'vue'
import { gql } from '@urql/vue'
import type { SpecCloudDataHoverButtonFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

const emits = defineEmits<{
  (eventName: 'showLogin'): void
  (eventName: 'showConnectToProject'): void
  (eventName: 'requestAccess'): void
}>()

const props = defineProps<{
  gql: SpecCloudDataHoverButtonFragment
}>()

gql`
fragment SpecCloudDataHoverButton on Query {
  currentProject {
    id
    cloudProject{
      __typename
      ... on CloudProjectUnauthorized {
        hasRequestedAccess
      }
    }
  }
  ...Auth
  ...CloudConnectModals
  ...RequestAccessButton
}
`

const projectConnectionStatus = computed(() => {
  if (!props.gql.cloudViewer) return 'LOGGED_OUT'

  if (!props.gql.currentProject?.cloudProject?.__typename) return 'NOT_CONNECTED'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectNotFound') return 'NOT_FOUND'

  if (props.gql.currentProject?.cloudProject?.__typename === 'CloudProjectUnauthorized') {
    if (props.gql.currentProject?.cloudProject?.hasRequestedAccess) {
      return 'ACCESS_REQUESTED'
    }

    return 'UNAUTHORIZED'
  }

  return 'CONNECTED'
})

type ButtonOptions = {
  text: string
  icon: FunctionalComponent<SVGAttributes>
  emits: 'showLogin' | 'showConnectToProject' | 'requestAccess'
}

const VALUES = {
  LOGGED_OUT: {
    text: t('specPage.hoverButton.connect'),
    icon: UserIcon,
    emits: 'showLogin',
  },
  NOT_CONNECTED: {
    text: t('specPage.hoverButton.connectProject'),
    icon: ChainIcon,
    emits: 'showConnectToProject',
  },
  NOT_FOUND: {
    text: t('specPage.hoverButton.connectProject'),
    icon: ChainIcon,
    emits: 'showConnectToProject',
  },
  UNAUTHORIZED: {
    text: t('specPage.hoverButton.requestAccess'),
    icon: PlayIcon,
    emits: 'requestAccess',
  },
  ACCESS_REQUESTED: {
    text: t('specPage.hoverButton.requestSent'),
    icon: PlayIcon,
  },
}

const buttonOptions = computed(() => {
  const options: ButtonOptions = {
    text: VALUES[projectConnectionStatus.value]?.text,
    icon: VALUES[projectConnectionStatus.value]?.icon,
    emits: VALUES[projectConnectionStatus.value]?.emits,
  }

  return options
})

const handleClick = () => {
  switch (projectConnectionStatus.value) {
    case 'LOGGED_OUT':
      emits('showLogin')
      break
    case 'NOT_CONNECTED':
    case 'NOT_FOUND':
      emits('showConnectToProject')
      break
    case 'UNAUTHORIZED':
      emits('requestAccess')
      break
    default:
      return
  }
}

</script>
