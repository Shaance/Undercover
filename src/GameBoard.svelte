<script lang="ts">
  import PlayersGrid from './PlayersGrid.svelte';
  import PlayerTurn from './PlayerTurn.svelte';
  import Word from './Word.svelte';
  import WordInput from './WordInput.svelte';
  import statefulSwap from "./StatefulSwap"
  import { fly } from 'svelte/transition';
  import { playerLost, playingState } from './store';
  import VoteScreen from './VoteScreen.svelte';
  import WaitForGameCompletion from './WaitForGameCompletion.svelte';

  const { onOutro, transitionTo, state } = statefulSwap("started");

  $: if ($playingState === "voting") {
    transitionTo($playingState);
  } else if ($playingState === "started") {
    transitionTo($playingState);
  }
</script>

<main>
  {#if $state === "started"}
    <div out:fly="{{ y: 500, duration: 300 }}"
      in:fly="{{ y: 500, duration: 300 }}"
      on:outroend={onOutro}>
      {#if $playerLost}
        <WaitForGameCompletion />
        <Word />
        <PlayerTurn />
      {:else}
        <Word />
        <PlayerTurn />
        <WordInput />
      {/if}
        <br>
        <PlayersGrid />
    </div>
  {/if}

  {#if $state === "voting"}
    <div out:fly="{{ y: 500, duration: 300 }}"
      in:fly="{{ y: 500, duration: 300 }}"
      on:outroend={onOutro}>
      <VoteScreen />
    </div>
  {/if}
  
</main>