import { readFileSync } from 'fs';
import { join } from 'path';
import { random } from './helper';

let words = [];

const getWordPair = () => {
  if (words.length === 0) {
    const fileContent = readFileSync(join('res', 'words.json')).toString();
    words = JSON.parse(fileContent).words;
  }
  return words[random(0, words.length)];
};

export default getWordPair;
