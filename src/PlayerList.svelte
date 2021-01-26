<script lang="ts">
  import { playerStore, playerId } from './store';
  $: players = $playerStore;
</script>

<main>
  <h1> My id {$playerId} </h1>
  <h2> Connected players </h2>
  <ul>
    {#each players as player}
      <li> {player} </li>
    {/each}
  </ul>
</main>