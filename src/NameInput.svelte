<script>
  import { sendMessage, playerId, playerStore, connectionOpened } from "./store.js";
  import { getPlayersPayload, wrapAddPlayerPayload } from "./wsHelper";
  
  let message = "";

  $: players = $playerStore;
  $: if ($connectionOpened) {
    sendMessage(getPlayersPayload());
  }

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
  <br>
  <input type="text" bind:value={message} on:keyup|preventDefault={handleKeyup}/>
  <button on:click={handleClick}> OK </button>
</main>

