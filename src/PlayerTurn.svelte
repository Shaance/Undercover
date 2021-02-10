<script lang="ts">
  import { currentPlayerTurn, playerId } from "./store";

  $: turnText = getText($currentPlayerTurn);

  function getText(currentPlayer: string) {
    if ($playerId === currentPlayer) {
      return `It's your turn!`;
    }
    return `It's ${currentPlayer}'s turn`;
  }
</script>

<main>
  <h2>{turnText}</h2>
</main>

<style>
  h2 {
    font-size: 1.3em;
    font-weight: 350;
  }

  main {
    margin-top: 30px;
    margin-bottom: 50px;
  }
</style>
