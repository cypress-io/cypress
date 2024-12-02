<script>
import { getContext } from 'svelte'

const { msg } = getContext('myKey')
</script>

<h1>{msg}</h1>
