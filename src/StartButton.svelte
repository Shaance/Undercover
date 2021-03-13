<script lang="ts">
  import {
    undercoverCount,
    mrWhiteCount,
    playerStore,
    sendMessage,
    roomId,
  } from "./store";
  import { getStartGamePayload } from "./wsHelper";

  $: disabledButton = !canStartGame(
    $undercoverCount,
    $mrWhiteCount,
    $playerStore.length
  );

  // don't really know the proper rules so meh
  function canStartGame(
    ucCount: number,
    mrWhiteCount: number,
    playerNumber: number
  ): boolean {
    let specialCharacterCount = ucCount + mrWhiteCount;
    const otherCount = playerNumber - specialCharacterCount;
    if (
      playerNumber < 3 ||
      specialCharacterCount === 0 ||
      specialCharacterCount >= playerNumber
    ) {
      return false;
    }

    return otherCount >= 2;
  }

  function startGame() {
    sendMessage(getStartGamePayload($roomId));
  }
</script>

<button class="btn btn-light" disabled={disabledButton} on:click={startGame}> Start </button>
