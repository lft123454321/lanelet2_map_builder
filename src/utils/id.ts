let pointCounter = 0;
let linestringCounter = 0;
let laneletCounter = 0;
let areaCounter = 0;
let regCounter = 0;

export function generateId(prefix: 'p' | 'l' | 'lanelet' | 'area' | 'reg'): string {
  switch (prefix) {
    case 'p':
      return `p${++pointCounter}`;
    case 'l':
      return `l${++linestringCounter}`;
    case 'lanelet':
      return `lanelet${++laneletCounter}`;
    case 'area':
      return `area${++areaCounter}`;
    case 'reg':
      return `reg${++regCounter}`;
    default:
      return `${prefix}${Date.now()}`;
  }
}

export function resetIdCounters(): void {
  pointCounter = 0;
  linestringCounter = 0;
  laneletCounter = 0;
  areaCounter = 0;
  regCounter = 0;
}
