<script lang="ts">
  import { undercoverCount, mrWhiteCount, playerStore, sendMessage } from './store';

  $: playerNumbers = $playerStore.length;
  $: disabledButton = !canStartGame($undercoverCount, $mrWhiteCount, playerNumbers);

  // don't really know the proper rules so meh
  function canStartGame(ucCount: number, mrWhiteCount: number, playerNumber: number): boolean {
    let specialCharacterCount = ucCount + mrWhiteCount;
    const otherCount = playerNumber - specialCharacterCount;
    if (playerNumber < 3 || specialCharacterCount === 0 || specialCharacterCount >= playerNumber) {
      return false;
    }

    return otherCount >= 2;
  }

  function startGame() {
    sendMessage({
      topic: 'game',
      subtopic: 'start'
    });
  }
</script>

<button disabled="{disabledButton}" on:click={startGame}>
  Start
</button>