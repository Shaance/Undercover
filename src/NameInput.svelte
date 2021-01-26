<script>
  import { addPlayer, playerId } from "./store.js";
  import { wrapAddPlayerPayload } from "./wsHelper";
  let message = "";

  function handleClick() {
    if (message.length > 0) {
      addPlayer(wrapAddPlayerPayload(message));
      playerId.set(message);
    }
  }

</script>

<main>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label> Input name </label>
  <input type="text" bind:value={message} />
  <button on:click={handleClick}> OK </button>
</main>

<style>
  label {
    display: inline-block;
  }
</style>
