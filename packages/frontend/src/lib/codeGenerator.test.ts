import {
  generateAreaCode,
  generateSubAreaCode,
  generateProcessCode
} from './codeGenerator'; // Adjust path as necessary

describe('Code Generation Utilities', () => {
  // Test generateAreaCode
  describe('generateAreaCode', () => {
    it('should generate the first area code correctly', () => {
      expect(generateAreaCode('PROJ', [])).toBe('PROJ-01');
    });

    it('should generate subsequent area codes correctly', () => {
      expect(generateAreaCode('PROJ', ['PROJ-01', 'PROJ-02'])).toBe('PROJ-03');
    });

    it('should handle non-sequential existing codes', () => {
      expect(generateAreaCode('PROJ', ['PROJ-01', 'PROJ-03'])).toBe('PROJ-04');
    });

    it('should handle empty project code (though unlikely)', () => {
      expect(generateAreaCode('', [])).toBe('-01');
    });

    it('should correctly parse codes with different prefixes', () => {
      expect(generateAreaCode('TEST', ['OTHER-01', 'TEST-01'])).toBe('TEST-02');
    });
     it('should handle codes with more than two digits in sequence', () => {
      expect(generateAreaCode('PROJ', ['PROJ-09', 'PROJ-10'])).toBe('PROJ-11');
    });
  });

  // Test generateSubAreaCode
  describe('generateSubAreaCode', () => {
    it('should generate the first sub-area code correctly', () => {
      expect(generateSubAreaCode('PROJ-01', [])).toBe('PROJ-01.01');
    });

    it('should generate subsequent sub-area codes', () => {
      expect(generateSubAreaCode('PROJ-01', ['PROJ-01.01', 'PROJ-01.02'])).toBe('PROJ-01.03');
    });

    it('should handle non-sequential existing sub-area codes', () => {
      expect(generateSubAreaCode('PROJ-01', ['PROJ-01.01', 'PROJ-01.03'])).toBe('PROJ-01.04');
    });

    it('should correctly parse codes with different parent area codes', () => {
      expect(generateSubAreaCode('AREA-X', ['AREA-Y.01', 'AREA-X.01'])).toBe('AREA-X.02');
    });

    it('should handle codes with more than two digits in sequence', () => {
      expect(generateSubAreaCode('PROJ-01', ['PROJ-01.09', 'PROJ-01.10'])).toBe('PROJ-01.11');
    });
  });

  // Test generateProcessCode
  describe('generateProcessCode', () => {
    it('should generate the first process code correctly', () => {
      expect(generateProcessCode('PROJ-01.01', [])).toBe('PROJ-01.01.01');
    });

    it('should generate subsequent process codes', () => {
      expect(generateProcessCode('PROJ-01.01', ['PROJ-01.01.01', 'PROJ-01.01.02'])).toBe('PROJ-01.01.03');
    });

    it('should handle non-sequential existing process codes', () => {
      expect(generateProcessCode('SUB-A.02', ['SUB-A.02.01', 'SUB-A.02.03'])).toBe('SUB-A.02.04');
    });

    it('should correctly parse codes with different parent sub-area codes', () => {
      expect(generateProcessCode('SUB.01', ['OTHER.01.01', 'SUB.01.01'])).toBe('SUB.01.02');
    });

    it('should handle codes with more than two digits in sequence', () => {
      expect(generateProcessCode('PROJ-01.01', ['PROJ-01.01.09', 'PROJ-01.01.10'])).toBe('PROJ-01.01.11');
    });
  });
});
