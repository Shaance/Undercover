export function getUniqueID() {
  function s4() {
    return random(1, 0x10000)
      .toString(16)
      .substring(1);
  }
  return `${s4() + s4()}-${s4()}`;
}

export function random(min: number, max: number) {
  return Math.floor((min + Math.random()) * max);
}

export function shuffleArray(array: any[]) {
  const arr = array;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
