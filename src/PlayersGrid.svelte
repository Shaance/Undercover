<script lang="ts">
  import { playerToWords } from './store';
</script>

<style>
  main {
    display: flex;
    justify-content: center;
  }

  .item {
    min-height: 500px;
    min-width: 100px; 
  }
</style>

<main>
  {#each $playerToWords as entry}
    <div class="item">
      <p>{entry[0]}</p>
      <p>* * *</p>
      {#each entry[1] as word}
        <p>{word}</p>
      {/each}
    </div>
  {/each}
</main>