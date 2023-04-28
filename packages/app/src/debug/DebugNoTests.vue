<template>
  <Alert
    :title="t('debugPage.incomplete')"
    status="warning"
    :icon="ErrorOutlineIcon"
    class="flex flex-col mb-[24px] w-full"
  >
    {{ t('debugPage.runHasNoTests') }}
  </Alert>
</template>

<script lang="ts" setup>
import ErrorOutlineIcon from '~icons/cy/status-errored-outline_x16.svg'
import Alert from '@cy/components/Alert.vue'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()

</script>
