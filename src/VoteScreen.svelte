<script>
  import VotePicker from "./VotePicker.svelte";
  import statefulSwap from "./statefulSwap";
  import HasVoted from './HasVoted.svelte';
  import PlayersGrid from './PlayersGrid.svelte';
  import { hasVoted } from './store';
  import { fade } from 'svelte/transition';
  import WaitingForVote from "./WaitingForVote.svelte";

  const { onOutro, transitionTo, state } = statefulSwap("init");

  $: if ($hasVoted) {
    transitionTo('voted');
  }
</script>

<main>
  {#if $state === "init"}
    <div out:fade on:outroend={onOutro}>
      <VotePicker />
      <HasVoted />
      <PlayersGrid />
    </div>
  {/if}
  {#if $state === "voted"}
    <div in:fade on:outroend={onOutro}>
      <WaitingForVote />
      <HasVoted />
    </div>
  {/if}
</main>
