<script>
  import { sendMessage, playerId } from "./store.js";
  import { wrapAddPlayerPayload } from "./wsHelper";
  let message = "";

  function handleClick() {
    if (message.length > 0) {
      sendMessage(wrapAddPlayerPayload(message));
      playerId.set(message);
    }
  }

  function handleKeyup() {
    if (event.code === 'Enter') {
			handleClick();
		}
  }

</script>

<main>
  <!-- svelte-ignore a11y-label-has-associated-control -->
  <label> Input name </label>
  <input type="text" bind:value={message} on:keyup|preventDefault={handleKeyup}/>
  <button on:click={handleClick}> OK </button>
</main>

<style>
  label {
    display: inline-block;
  }
</style>
