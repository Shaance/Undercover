<script lang="ts">
  import { currentPlayerTurn, playerId } from "./store";
  
  $: turnText = getText($currentPlayerTurn);

  function getText(currentPlayer: string) {
    if ($playerId === currentPlayer) {
      return `It's your turn!`
    }
    return `It's ${currentPlayer}'s turn`
  }
</script>

<main>
  <p> {turnText} </p>
</main>