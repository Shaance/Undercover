<script lang="ts">
  import VotePicker from "./VotePicker.svelte";
  import statefulSwap from "./StatefulSwap";
  import HasVoted from "./HasVoted.svelte";
  import PlayersGrid from "./PlayersGrid.svelte";
  import { hasVoted, playersWhoVoted, playerLost, playingState } from "./store";
  import { fade } from "svelte/transition";
  import WaitingForVote from "./WaitingForVote.svelte";
  import VoteResult from "./VoteResult.svelte";

  const { onOutro, transitionTo, state } = statefulSwap("init");

  $: if ($playingState === "voting" && !$hasVoted) {
    console.log("Vote init!!");
    transitionTo("init");
  } else if ($playingState === "result") {
    console.log("Showing result!!");
    transitionTo("result");
  } else {
    console.log(`$hasVoted: ${$hasVoted}, playingState: ${$playingState}.
    $playersWhoVoted: ${$playersWhoVoted}`);
    console.log("has voted!!");
    transitionTo("voted");
  }
</script>

<main>
  {#if $state === "init"}
    <div in:fade out:fade on:outroend={onOutro}>
      {#if !$playerLost}
        <VotePicker />
        <br/>
        <br/>
      {/if}
      <PlayersGrid />
      <HasVoted />
    </div>
  {:else if $state === "voted"}
    <div in:fade on:outroend={onOutro} out:fade>
      <WaitingForVote />
      <HasVoted />
    </div>
  {:else if $state === "result"}
    <div in:fade on:outroend={onOutro} out:fade>
      <VoteResult />
    </div>
  {/if}
</main>
