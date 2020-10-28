<template>
  <aside id="evergreen">
    <SpecList :specs="specs"/>

    <!-- Plugins will be mounted in here. Perhaps later on -->
    <section id="plugins"></section>
    <footer id="evergreen-footer" />
  </aside>
</template>

<script>
  import SpecList from './SpecList'
  export default {
    components: { SpecList },
    props: {
      specs: { type: [Object, Array], default: () => ({}) }
    }
  }
</script>
