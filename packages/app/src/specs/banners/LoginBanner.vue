<template>
  <TrackedBanner
    :banner-id="bannerId"
    :model-value="modelValue"
    data-cy="login-banner"
    status="info"
    :title="t('specPage.banners.login.title')"
    class="mb-16px"
    :icon="ConnectIcon"
    dismissible
    :has-banner-been-shown="hasBannerBeenShown"
    :event-data="{
      campaign: 'Log In',
      medium: 'Specs Login Banner',
      cohort: cohortOption.cohort
    }"
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <p class="mb-24px">
      {{ cohortOption.value }}
    </p>

    <Button
      :prefix-icon="ConnectIcon"
      class="mt-24px"
      data-cy="login-button"
      @click="handleButtonClick"
    >
      {{ t('specPage.banners.login.buttonLabel') }}
    </Button>
    <LoginModal
      v-if="loginModalQuery.data.value"
      v-model="isLoginOpen"
      :gql="loginModalQuery.data.value"
      utm-medium="Specs Login Banner"
      :utm-content="cohortOption.cohort"
    />
  </TrackedBanner>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { gql, useQuery } from '@urql/vue'
import ConnectIcon from '~icons/cy/chain-link_x16.svg'
import { useI18n } from '@cy/i18n'
import Button from '@cy/components/Button.vue'
import { LoginBannerDocument } from '../../generated/graphql'
import TrackedBanner from './TrackedBanner.vue'
import type { CohortOption } from '@packages/frontend-shared/src/composables/useCohorts'
import { BannerIds } from '@packages/types'
import LoginModal from '@cy/gql-components/topnav/LoginModal.vue'

gql`
query LoginBanner {
  ...LoginModal
}
`

defineProps<{
  modelValue: boolean
  hasBannerBeenShown: boolean
  cohortOption: CohortOption
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const { t } = useI18n()
const bannerId = BannerIds.ACI_082022_LOGIN
const isLoginOpen = ref(false)
const loginModalQuery = useQuery({ query: LoginBannerDocument, pause: true })

async function handleButtonClick () {
  await loginModalQuery.executeQuery()
  isLoginOpen.value = true
}

</script>
