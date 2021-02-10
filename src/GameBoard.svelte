<script lang="ts">
  import PlayersGrid from './PlayersGrid.svelte';
  import PlayerTurn from './PlayerTurn.svelte';
  import Word from './Word.svelte';
  import WordInput from './WordInput.svelte';
  import statefulSwap from "./StatefulSwap"
  import { fly } from 'svelte/transition';
  import { currentTurn, playerLost, playingState } from './store';
  import VoteScreen from './VoteScreen.svelte';
  import WaitForGameCompletion from './WaitForGameCompletion.svelte';
  import SkipWord from './SkipWord.svelte';

  const { onOutro, transitionTo, state } = statefulSwap("first");

  $: if ($currentTurn === 0) {
    transitionTo("first");
  } else if ($playingState === "voting") {
    transitionTo($playingState);
  } else if ($playingState === "started") {
    transitionTo($playingState);
  }
</script>

<main>
  {#if $state === "first"}
    <div out:fly="{{ y: 500, duration: 300 }}"
      in:fly="{{ y: 500, duration: 300 }}"
      on:outroend={onOutro}>
      <Word />
      <PlayerTurn />
      <WordInput />
      <br>
      <SkipWord />
    </div>
  {/if}
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