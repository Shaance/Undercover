<script lang="ts">
  import { fly } from "svelte/transition";
  import NameInput from "./NameInput.svelte";
  import PlayerList from "./PlayerList.svelte";
  import Settings from "./Settings.svelte";
  import StartButton from "./StartButton.svelte";
  import { playerId } from "./store.js";
  import statefulSwap from "./StatefulSwap";
  import RoomId from "./RoomId.svelte";

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
    <div in:fly={{ x: 500, duration: 1000 }} on:outroend={onOutro}>
      <Settings />
      <br />
      <StartButton />
      <br />
      <br />
      <RoomId />
      <PlayerList />
    </div>
  {/if}
</main>
