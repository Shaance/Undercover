<script lang="ts">
  import PlayersGrid from "./PlayersGrid.svelte";
  import PlayerTurn from "./PlayerTurn.svelte";
  import Word from "./Word.svelte";
  import WordInput from "./WordInput.svelte";
  import statefulSwap from "./StatefulSwap";
  import { fly, fade } from "svelte/transition";
  import { currentTurn, playerLost, playingState } from "./store";
  import VoteScreen from "./VoteScreen.svelte";
  import WaitForGameCompletion from "./WaitForGameCompletion.svelte";
  import SkipWord from "./SkipWord.svelte";

  const { onOutro, transitionTo, state } = statefulSwap("first");

  $: if ($playingState === "voting") {
    console.log("voting");
    transitionTo($playingState);
  } else if ($currentTurn === 0) {
    console.log("first");
    transitionTo("first");
  } else if ($playingState === "started") {
    console.log("started");
    transitionTo($playingState);
  } else {
    console.log(`I'm nowhere...
    $playingState ${$playingState},
    $playingState ${$currentTurn},
    `);
  }
</script>

<main>
  {#if $state === "first"}
    <div out:fade in:fly={{ y: 500, duration: 500 }} on:outroend={onOutro}>
      <Word />
      <PlayerTurn />
      <WordInput />
      <br />
      <SkipWord />
    </div>
  {:else if $state === "started"}
    <div out:fly={{ x: -500, duration: 500 }} in:fade on:outroend={onOutro}>
      {#if $playerLost}
        <WaitForGameCompletion />
        <Word />
        <PlayerTurn />
      {:else}
        <Word />
        <PlayerTurn />
        <WordInput />
      {/if}
      <br />
      <PlayersGrid />
    </div>
  {:else if $state === "voting"}
    <div
      out:fly={{ y: 500, duration: 500 }}
      in:fly={{ x: 500, duration: 500 }}
      on:outroend={onOutro}
    >
      <VoteScreen />
    </div>
  {/if}
</main>
