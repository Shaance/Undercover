<script lang="ts">
  import { onMount } from 'svelte';
  import { undercoverCount, mrWhiteCount, sendMessage } from './store';
  import { createGetSettingsPayload } from './wsHelper';

  function updateValue(subtopic: string, data: string) {
    sendMessage({
      topic: 'settings',
      subtopic,
      data
    });
  }

  onMount(() => {
    sendMessage(createGetSettingsPayload());
  })

</script>

<style>
  button {
    display: inline-block;
    min-width: 30px;
  }

  div {
    display: inline-block;
    min-width: 50px;
  }

</style>

<main>
  <h3> Settings </h3>
  <p>Undercover</p>
  <button on:click={() => updateValue('undercover', 'decrement')}> {'<'} </button>
  <div>{$undercoverCount}</div>
  <button on:click={() => updateValue('undercover', 'increment')}> {'>'} </button>
  <p>Mr White</p>
  <button on:click={() => updateValue('white', 'decrement')}> {'<'} </button>
  <div>{$mrWhiteCount}</div>
  <button on:click={() => updateValue('white', 'increment')}> {'>'} </button>
</main>