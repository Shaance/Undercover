<script lang="ts">
  import { playerToWords } from './store';
  import { receive } from './Animations';
  import { flip } from 'svelte/animate';
  // TODO try to fix when too many items
</script>

<style>
  main {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }

  .card {
    min-width: 100px;
    min-height: 200px;
  }

  .item {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  p {
    font-size: 1em;
		font-weight: 100;
  }
</style>

<main>
  {#each $playerToWords as entry}
    <div class="card">
      <div>{entry[0]}</div>
      <p>* * *</p>
      {#each entry[1] as word, _ (word)}
        <p class="item" in:receive="{{key: word}}" animate:flip>
          {word}
        </p>
      {/each}
    </div>
  {/each}
</main>