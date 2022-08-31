<script>
import { messageStore } from './store'

let message;

messageStore.subscribe((value) => {
  message = value
})

function handleChange(event) {
  messageStore.update(() => {
    return event.target.value
  })
}

</script>

<h1>{message}</h1>
<input on:keyup={handleChange} value={message} />