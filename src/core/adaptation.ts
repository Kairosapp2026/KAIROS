import type { Block, Duration, Line, Pain, Rule } from './types';

export interface AdaptedLine {
  text: string;
  adapted?: { zone: string; type: string; original: string; note: string };
}

export interface AdaptedBlock extends Omit<Block, 'lines'> {
  visible: boolean;
  lines: AdaptedLine[];
}

export interface AdaptedSession {
  blocks: AdaptedBlock[];
  needsActivation: string[];
  mobilityZones: string[];
  omittedCount: number;
}

const levelText = (line: Line, level: string): string =>
  line.content[level] ?? line.content['*'] ?? Object.values(line.content)[0] ?? '';

const WOD_FORMATS = ['AMRAP', 'EMOM', 'FOR_TIME', 'INTERVALOS', 'TEAM'];

function adaptLine(line: Line, pains: Pain[], rules: Rule[], level: string, isWod: boolean): AdaptedLine {
  const base = levelText(line, level);
  for (const pain of pains) {
    if (pain.type === 'calentar') continue;
    for (const pattern of line.patterns) {
      const rule = rules.find(
        (r) => r.pattern === pattern && r.zone === pain.zone && r.severity === pain.type,
      );
      if (rule) {
        return {
          text: isWod && rule.substituteWod ? rule.substituteWod : rule.substitute,
          adapted: { zone: pain.zone, type: pain.type, original: base, note: rule.note },
        };
      }
    }
  }
  return { text: base };
}

/** Motor de adaptacion de Kairos: logica pura y determinista. */
export function adaptSession(
  blocks: Block[],
  duration: Duration,
  pains: Pain[],
  rules: Rule[],
  level: string,
): AdaptedSession {
  const adapted: AdaptedBlock[] = blocks.map((b) => ({
    ...b,
    visible: duration === '2h' || b.tag === 'NUCLEO',
    lines: b.lines.map((l) => adaptLine(l, pains, rules, level, WOD_FORMATS.includes(b.format))),
  }));
  return {
    blocks: adapted,
    needsActivation: [...new Set(pains.filter((p) => p.type === 'calentar').map((p) => p.zone))],
    mobilityZones: [...new Set(pains.map((p) => p.zone))],
    omittedCount: adapted.filter((b) => !b.visible).length,
  };
}
