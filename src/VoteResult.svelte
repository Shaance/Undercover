<script lang="ts">
  import { onMount } from "svelte";
  import EndGameText from "./EndGameText.svelte";
  import MrWhiteGuess from "./MrWhiteGuess.svelte";
  import {
    playerId,
    playersWhoVoted,
    playingState,
    sendMessage,
    votedOutPlayers,
    voteResult,
    roomId,
  } from "./store";
  import { getGameInfoPayload, getStartGamePayload } from "./wsHelper";
  import { Status } from "./wsTypes";

  $: isDraw = $voteResult.result === "DRAW";
  $: detail = $voteResult.voteDetails;
  $: text = isDraw
    ? "It is a draw! 🙃"
    : `${$voteResult.playerOut} (${$voteResult.playerOutRole}) has been eliminated! ☠️`;

  $: gameState = $voteResult.gameState;
  $: playerOut = $voteResult.playerOut;
  $: btnText = getBtnText(gameState, $voteResult.result);

  $: waitingForMrWhiteGuess = gameState === Status.MR_WHITE_GUESS_WAITING;

  $: if (finishedState(gameState)) {
    votedOutPlayers.set([]);
  }

  function handleClick(gameState: Status) {
    if (isDraw) {
      playingState.set("voting");
    } else if (finishedState(gameState)) {
      sendMessage(getStartGamePayload($roomId));
      playingState.set("started");
    } else {
      // sync with server on player turn
      sendMessage(getGameInfoPayload($roomId));
      votedOutPlayers.set([...$votedOutPlayers, $voteResult.playerOut]);
      playingState.set("started");
    }
  }

  function getBtnText(state: Status, voteResult: string) {
    if (finishedState(state)) {
      return "Play again";
    }
    return voteResult === "DRAW" ? "Vote again!" : "Next turn";
  }

  const finishedState = (state: Status) =>
    state === Status.WON || state === Status.LOST;

  onMount(() => {
    playersWhoVoted.set([]);
  });
</script>

<main>
  <h2 class="blue-main">Vote result</h2>

  {#each detail as [name, votesAgainst]}
    <p>{`${name}: ${Array(votesAgainst).fill('❌').join('')}`}</p>
  {/each}
  <br />
  <br />
  <h3>{text}</h3>
  {#if finishedState(gameState)}
    <EndGameText />
  {:else if waitingForMrWhiteGuess}
    {#if playerOut !== $playerId}
      <h3>Waiting for Mr white's guess...</h3>
    {:else}
      <MrWhiteGuess />
    {/if}
  {/if}
  <br />
  <button
    class="btn btn-light"
    disabled={waitingForMrWhiteGuess}
    on:click={() => handleClick(gameState)}
  >
    {btnText}
  </button>
</main>

<style>
  h2 {
    font-size: 2em;
    font-weight: 500;
    margin-bottom: 30px;
  }

  h3 {
    font-size: 1.3em;
    font-weight: 250;
    margin-bottom: 40px;
  }

  p {
    font-size: 1em;
  }
</style>
