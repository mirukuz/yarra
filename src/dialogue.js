export const LINES = {
  intro: [
    'Melbourne, in the near years. The rains still come, but the river runs thin.',
    'On the edge of the city, a data centre drinks the Yarra to cool its endless thinking.',
    "I'm Mei. I collect what the water can't swallow — proof, piece by piece.",
    'Three sites. Twelve samples. Then I open the last gate.',
  ],
  lakeEnter: [
    'Albert Park. The swans nest in it now — fishing line, wound through the reeds.',
  ],
  lakeDone: [
    "Four lines untangled. The swans won't miss them.",
  ],
  forestEnter: [
    'Dandenong. Fern gullies, mountain ash — and bottles that will outlast the trees.',
  ],
  forestDone: [
    "The gully keeps its own quiet. I'll carry the noise out.",
  ],
  oceanEnter: [
    'St Kilda. The penguins fish where the plastic drifts.',
  ],
  oceanDone: [
    "The tide brought it in. I'm taking it back.",
  ],
  locked: [
    "The gate won't open yet — I still need more evidence.",
  ],
  datacenterEnter: [
    'Inside, it hums like a fever. Somewhere in here, the river is being spent.',
  ],
  gateOpen: [
    'Twelve samples. Twelve small proofs that this costs more than power.',
    'The gate turns. The water remembers its way.',
  ],
  ending: [
    'The river rises slow,',
    'past the reeds, past the pier,',
    'past the servers gone dark and cool.',
    'No one cheered. The swans came back first.',
    '— for every stream that feeds a thinking machine.',
  ],
};

export function createDialogue(lines) {
  return { lines: [...lines], index: 0 };
}

export function currentLine(dialogue) {
  return dialogue.index < dialogue.lines.length ? dialogue.lines[dialogue.index] : null;
}

export function advanceDialogue(dialogue) {
  if (dialogue.index < dialogue.lines.length) dialogue.index++;
}

export function isDialogueDone(dialogue) {
  return dialogue.index >= dialogue.lines.length;
}
