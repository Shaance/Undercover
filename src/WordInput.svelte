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
  import Toast from './Toast.svelte';

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

  function handleClick() {
    const trimmedWord = message.trim();
    if (trimmedWord.length > 0) {
      if ($usedWords.has(trimmedWord.toLowerCase())) {
        // @ts-ignore
        window.pushToast(`${trimmedWord} has already been used!`);
      } else {
        sendMessage(getAddWordPayload(trimmedWord, $roomId));
      }
      message = "";
    } else {
      // @ts-ignore
      window.pushToast('Not a very clear description 👀');
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
    size="15"
    bind:this={input}
    bind:value={message}
    on:keyup|preventDefault={handleKeyup}
  />
  <button class="btn btn-light" disabled={!$yourTurn} on:click={handleClick}> Submit </button>
  <Toast/>
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

  ::-moz-placeholder {
   text-align: center;
  }
</style>
