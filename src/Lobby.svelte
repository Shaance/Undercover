<script lang="ts">
  import { fly } from "svelte/transition";
  import NameInput from "./NameInput.svelte";
  import PlayerList from "./PlayerList.svelte";
  import Settings from "./Settings.svelte";
  import StartButton from "./StartButton.svelte";
  import { playerId, roomId } from "./store.js";
  import statefulSwap from "./StatefulSwap";

  const { onOutro, transitionTo, state } = statefulSwap($playerId);

  $: if ($playerId) {
    transitionTo($playerId);
  }
</script>

<main>
  {#if $state === ""}
    <div out:fly={{ x: -100, duration: 100 }} on:outroend={onOutro}>
      <NameInput />
    </div>
  {:else}
    <div class ="content" in:fly={{ x: 500, duration: 1000 }} on:outroend={onOutro}>
      <Settings />
      <br />
      <StartButton />
      <br />
      <PlayerList />
    </div>
    <footer> Room ID: {$roomId} </footer>
  {/if}
</main>

<style>
  main {
    position: relative;
    min-height: 100vh;
  }

  .content {
    padding-bottom: 6.5rem;
  }

  footer {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 6.5rem;
  }
</style>