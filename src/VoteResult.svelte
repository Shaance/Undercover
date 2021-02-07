<script lang="ts">
  import { onMount } from 'svelte';
  import { playersWhoVoted, playingState, voteEnded, voteResult } from "./store";

  $: isDraw = $voteResult.result === 'DRAW';
  $: detail = $voteResult.voteDetails;
  $: text = isDraw
    ? 'It is a draw! 🙃'
    : `${$voteResult.playerOut} has been voted out! ☠️`;

  $: btnText = isDraw
    ? 'Vote again!'
    : `Next turn`;

  function handleClick() {
    if (isDraw) {
      voteEnded.set(false);
      playingState.set('voting');
    } else {
      playingState.set('started');
    }
  }

  onMount(() => {
    playersWhoVoted.set([]);
  })
</script>

<style>
  h2 {
    color:darkslateblue;
    font-size: 1.5em;
    font-weight: 350;
  }

  h3 {
    font-size: 1.3em;
    font-weight: 250;
  }
</style>

<main>
  <h2>Vote result</h2>

  {#each detail as pair}
    <p>{`${pair[0]}: ${pair[1]}`}</p>
  {/each}

  <h3> {text} </h3>
  <br>
  <button on:click={handleClick}> {btnText} </button>
</main>