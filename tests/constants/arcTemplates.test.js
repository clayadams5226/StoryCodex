import { describe, test, expect } from '@jest/globals';
import {
  ARC_TEMPLATES,
  getArcTemplateKeys,
  getArcTemplate,
  isValidTemplateKey
} from '../../src/constants/arcTemplates.js';

describe('Arc Templates', () => {
  describe('ARC_TEMPLATES', () => {
    test('should have all required templates', () => {
      expect(ARC_TEMPLATES).toHaveProperty('redemption');
      expect(ARC_TEMPLATES).toHaveProperty('corruption');
      expect(ARC_TEMPLATES).toHaveProperty('disillusionment');
      expect(ARC_TEMPLATES).toHaveProperty('comingOfAge');
      expect(ARC_TEMPLATES).toHaveProperty('quest');
      expect(ARC_TEMPLATES).toHaveProperty('custom');
    });

    test('each template should have correct structure', () => {
      Object.values(ARC_TEMPLATES).forEach(template => {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('color');
        expect(template).toHaveProperty('defaultBeats');
        expect(Array.isArray(template.defaultBeats)).toBe(true);
      });
    });

    test('redemption template should have correct structure', () => {
      const redemption = ARC_TEMPLATES.redemption;

      expect(redemption.name).toBe('Redemption');
      expect(redemption.description).toBe('Character overcomes a flaw or past mistake to become better');
      expect(redemption.color).toBe('#10b981');
      expect(redemption.defaultBeats.length).toBe(6);
      expect(redemption.defaultBeats[0].name).toBe('The Flaw Established');
      expect(redemption.defaultBeats[0].y).toBe(20);
    });

    test('corruption template should have correct structure', () => {
      const corruption = ARC_TEMPLATES.corruption;

      expect(corruption.name).toBe('Fall / Corruption');
      expect(corruption.description).toBe('Character descends from virtue into darkness');
      expect(corruption.color).toBe('#ef4444');
      expect(corruption.defaultBeats.length).toBe(6);
      expect(corruption.defaultBeats[0].name).toBe('Virtue Established');
      expect(corruption.defaultBeats[0].y).toBe(85);
    });

    test('disillusionment template should have correct structure', () => {
      const disillusionment = ARC_TEMPLATES.disillusionment;

      expect(disillusionment.name).toBe('Disillusionment');
      expect(disillusionment.defaultBeats.length).toBe(6);
    });

    test('comingOfAge template should have correct structure', () => {
      const comingOfAge = ARC_TEMPLATES.comingOfAge;

      expect(comingOfAge.name).toBe('Coming of Age');
      expect(comingOfAge.defaultBeats.length).toBe(6);
    });

    test('quest template should have correct structure', () => {
      const quest = ARC_TEMPLATES.quest;

      expect(quest.name).toBe('The Quest');
      expect(quest.defaultBeats.length).toBe(6);
    });

    test('custom template should have minimal beats', () => {
      const custom = ARC_TEMPLATES.custom;

      expect(custom.name).toBe('Custom Arc');
      expect(custom.defaultBeats.length).toBe(3);
      expect(custom.defaultBeats[0].name).toBe('Beginning');
      expect(custom.defaultBeats[1].name).toBe('Middle');
      expect(custom.defaultBeats[2].name).toBe('End');
    });

    test('all beats should have name and y properties', () => {
      Object.values(ARC_TEMPLATES).forEach(template => {
        template.defaultBeats.forEach(beat => {
          expect(beat).toHaveProperty('name');
          expect(beat).toHaveProperty('y');
          expect(typeof beat.name).toBe('string');
          expect(typeof beat.y).toBe('number');
          expect(beat.y).toBeGreaterThanOrEqual(0);
          expect(beat.y).toBeLessThanOrEqual(100);
        });
      });
    });
  });

  describe('getArcTemplateKeys', () => {
    test('should return all template keys', () => {
      const keys = getArcTemplateKeys();

      expect(keys).toContain('redemption');
      expect(keys).toContain('corruption');
      expect(keys).toContain('disillusionment');
      expect(keys).toContain('comingOfAge');
      expect(keys).toContain('quest');
      expect(keys).toContain('custom');
      expect(keys.length).toBe(6);
    });
  });

  describe('getArcTemplate', () => {
    test('should return template for valid key', () => {
      const template = getArcTemplate('redemption');

      expect(template).toBeDefined();
      expect(template.name).toBe('Redemption');
    });

    test('should return null for invalid key', () => {
      const template = getArcTemplate('nonexistent');

      expect(template).toBeNull();
    });
  });

  describe('isValidTemplateKey', () => {
    test('should return true for valid keys', () => {
      expect(isValidTemplateKey('redemption')).toBe(true);
      expect(isValidTemplateKey('corruption')).toBe(true);
      expect(isValidTemplateKey('disillusionment')).toBe(true);
      expect(isValidTemplateKey('comingOfAge')).toBe(true);
      expect(isValidTemplateKey('quest')).toBe(true);
      expect(isValidTemplateKey('custom')).toBe(true);
    });

    test('should return false for invalid keys', () => {
      expect(isValidTemplateKey('invalid')).toBe(false);
      expect(isValidTemplateKey('')).toBe(false);
      expect(isValidTemplateKey(null)).toBe(false);
      expect(isValidTemplateKey(undefined)).toBe(false);
    });
  });
});
