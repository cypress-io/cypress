<template>
  <CreateSpecCard
    :disabled="disabled"
    :header="t('createSpec.e2e.importTemplateSpec.header')"
    :description="t('createSpec.e2e.importTemplateSpec.description')"
    :icon="DocumentCodeIcon"
  />
</template>

<script lang="ts" setup>
import CreateSpecCard from '../../CreateSpecCard.vue'
import { useI18n } from '@cy/i18n'
import DocumentCodeIcon from '~icons/cy/document-code_x48'

const { t } = useI18n()

defineProps<{
  disabled?: boolean
}>()

</script>
