import { parseSeedMode, shouldSeed } from './db-init';

describe('db-init', () => {
  describe('parseSeedMode', () => {
    it('usa if-empty cuando no se indica', () => {
      expect(parseSeedMode(undefined)).toBe('if-empty');
      expect(parseSeedMode('  ')).toBe('if-empty');
    });

    it.each(['if-empty', 'always', 'never'])('acepta %s', (mode) => {
      expect(parseSeedMode(mode)).toBe(mode);
    });

    it('rechaza un modo desconocido', () => {
      expect(() => parseSeedMode('sometimes')).toThrow(/SEED_DATABASE debe ser uno de/);
    });
  });

  describe('shouldSeed', () => {
    it.each([
      ['if-empty', 0, true],
      ['if-empty', 2500, false],
      ['always', 2500, true],
      ['never', 0, false],
    ] as const)('%s con %d mediciones → %s', (mode, existing, expected) => {
      expect(shouldSeed(mode, existing)).toBe(expected);
    });
  });
});
