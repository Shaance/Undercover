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

  p {
    display: inline-block;
  }
</style>

<main>
  <h3> Settings </h3>
  <button on:click={() => updateValue('undercover', 'increment')}> + </button>
  <button on:click={() => updateValue('undercover', 'decrement')}> - </button>
  <p>Undercover(s): {$undercoverCount}</p>
  <br>
  <button on:click={() => updateValue('white', 'increment')}> + </button>
  <button on:click={() => updateValue('white', 'decrement')}> - </button>
  <p>Mr White(s): {$mrWhiteCount}</p>
</main>