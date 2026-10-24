import { describe, expect, it } from 'vitest';
import { formatPaise, paiseToRupees, rupeesToPaise, splitPaise } from './money';

describe('money utilities', () => {
  describe('splitPaise', () => {
    it('handles clean 50/50 advance split', () => {
      const { partA, partB } = splitPaise(100000, 50); // ₹1,000.00
      expect(partA).toBe(50000);
      expect(partB).toBe(50000);
      expect(partA + partB).toBe(100000);
    });

    it('handles odd amounts rounding so advance + balance always equals total', () => {
      // 101 paise split 50/50 -> 51 and 50
      const odd1 = splitPaise(101, 50);
      expect(odd1.partA).toBe(51);
      expect(odd1.partB).toBe(50);
      expect(odd1.partA + odd1.partB).toBe(101);

      // ₹10,001.01 = 1000101 paise
      const odd2 = splitPaise(1000101, 50);
      expect(odd2.partA).toBe(500051);
      expect(odd2.partB).toBe(500050);
      expect(odd2.partA + odd2.partB).toBe(1000101);

      // 1 paise split
      const odd3 = splitPaise(1, 50);
      expect(odd3.partA).toBe(1);
      expect(odd3.partB).toBe(0);
      expect(odd3.partA + odd3.partB).toBe(1);

      // 3 paise split 33%
      const odd4 = splitPaise(3, 33);
      expect(odd4.partA).toBe(1);
      expect(odd4.partB).toBe(2);
      expect(odd4.partA + odd4.partB).toBe(3);
    });

    it('handles edge case percentages (0% and 100%)', () => {
      const zero = splitPaise(50000, 0);
      expect(zero.partA).toBe(0);
      expect(zero.partB).toBe(50000);
      expect(zero.partA + zero.partB).toBe(50000);

      const hundred = splitPaise(50000, 100);
      expect(hundred.partA).toBe(50000);
      expect(hundred.partB).toBe(0);
      expect(hundred.partA + hundred.partB).toBe(50000);
    });
  });

  describe('rupeesToPaise and paiseToRupees', () => {
    it('converts correctly between rupees and paise', () => {
      expect(rupeesToPaise(100)).toBe(10000);
      expect(rupeesToPaise('100.50')).toBe(10050);
      expect(rupeesToPaise('1,50,000')).toBe(15000000);
      expect(paiseToRupees(10050)).toBe(100.5);
      expect(paiseToRupees(15000000)).toBe(150000);
    });
  });

  describe('formatPaise', () => {
    it('formats Indian rupee amounts with proper grouping', () => {
      // ₹1,00,000 (10000000 paise = 1 Lakh)
      const formattedLakh = formatPaise(10000000);
      expect(formattedLakh).toBe('₹1,00,000');

      // ₹1,23,456.75
      const formattedDecimals = formatPaise(12345675);
      expect(formattedDecimals).toBe('₹1,23,456.75');

      // ₹0
      expect(formatPaise(0)).toBe('₹0');
    });
  });
});
