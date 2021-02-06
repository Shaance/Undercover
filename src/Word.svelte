<script lang="ts">
  import { ownWord } from "./store";

  $: text = getText($ownWord);

  function getText(word: string) {
    if (word) {
      if (word === 'init') {
        return 'Retrieving your word..'
      }
      return word;
    }
    return 'You are Mr.white!'
  }
</script>

<main>
  <p>{text}</p>
</main>