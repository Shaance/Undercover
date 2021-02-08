import { writable } from "svelte/store";

/**
 * This will help prevent the 'jumping' animations
 * https://stackoverflow.com/questions/59882179/svelte-transition-between-two-elements-jumps
 */
export default function statefulSwap(initialState) {
	const state = writable(initialState);
	let nextState = initialState;
	
	function transitionTo(newState) {
		if(nextState === newState) return;
		nextState = newState
		state.set(null)
	}
	
	function onOutro() {
		state.set(nextState)
	}
	return {
		state,
		transitionTo,
		onOutro
	}
}
