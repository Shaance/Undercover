<script lang="ts">
  import { fly } from "svelte/transition";
  import NameInput from "./NameInput.svelte";
  import PlayerList from "./PlayerList.svelte";
  import Settings from "./Settings.svelte";
  import StartButton from "./StartButton.svelte";
  import { nameChosen } from "./store.js";
  import statefulSwap from "./StatefulSwap";
  import RoomId from "./RoomId.svelte";

  const { onOutro, transitionTo, state } = statefulSwap($nameChosen);

  $: if ($nameChosen) {
    transitionTo($nameChosen);
  }
</script>

<main>
  {#if $state === false}
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
