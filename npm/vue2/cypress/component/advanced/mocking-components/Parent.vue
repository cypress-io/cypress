<template>
  <div class="a-parent">
    This is a parent component
    <child-component />
  </div>
</template>

<script>
import ChildComponent from './Child.vue'

export default {
  data () {
    return {}
  },
  components: {
      ChildComponent
  }
}
</script>
