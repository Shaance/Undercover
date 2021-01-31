<script lang="ts">

	import NameInput from "./NameInput.svelte";
	import PlayerList from "./PlayerList.svelte";
  import Settings from "./Settings.svelte";
	import { playerId } from "./store.js";

	$: addedName = $playerId !== '';

</script>

<main>
	{#if !addedName}
		<NameInput />
	{/if}
  <PlayerList />
  <br>
  {#if addedName}
    <Settings />
  {/if}
</main>
