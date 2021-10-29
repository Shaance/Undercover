<script lang="ts">
  import {
    undercoverCount,
    mrWhiteCount,
    playerStore,
    sendMessage,
    roomId,
  } from "./store";
  import { getStartGamePayload } from "./wsHelper";
  import Toast from './Toast.svelte';

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
    if (canStartGame($undercoverCount, $mrWhiteCount, $playerStore.length)) {
      sendMessage(getStartGamePayload($roomId));
    } else {
      // @ts-ignore
      window.pushToast('Must have minimum 3 players with 2 normal players to start the game');
    }
  }
</script>

<button class="btn btn-light" on:click={startGame}>
  Start
</button>
<Toast />
