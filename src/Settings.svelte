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
  }

  p {
    display: inline-block;
  }
</style>

<main>
  <h3> Settings </h3>
  <p>Undercover(s): {$undercoverCount}</p>
  <button on:click={() => updateValue('undercover', 'increment')}> + </button>
  <button on:click={() => updateValue('undercover', 'decrement')}> - </button>
  <br>
  <p>Mr White(s): {$mrWhiteCount}</p>
  <button on:click={() => updateValue('white', 'increment')}> + </button>
  <button on:click={() => updateValue('white', 'decrement')}> - </button>
</main>