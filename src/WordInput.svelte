<script lang="ts">
  import { currentPlayerTurn, playerId, sendMessage, usedWords } from './store';
  import { getAddWordPayload } from './wsHelper';

  $: disabledButton = $currentPlayerTurn !== $playerId;

  let message = '';

  // TODO check if word not already seen
  function handleClick() {
    const trimmedWord = message.trim();
    if (trimmedWord.length > 0) {
      if ($usedWords.has(trimmedWord.toLowerCase())) {
        alert(`${trimmedWord} has already been used!`);
      } else {
        sendMessage(getAddWordPayload(trimmedWord));
      }
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

<style>
  main {
    font-size: 1em;
		font-weight: 200;
  }
  input {
    margin-bottom: 20px;
  }
</style>

<main>
    <!-- svelte-ignore a11y-label-has-associated-control -->
    <input type="text" bind:value={message} on:keyup|preventDefault={handleKeyup}/>
    <button disabled="{disabledButton}" on:click={handleClick}> Describe </button>
</main>