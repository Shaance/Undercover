<script lang="ts">
  import { currentPlayerTurn, playerId, sendMessage } from './store';
  import { getAddWordPayload } from './wsHelper';

  $: disabledButton = $currentPlayerTurn !== $playerId;

  let message = '';

  // TODO check if word not already seen
  function handleClick() {
    if (message.length > 0) {
      sendMessage(getAddWordPayload(message));
      message = '';
    }
  }

  function handleKeyup() {
    // @ts-ignore
    if (event.code === 'Enter') {
			handleClick();
		}
  }
</script>

<main>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <input type="text" bind:value={message} on:keyup|preventDefault={handleKeyup}/>
    <button disabled="{disabledButton}" on:click={handleClick}> Describe </button>
</main>