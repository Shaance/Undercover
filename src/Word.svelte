<script lang="ts">
  import { ownWord } from "./store";

  $: text = getText($ownWord);

  function getText(word: string) {
    if (word) {
      if (word === 'init') {
        return '<p>Retrieving your word..</p>'
      }
      return `<p> Your word is </p>
      <p><b>${word}</b></p>`;
    }
    return '<p><b>You are Mr.white!</b></p>'
  }
</script>

<main>
  <div>{@html text}</div>
</main>