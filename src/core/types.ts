export type Tag = 'NUCLEO' | 'COMPLEMENTARIO' | 'EXTRA';
export type Duration = '1h' | '2h';
export type PainType = 'calentar' | 'final' | 'carga';
export type Track = 'CF' | 'HX';

export interface Pain { zone: string; type: PainType }

export interface Line {
  id: string;
  /** texto por nivel; '*' aplica a todos */
  content: Record<string, string>;
  patterns: string[];
}

export interface Block {
  id: string;
  tag: Tag;
  format: string;
  name: string | null;
  scheme: string | null;
  note: string | null;
  logType: 'peso' | 'tiempo' | 'rondas' | null;
  lines: Line[];
}

export interface Day {
  id: string;
  dow: number; // 1=lunes … 6=sabado
  focus: string;
  why: string;
  blocks: Block[];
}

export interface Rule {
  pattern: string;
  zone: string;
  severity: Exclude<PainType, 'calentar'>;
  substitute: string;
  note: string;
}

export interface CycleInfo {
  block: string;
  week: number;
  totalWeeks: number;
  goal: string;
}
