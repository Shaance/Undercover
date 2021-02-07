<script>
  import VotePicker from "./VotePicker.svelte";
  import statefulSwap from "./StatefulSwap";
  import HasVoted from './HasVoted.svelte';
  import PlayersGrid from './PlayersGrid.svelte';
  import { hasVoted, voteEnded } from './store';
  import { fade } from 'svelte/transition';
  import WaitingForVote from "./WaitingForVote.svelte";
  import VoteResult from "./VoteResult.svelte";

  const { onOutro, transitionTo, state } = statefulSwap("init");

  $: if ($hasVoted) {
    transitionTo('voted');
  }

  $: if ($voteEnded) {
    transitionTo('result');
  }
</script>

<main>
  {#if $state === "init"}
    <div in:fade out:fade on:outroend={onOutro}>
      <VotePicker />
      <HasVoted />
      <PlayersGrid />
    </div>
  {/if}
  {#if $state === "voted"}
    <div in:fade on:outroend={onOutro} out:fade>
      <WaitingForVote />
      <HasVoted />
    </div>
  {/if}
  {#if $state === "result"}
    <div in:fade on:outroend={onOutro} out:fade>
      <VoteResult />
    </div>
  {/if}
</main>
