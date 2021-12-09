<template>
  <CreateSpecCard
    :disabled="disabled"
    :header="t('createSpec.component.importFromStory.header')"
    :description="disabled ?
      t('createSpec.component.importFromStory.notSetupDescription') :
      t('createSpec.component.importFromStory.description')"
    :icon="BookCodeIcon"
  />
</template>

<script lang="ts" setup>
import CreateSpecCard from '../../CreateSpecCard.vue'
import { useI18n } from '@cy/i18n'
import BookCodeIcon from '~icons/cy/book-code_x48'

const { t } = useI18n()

defineProps<{
  disabled: boolean
}>()

</script>
