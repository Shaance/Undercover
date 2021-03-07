<script lang="ts">
  import { roomId, sendMessage } from "./store";
  import { getStartGamePayload } from "./wsHelper";

  function handleClick() {
    sendMessage(getStartGamePayload($roomId));
  }
</script>

<button on:click={handleClick}> Skip word </button>
