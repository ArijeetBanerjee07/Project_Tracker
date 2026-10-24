import { describe, expect, it } from 'vitest';
import type { Project } from '../types/project';
import {
  computePersonSummary,
  computeProjectBreakdown,
  computeSharedSummary,
  isProjectOverdue,
} from './projects';

describe('project calculations and business logic', () => {
  const baseProject: Project = {
    id: 'test-1',
    title: 'Design System Consulting',
    institute: 'National Design Institute',
    ownership: 'arijeet',
    startDate: '2026-10-01',
    tentativeDeadline: '2026-10-20',
    totalAmount: 10000000, // ₹1,00,000 (10000000 paise)
    advancePercent: 50,
    advanceReceived: false,
    balanceReceived: false,
    status: 'in_progress',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  };

  describe('isProjectOverdue', () => {
    const today = '2026-10-24';

    it('flags in_progress project with past deadline as overdue', () => {
      expect(isProjectOverdue('2026-10-20', 'in_progress', today)).toBe(true);
      expect(isProjectOverdue('2026-10-23', 'upcoming', today)).toBe(true);
    });

    it('does NOT flag completed project as overdue even if past deadline', () => {
      expect(isProjectOverdue('2026-10-20', 'completed', today)).toBe(false);
    });

    it('does NOT flag project with future deadline or today deadline as overdue', () => {
      expect(isProjectOverdue('2026-10-25', 'in_progress', today)).toBe(false);
      expect(isProjectOverdue('2026-10-24', 'in_progress', today)).toBe(false);
    });
  });

  describe('arijeet individual project breakdown', () => {
    it('computes 50% advance and balance correctly', () => {
      const computed = computeProjectBreakdown(baseProject, '2026-10-24');

      expect(computed.isOverdue).toBe(true);
      expect(computed.overall.totalAmount).toBe(10000000);
      expect(computed.overall.advanceAmount).toBe(5000000);
      expect(computed.overall.balanceAmount).toBe(5000000);
      expect(computed.overall.receivedAmount).toBe(0);
      expect(computed.overall.pendingAdvance).toBe(5000000);
      expect(computed.overall.pendingBalance).toBe(5000000);
      expect(computed.overall.pendingTotal).toBe(10000000);
      expect(computed.arijeetShare).toEqual(computed.overall);
      expect(computed.priyaShare).toBeUndefined();
    });

    it('updates received and pending when advance is marked received', () => {
      const advancePaid: Project = {
        ...baseProject,
        advanceReceived: true,
        advanceReceivedDate: '2026-10-05',
      };
      const computed = computeProjectBreakdown(advancePaid, '2026-10-24');

      expect(computed.overall.receivedAmount).toBe(5000000);
      expect(computed.overall.pendingAdvance).toBe(0);
      expect(computed.overall.pendingBalance).toBe(5000000);
      expect(computed.overall.pendingTotal).toBe(5000000);
    });
  });

  describe('priya individual project breakdown', () => {
    it('assigns full project share to Priya and 0 to Arijeet', () => {
      const priyaProject: Project = {
        ...baseProject,
        id: 'priya-1',
        ownership: 'priya',
        totalAmount: 6000000,
        advanceReceived: true,
      };

      const computed = computeProjectBreakdown(priyaProject, '2026-10-24');

      expect(computed.priyaShare?.totalAmount).toBe(6000000);
      expect(computed.priyaShare?.receivedAmount).toBe(3000000);
      expect(computed.arijeetShare.totalAmount).toBe(0);
    });
  });

  describe('shared project calculations', () => {
    it('splits total and advance/balance proportionally for 50/50 shared project', () => {
      const sharedProject: Project = {
        ...baseProject,
        ownership: 'shared',
        mySharePercent: 50,
        advancePercent: 50,
        advanceReceived: true,
        balanceReceived: false,
      };

      const computed = computeProjectBreakdown(sharedProject, '2026-10-24');

      expect(computed.priyaShare).toBeDefined();

      // Overall: ₹1,00,000 (10000000 paise)
      expect(computed.overall.totalAmount).toBe(10000000);

      // Arijeet share: 50% = ₹50,000 (5000000 paise)
      expect(computed.arijeetShare.totalAmount).toBe(5000000);
      expect(computed.arijeetShare.advanceAmount).toBe(2500000);
      expect(computed.arijeetShare.balanceAmount).toBe(2500000);
      expect(computed.arijeetShare.receivedAmount).toBe(2500000);
      expect(computed.arijeetShare.pendingAdvance).toBe(0);
      expect(computed.arijeetShare.pendingBalance).toBe(2500000);
      expect(computed.arijeetShare.pendingTotal).toBe(2500000);

      // Priya share: 50% = ₹50,000 (5000000 paise)
      expect(computed.priyaShare?.totalAmount).toBe(5000000);
      expect(computed.priyaShare?.advanceAmount).toBe(2500000);
      expect(computed.priyaShare?.balanceAmount).toBe(2500000);
      expect(computed.priyaShare?.receivedAmount).toBe(2500000);
      expect(computed.priyaShare?.pendingAdvance).toBe(0);
      expect(computed.priyaShare?.pendingBalance).toBe(2500000);
      expect(computed.priyaShare?.pendingTotal).toBe(2500000);

      // Sum of shares equals overall
      expect(computed.arijeetShare.totalAmount + (computed.priyaShare?.totalAmount ?? 0)).toBe(
        computed.overall.totalAmount
      );
    });

    it('handles custom split (e.g. 60/40) with odd paise amounts accurately', () => {
      const oddSharedProject: Project = {
        ...baseProject,
        totalAmount: 100001, // 100001 paise
        ownership: 'shared',
        mySharePercent: 60,
        advancePercent: 50,
      };

      const computed = computeProjectBreakdown(oddSharedProject, '2026-10-24');

      // 60% of 100001 = Math.round(60000.6) = 60001
      // Priya 40% = 100001 - 60001 = 40000
      expect(computed.arijeetShare.totalAmount).toBe(60001);
      expect(computed.priyaShare?.totalAmount).toBe(40000);
      expect(computed.arijeetShare.totalAmount + (computed.priyaShare?.totalAmount ?? 0)).toBe(
        100001
      );

      // Arijeet's advance 50% of 60001 = Math.round(30000.5) = 30001
      // Arijeet's balance = 60001 - 30001 = 30000
      expect(computed.arijeetShare.advanceAmount).toBe(30001);
      expect(computed.arijeetShare.balanceAmount).toBe(30000);
      expect(computed.arijeetShare.advanceAmount + computed.arijeetShare.balanceAmount).toBe(60001);
    });
  });

  describe('computePersonSummary & computeSharedSummary', () => {
    it('computes correct aggregates for Arijeet, Priya, and Shared views', () => {
      const p1: Project = {
        ...baseProject,
        id: '1',
        totalAmount: 100000,
        status: 'in_progress',
        ownership: 'arijeet',
        advanceReceived: true,
      };

      const p2: Project = {
        ...baseProject,
        id: '2',
        totalAmount: 200000,
        status: 'completed',
        ownership: 'shared',
        mySharePercent: 50,
        advanceReceived: true,
        balanceReceived: true,
      };

      const p3: Project = {
        ...baseProject,
        id: '3',
        totalAmount: 50000,
        status: 'in_progress',
        ownership: 'priya',
        advanceReceived: false,
      };

      const computedList = [
        computeProjectBreakdown(p1, '2026-10-24'),
        computeProjectBreakdown(p2, '2026-10-24'),
        computeProjectBreakdown(p3, '2026-10-24'),
      ];

      const arijeetSummary = computePersonSummary(computedList, 'arijeet');
      const priyaSummary = computePersonSummary(computedList, 'priya');
      const sharedSummary = computeSharedSummary(computedList);

      // Arijeet has p1 (100k) + half of p2 (100k) = 200k total
      expect(arijeetSummary.counts.total).toBe(2);
      expect(arijeetSummary.money.total).toBe(200000);

      // Priya has p3 (50k) + half of p2 (100k) = 150k total
      expect(priyaSummary.counts.total).toBe(2);
      expect(priyaSummary.money.total).toBe(150000);

      // Shared has 1 project (p2) = 200k total
      expect(sharedSummary.counts.total).toBe(1);
      expect(sharedSummary.overallMoney.total).toBe(200000);
      expect(sharedSummary.arijeetMoney.total).toBe(100000);
      expect(sharedSummary.priyaMoney.total).toBe(100000);
    });
  });
});
