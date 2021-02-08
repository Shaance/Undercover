<script lang="ts">
	import { fly } from "svelte/transition";
	import GameBoard from "./GameBoard.svelte";
	import Lobby from "./Lobby.svelte";
	import statefulSwap from "./StatefulSwap"
	import { playingState } from "./store";

  const { onOutro, transitionTo, state } = statefulSwap("init");

	$: if ($playingState === 'started') {
		transitionTo('started');
	}
</script>

<main>
	{#if $state === 'init'}
		<div out:fly="{{ y: 500, duration: 300 }}" on:outroend={onOutro}>
			<Lobby />
		</div>
	{/if}
	{#if $state === 'started'}
		<div in:fly="{{ y: 500, duration: 500 }}" on:outroend={onOutro}>
			<GameBoard />
		</div>
	{/if}
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}
</style>