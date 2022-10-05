<template>
  <CreateSpecCard
    :disabled="disabled"
    :header="t('createSpec.e2e.importFromScaffold.header')"
    :description="t('createSpec.e2e.importFromScaffold.description')"
    :icon="BoxOpenIcon"
  />
</template>

<script lang="ts" setup>
import CreateSpecCard from '../../CreateSpecCard.vue'
import { useI18n } from '@cy/i18n'
import BoxOpenIcon from '~icons/cy/box-open_x48'

const { t } = useI18n()

defineProps<{
  disabled?: boolean
}>()

</script>
