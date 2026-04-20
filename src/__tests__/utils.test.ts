/**
 * Unit Tests for WhereYouAt — Core Utility Functions
 * Tests cover: Room ID generation, Grid coordinate mapping, Firebase guard logic
 */

// ─── Utility Functions (extracted for testability) ────────────────────────────

/** Generate a unique room ID in format WYA-XXXX */
export function generateRoomId(): string {
  return 'WYA-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/** Convert SVG [x,y] pixel coordinates to a grid reference string (e.g. "C4") */
export function getGridCode(x: number, y: number, mapWidth = 500, mapHeight = 400): string {
  const col = Math.floor((x / mapWidth) * 10);
  const row = Math.floor((y / mapHeight) * 8);
  const colLetter = String.fromCharCode(65 + Math.min(col, 9));
  const rowNumber = Math.min(row + 1, 8);
  return `${colLetter}${rowNumber}`;
}

/** Check if a Firebase config is valid (has required fields) */
export function isFirebaseConfigValid(config: Record<string, string | undefined>): boolean {
  return !!(config.projectId && config.databaseURL && config.apiKey);
}

/** Sanitize a room ID input to prevent XSS or invalid characters */
export function sanitizeRoomId(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9-]/g, '').substring(0, 10);
}

/** Get crowd severity label from a wait time in minutes */
export function getCrowdSeverity(waitMinutes: number): 'clear' | 'moderate' | 'severe' {
  if (waitMinutes <= 5) return 'clear';
  if (waitMinutes <= 15) return 'moderate';
  return 'severe';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('generateRoomId()', () => {
  it('should return a string starting with "WYA-"', () => {
    const id = generateRoomId();
    expect(id).toMatch(/^WYA-/);
  });

  it('should return an ID with exactly 8 characters total', () => {
    const id = generateRoomId();
    expect(id.length).toBe(8);
  });

  it('should generate unique IDs on consecutive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, generateRoomId));
    expect(ids.size).toBeGreaterThan(95); // Allow tiny collision probability
  });

  it('should only contain uppercase alphanumeric chars after the prefix', () => {
    const id = generateRoomId();
    const suffix = id.replace('WYA-', '');
    expect(suffix).toMatch(/^[A-Z0-9]+$/);
  });
});

describe('getGridCode()', () => {
  it('should return "A1" for top-left corner (0,0)', () => {
    expect(getGridCode(0, 0)).toBe('A1');
  });

  it('should return "J8" for bottom-right corner (499,399)', () => {
    expect(getGridCode(499, 399)).toBe('J8');
  });

  it('should return a letter and number format', () => {
    const code = getGridCode(250, 200);
    expect(code).toMatch(/^[A-J][1-8]$/);
  });

  it('should correctly map center of map to approximately E4', () => {
    const code = getGridCode(250, 200);
    expect(['E4', 'E5', 'F4', 'F5']).toContain(code);
  });

  it('should clamp out-of-bounds coordinates safely', () => {
    const code = getGridCode(9999, 9999);
    expect(code).toMatch(/^[A-J][1-8]$/);
  });
});

describe('isFirebaseConfigValid()', () => {
  it('should return true when all required fields are present', () => {
    const config = {
      projectId: 'promptwar-8a1b6',
      databaseURL: 'https://promptwar-8a1b6-default-rtdb.firebaseio.com',
      apiKey: 'AIzaSy-test-key',
    };
    expect(isFirebaseConfigValid(config)).toBe(true);
  });

  it('should return false when projectId is missing', () => {
    const config = {
      projectId: undefined,
      databaseURL: 'https://test.firebaseio.com',
      apiKey: 'test-key',
    };
    expect(isFirebaseConfigValid(config)).toBe(false);
  });

  it('should return false when databaseURL is missing', () => {
    const config = {
      projectId: 'test-project',
      databaseURL: undefined,
      apiKey: 'test-key',
    };
    expect(isFirebaseConfigValid(config)).toBe(false);
  });

  it('should return false when all fields are undefined', () => {
    expect(isFirebaseConfigValid({})).toBe(false);
  });
});

describe('sanitizeRoomId()', () => {
  it('should remove lowercase letters', () => {
    expect(sanitizeRoomId('wya-l40')).toBe('WYA-L40');
  });

  it('should strip all HTML tag characters making injection impossible', () => {
    const result = sanitizeRoomId('<script>alert(1)</script>');
    // angle brackets, parentheses are stripped — no HTML can be formed
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('(');
    expect(result).not.toContain(')');
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should allow uppercase letters, numbers, and dashes', () => {
    expect(sanitizeRoomId('WYA-L40')).toBe('WYA-L40');
  });

  it('should truncate to 10 characters max', () => {
    const result = sanitizeRoomId('ABCDEFGHIJKLMNOP');
    expect(result.length).toBeLessThanOrEqual(10);
  });

  it('should handle empty string', () => {
    expect(sanitizeRoomId('')).toBe('');
  });
});

describe('getCrowdSeverity()', () => {
  it('should return "clear" for 0 minute wait', () => {
    expect(getCrowdSeverity(0)).toBe('clear');
  });

  it('should return "clear" for 5 minute wait', () => {
    expect(getCrowdSeverity(5)).toBe('clear');
  });

  it('should return "moderate" for 10 minute wait', () => {
    expect(getCrowdSeverity(10)).toBe('moderate');
  });

  it('should return "moderate" for 15 minute wait', () => {
    expect(getCrowdSeverity(15)).toBe('moderate');
  });

  it('should return "severe" for 16+ minute wait', () => {
    expect(getCrowdSeverity(16)).toBe('severe');
    expect(getCrowdSeverity(60)).toBe('severe');
  });
});
