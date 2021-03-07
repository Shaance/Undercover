<script lang="ts">
  import { onMount } from "svelte";
  import {
    isMrWhite,
    ownWord,
    sendMessage,
    usedWords,
    yourTurn,
    roomId,
  } from "./store";
  import { getAddWordPayload } from "./wsHelper";

  $: placeHolderText = $isMrWhite
    ? "Try to describe.."
    : `Describe ${$ownWord}`;
  $: if ($yourTurn && mounted) {
    input.focus();
  }

  let message = "";
  let input;
  let mounted = false;

  onMount(() => (mounted = true));

  // TODO check if word not already seen
  function handleClick() {
    const trimmedWord = message.trim();
    if (trimmedWord.length > 0) {
      if (!$yourTurn) {
        alert('Psst not your turn yet 👀');
      } else {
        if ($usedWords.has(trimmedWord.toLowerCase())) {
          alert(`${trimmedWord} has already been used!`);
        } else {
          sendMessage(getAddWordPayload(trimmedWord, $roomId));
        }
        message = "";
      }
    }
  }

  function handleKeyup() {
    // @ts-ignore
    if (event.code === "Enter") {
      handleClick();
    }
  }
</script>

<main>
  <input
    type="text"
    placeholder={placeHolderText}
    bind:this={input}
    bind:value={message}
    on:keyup|preventDefault={handleKeyup}
  />
  <button disabled={!$yourTurn} on:click={handleClick}> Submit </button>
</main>

<style>
  main {
    font-size: 1em;
    font-weight: 200;
    margin-bottom: 40px;
  }
  input {
    margin-bottom: 20px;
  }
  ::-webkit-input-placeholder {
    text-align: center;
  }
</style>
