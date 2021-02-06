<script lang="ts">
  import PlayersGrid from './PlayersGrid.svelte';
  import PlayerTurn from './PlayerTurn.svelte';
  import Word from './Word.svelte';
  import WordInput from './WordInput.svelte';
  import statefulSwap from "./statefulSwap"
  import { fly } from 'svelte/transition';
  import { playingState } from './store';
  import Vote from './Vote.svelte';

  const { onOutro, transitionTo, state } = statefulSwap("started");

  $: if ($playingState) {
    transitionTo($playingState);
  }
</script>

<main>
  {#if $state === "started"}
  <div out:fly="{{ y: 500, duration: 300 }}"
    in:fly="{{ y: 500, duration: 300 }}"
    on:outroend={onOutro}>
    <Word />
    <PlayerTurn />
    <WordInput />
    <br>
    <PlayersGrid />
  </div>
  {/if}

  {#if $state === "voting"}
  <div out:fly="{{ y: 500, duration: 300 }}"
    in:fly="{{ y: 500, duration: 300 }}"
    on:outroend={onOutro}>
    <Vote />
  </div>
  {/if}
  
</main>