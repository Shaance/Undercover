<script lang="ts">
  import { roomId } from "./store.js";
  import Toast from './Toast.svelte';

  function copyRoomId() {
    navigator.clipboard.writeText($roomId)
    .then(
      // @ts-ignore
      () => window.pushToast("Copied room ID to clipboard!"),
      (err) => console.error("Async: Could not copy text: ", err)
    );
  }
</script>

<main>
  <h2 class="blue-main">Room ID: {$roomId} &nbsp;</h2>
  <button id="liveToastBtn" data-bs-toggle="tooltip" data-bs-placement="top" title="Copy room ID" on:click={copyRoomId}>
    <i class="far fa-copy"/>
  </button>
  <Toast retainMs={1000} />
</main>

<style>
  h2 {
    display: inline-block;
    font-size: 1.2em;
    font-weight: 150;
  }

  button {
    border: 0;
  }
</style>
