<script>
  import { sendMessage, playerId, playerStore } from "./store.js";
  import { wrapAddPlayerPayload } from "./wsHelper";
  let message = "";

  $: players = $playerStore;

  function handleClick() {
    if (message.length > 0) {
      if (players.indexOf(message) === -1) {
        sendMessage(wrapAddPlayerPayload(message));
        playerId.set(message);
      } else {
        alert('This name has already been picked!');
      }
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
