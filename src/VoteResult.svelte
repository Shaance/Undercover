<script lang="ts">
  import { onMount } from 'svelte';
  import { playersWhoVoted, playingState, sendMessage, votedOutPlayers, voteEnded, voteResult } from "./store";
  import { getGameInfoPayload } from './wsHelper';
  import { Status } from './wsTypes';

  $: isDraw = $voteResult.result === 'DRAW';
  $: detail = $voteResult.voteDetails;
  $: text = isDraw
    ? 'It is a draw! 🙃'
    : `${$voteResult.playerOut} (${$voteResult.playerOutRole}) has been eliminated! ☠️`;

  $: gameState = $voteResult.gameState;
  $: btnText = getBtnText(gameState, $voteResult.result);

  function handleClick() {
    if (isDraw) {
      voteEnded.set(false);
      playingState.set('voting');
    } else {
      // sync with server on player turn
      sendMessage(getGameInfoPayload());
      votedOutPlayers.set([...$votedOutPlayers, $voteResult.playerOut]);
      playingState.set('started');
      voteEnded.set(false);
    }
  }

  function getEndGameText(state: Status) {
    const suffix = `won the game!`;
    if (state === Status.WON) {
      return `Cilivians ${suffix}`;
    }
    return `Vilains ${suffix}`;
  }

  function getBtnText(state: Status, voteResult: string) {
    if (finishedState(state)) {
      return 'Play again';
    }
    return voteResult === 'DRAW' ? 'Vote again!' : 'Next turn';
  }

  const finishedState = (state: Status) => state === Status.WON || state === Status.LOST;

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

  .end {
    margin-top: 30px;
    margin-bottom: 20px;
    font-size: 1.35em;
    font-weight: 350;
  }
</style>

<main>
  <h2>Vote result</h2>

  {#each detail as pair}
    <p>{`${pair[0]}: ${pair[1]}`}</p>
  {/each}

  <h3> {text} </h3>
  {#if finishedState(gameState)}
    <div class="end">{getEndGameText(gameState)}</div>
  {/if}
  <br>
  <button on:click={handleClick}> {btnText} </button>
</main>