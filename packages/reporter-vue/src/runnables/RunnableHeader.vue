<template>
  <header data-cy="runnable-header">
    <i class="fas fa-file fa-sm"></i>
    <Tooltip :content="text.openInIDE">
      <a href="#"><slot></slot></a>
    </Tooltip>
  </header>
</template>

<script lang="ts" setup>
import text from '../i18n'
import {Tooltip} from '../header/Tooltip'

</script>

<style lang="scss" scoped>
@use '../variables-reporter.scss';

header {
  background: rgba(200,200,200, 0.3);
  padding: 0.75rem;
  display: block;
  position: relative;
  box-shadow: 0 8px 6px -6px #bbb;
  border-top: 1px solid #dadada;

}
a {
  color: #3380FF;
  text-decoration: none;
  outline: none;
}

i {
  color: rgba(100,100,100, 0.4)
}
</style>