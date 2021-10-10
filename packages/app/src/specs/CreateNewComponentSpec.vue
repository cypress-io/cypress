<template>
    <CreateSpecCard
    :icon="BookCodeIcon"
    :header="t('createSpec.component.importFromStory.header')"
    :description="t('createSpec.component.importFromStory.description')"/>
    <CreateSpecCard
    :icon="DocumentCodeIcon"
    :header="t('createSpec.component.importFromComponent.header')"
    :description="t('createSpec.component.importFromComponent.description')"/>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import CreateSpecCard from './CreateSpecCard.vue'
import BookCodeIcon from '~icons/cy/book-code_x48'
import DocumentCodeIcon from '~icons/cy/document-code_x48'
import { useI18n } from '@cy/i18n'

const { t } = useI18n()
</script>