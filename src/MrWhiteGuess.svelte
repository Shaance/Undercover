<script lang="ts">
  import { sendMessage, roomId } from "./store";
  import { guessWordPayload } from "./wsHelper";

  let message = "";

  function handleClick() {
    const trimmedWord = message.trim();
    if (trimmedWord.length > 0) {
      sendMessage(guessWordPayload(trimmedWord, $roomId));
    }
  }

  function focus(el) {
    el.focus();
  }

  function handleKeyup() {
    // @ts-ignore
    if (event.code === "Enter") {
      handleClick();
    }
  }
</script>

<main>
  <h3>Try to guess the word to win!</h3>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <input
    type="text"
    size="15"
    use:focus
    bind:value={message}
    on:keyup|preventDefault={handleKeyup}
  />
  <button class="btn btn-light" on:click={handleClick}> Guess </button>
</main>

<style>
  h3 {
    font-size: 1.3em;
    font-weight: 250;
  }
</style>
