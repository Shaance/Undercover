<script lang="ts">
  import { onMount } from 'svelte';
  import EndGameText from './EndGameText.svelte';
  import MrWhiteGuess from './MrWhiteGuess.svelte';
  import { playerId, playersWhoVoted, playingState, sendMessage, votedOutPlayers, voteEnded, voteResult } from "./store";
  import { getGameInfoPayload } from './wsHelper';
  import { Status } from './wsTypes';

  $: isDraw = $voteResult.result === 'DRAW';
  $: detail = $voteResult.voteDetails;
  $: text = isDraw
    ? 'It is a draw! 🙃'
    : `${$voteResult.playerOut} (${$voteResult.playerOutRole}) has been eliminated! ☠️`;

  $: gameState = $voteResult.gameState;
  $: playerOut = $voteResult.playerOut;
  $: btnText = getBtnText(gameState, $voteResult.result);

  $: waitingForMrWhiteGuess = gameState === Status.MR_WHITE_GUESS_WAITING;

  $: if(finishedState(gameState)) {
    voteEnded.set(false);
    votedOutPlayers.set([]);
  }

  function handleClick(gameState: Status) {
    if (isDraw) {
      voteEnded.set(false);
      playingState.set('voting');
    } else if (finishedState(gameState)) {
      sendMessage({
        topic: 'game',
        subtopic: 'start'
      });
      playingState.set('started');
    } else {
      // sync with server on player turn
      sendMessage(getGameInfoPayload());
      votedOutPlayers.set([...$votedOutPlayers, $voteResult.playerOut]);
      playingState.set('started');
      voteEnded.set(false);
    }
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
</style>

<main>
  <h2>Vote result</h2>

  {#each detail as pair}
    <p>{`${pair[0]}: ${pair[1]}`}</p>
  {/each}

  <h3> {text} </h3>
  {#if finishedState(gameState)}
    <EndGameText />
  {:else if waitingForMrWhiteGuess}
    {#if playerOut !== $playerId}
      <h3> Waiting for Mr white's guess...</h3>
    {:else}
      <MrWhiteGuess />
    {/if}
  {/if}
  <br>
  <button disabled="{waitingForMrWhiteGuess}" on:click={() => handleClick(gameState)}> {btnText} </button>
</main>