// Tidies an email so that phrase matching is reliable, WITHOUT losing the ability to
// quote the customer's own words back to an agent.
//
// Why the index map matters: we match against the tidied text ("i have lost my job"),
// but the evidence we show an agent must be the raw text ("I've lost my job"). The map
// records, for every character in the tidied string, where it came from in the original.

// Contractions are expanded so "I've lost my job" and "I have lost my job" both match
// one stored phrase instead of two.
const CONTRACTIONS = [
  ["won't", 'will not'],
  ["can't", 'can not'],
  ["cannot", 'can not'],
  ["n't", ' not'],
  ["'ve", ' have'],
  ["'re", ' are'],
  ["'ll", ' will'],
  ["'m", ' am'],
  ["'s", ' is'],
];

/**
 * @returns {{ text: string, map: number[] }}
 *   text - lowercased, punctuation stripped, single spaced
 *   map  - map[i] is the index in the ORIGINAL string that text[i] came from
 */
export function normalise(original) {
  const chars = [];
  const map = [];

  for (let i = 0; i < original.length; i += 1) {
    // Try to expand a contraction starting at this position.
    const rest = original.slice(i).toLowerCase();
    const hit = CONTRACTIONS.find((c) => rest.startsWith(c[0]));
    if (hit) {
      // Every character of the expansion points back at the START of the contraction,
      // so a match that covers it still slices out sensible original text.
      for (const ch of hit[1]) {
        chars.push(ch);
        map.push(i);
      }
      i += hit[0].length - 1;
      continue;
    }

    const ch = original[i].toLowerCase();
    if (/[a-z0-9]/.test(ch)) {
      chars.push(ch);
      map.push(i);
    } else if (chars.length && chars[chars.length - 1] !== ' ') {
      // Any run of punctuation or whitespace collapses to one space.
      chars.push(' ');
      map.push(i);
    }
  }

  while (chars.length && chars[chars.length - 1] === ' ') {
    chars.pop();
    map.pop();
  }

  // Pad so that a match ending at the final character can still read map[end].
  map.push(original.length);

  return { text: chars.join(''), map };
}
