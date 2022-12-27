<template>
  <Button
    data-cy="cloud-button"
    variant="linkBold"
    :prefix-icon="buttonOptions.icon"
    :disabled="!buttonOptions.emits"
    prefix-icon-class="icon-light-indigo-100 icon-dark-indigo-500"
    @click.stop.prevent="handleClick"
  >
    <span class="hidden lg:inline">{{ buttonOptions.text }}</span>
    <span class="lg:hidden">{{ buttonOptions.textShort }}</span>
  </Button>
</template>

<script setup lang="ts">
import Button from '@cy/components/Button.vue'
import type { FunctionalComponent, SVGAttributes } from 'vue'
import UserIcon from '~icons/cy/user-outline_x16.svg'
import ChainIcon from '~icons/cy/chain-link_x16.svg'
import PlayIcon from '~icons/cy/play-large_x16.svg'
import { computed } from 'vue'
import { gql } from '@urql/vue'
import type { SpecCloudDataHoverButtonFragment } from '../generated/graphql'
import { useI18n } from '@cy/i18n'

type ProjectConnectionStatus = 'NOT_FOUND' | 'LOGGED_OUT' | 'NOT_CONNECTED' | 'UNAUTHORIZED' | 'ACCESS_REQUESTED'

const { t } = useI18n()

const emits = defineEmits<{
  (eventName: 'showLoginConnect'): void
  (eventName: 'requestAccess'): void
}>()

const props = defineProps<{
  gql: SpecCloudDataHoverButtonFragment
  projectConnectionStatus: ProjectConnectionStatus
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
  ...RequestAccessButton
}
`

type ButtonOptions = {
  text: string
  textShort: string
  icon: FunctionalComponent<SVGAttributes>
  emits: 'showLoginConnect' | 'requestAccess' | undefined
}

const VALUES: Record<ProjectConnectionStatus, ButtonOptions> = {
  LOGGED_OUT: {
    text: t('specPage.hoverButton.connect'),
    textShort: t('specPage.hoverButton.connect'),
    icon: UserIcon,
    emits: 'showLoginConnect',
  },
  NOT_CONNECTED: {
    text: t('specPage.hoverButton.connectProject'),
    textShort: t('specPage.hoverButton.connectProjectShort'),
    icon: ChainIcon,
    emits: 'showLoginConnect',
  },
  NOT_FOUND: {
    text: t('specPage.hoverButton.connectProject'),
    textShort: t('specPage.hoverButton.connectProjectShort'),
    icon: ChainIcon,
    emits: 'showLoginConnect',
  },
  UNAUTHORIZED: {
    text: t('specPage.hoverButton.requestAccess'),
    textShort: t('specPage.hoverButton.requestAccessShort'),
    icon: PlayIcon,
    emits: 'requestAccess',
  },
  ACCESS_REQUESTED: {
    text: t('specPage.hoverButton.requestSent'),
    textShort: t('specPage.hoverButton.requestSentShort'),
    icon: PlayIcon,
    emits: undefined,
  },
}

const buttonOptions = computed(() => {
  const options: ButtonOptions = {
    text: VALUES[props.projectConnectionStatus].text,
    textShort: VALUES[props.projectConnectionStatus].textShort,
    icon: VALUES[props.projectConnectionStatus].icon,
    emits: VALUES[props.projectConnectionStatus].emits,
  }

  return options
})

const handleClick = () => {
  switch (props.projectConnectionStatus) {
    case 'LOGGED_OUT':
    case 'NOT_CONNECTED':
    case 'NOT_FOUND':
      emits('showLoginConnect')
      break
    case 'UNAUTHORIZED':
      emits('requestAccess')
      break
    default:
      return
  }
}

</script>
