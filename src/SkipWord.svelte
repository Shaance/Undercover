<script lang="ts">
  import { sendMessage } from "./store";
  function handleClick() {
    sendMessage({
      topic: "game",
      subtopic: "start",
    });
  }
</script>

<button on:click={handleClick}> Skip word </button>
