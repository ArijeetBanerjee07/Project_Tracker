import type {
  ComputedProject,
  PersonShareBreakdown,
  Project,
  ProjectStatus,
} from '../types/project';
import { splitPaise } from './money';

/**
 * Returns today's date in local time as 'YYYY-MM-DD'.
 */
export function getTodayIsoString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a project is overdue.
 * Definition: not completed and today is past tentativeDeadline.
 */
export function isProjectOverdue(
  tentativeDeadline: string,
  status: ProjectStatus,
  todayIso: string = getTodayIsoString()
): boolean {
  if (status === 'completed') return false;
  if (!tentativeDeadline) return false;
  return tentativeDeadline < todayIso;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) for display in local timezone.
 */
export function formatDisplayDate(isoDateString?: string): string {
  if (!isoDateString) return '—';
  const parts = isoDateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
  return isoDateString;
}

const ZERO_BREAKDOWN: PersonShareBreakdown = {
  totalAmount: 0,
  advanceAmount: 0,
  balanceAmount: 0,
  advanceReceived: false,
  balanceReceived: false,
  receivedAmount: 0,
  pendingAdvance: 0,
  pendingBalance: 0,
  pendingTotal: 0,
};

/**
 * Calculates payment breakdown for a given principal paise amount and advance percentage.
 */
function calculatePaymentBreakdown(
  principalAmount: number,
  advancePercent: number,
  advanceReceived: boolean,
  balanceReceived: boolean,
  advanceReceivedDate?: string,
  balanceReceivedDate?: string
): PersonShareBreakdown {
  const { partA: advanceAmount, partB: balanceAmount } = splitPaise(
    principalAmount,
    advancePercent
  );

  const receivedAmount =
    (advanceReceived ? advanceAmount : 0) + (balanceReceived ? balanceAmount : 0);
  const pendingAdvance = advanceReceived ? 0 : advanceAmount;
  const pendingBalance = balanceReceived ? 0 : balanceAmount;
  const pendingTotal = pendingAdvance + pendingBalance;

  return {
    totalAmount: principalAmount,
    advanceAmount,
    balanceAmount,
    advanceReceived,
    balanceReceived,
    advanceReceivedDate,
    balanceReceivedDate,
    receivedAmount,
    pendingAdvance,
    pendingBalance,
    pendingTotal,
  };
}

/**
 * Computes all derived values for a single project:
 * - Overall breakdown
 * - Arijit's share breakdown
 * - Priya's share breakdown
 * - Overdue flag
 */
export function computeProjectBreakdown(
  project: Project,
  todayIso: string = getTodayIsoString()
): ComputedProject {
  const advancePercent = project.advancePercent ?? 50;

  const overall = calculatePaymentBreakdown(
    project.totalAmount,
    advancePercent,
    project.advanceReceived,
    project.balanceReceived,
    project.advanceReceivedDate,
    project.balanceReceivedDate
  );

  let arijeetShare: PersonShareBreakdown;
  let priyaShare: PersonShareBreakdown | undefined;

  if (project.ownership === 'priya') {
    arijeetShare = { ...ZERO_BREAKDOWN };
    priyaShare = overall;
  } else if (project.ownership === 'shared') {
    const arijeetPercent = project.mySharePercent ?? 50;
    const { partA: arijeetTotal, partB: priyaTotal } = splitPaise(
      project.totalAmount,
      arijeetPercent
    );

    arijeetShare = calculatePaymentBreakdown(
      arijeetTotal,
      advancePercent,
      project.advanceReceived,
      project.balanceReceived,
      project.advanceReceivedDate,
      project.balanceReceivedDate
    );

    priyaShare = calculatePaymentBreakdown(
      priyaTotal,
      advancePercent,
      project.advanceReceived,
      project.balanceReceived,
      project.advanceReceivedDate,
      project.balanceReceivedDate
    );
  } else {
    // 'arijeet', 'arijit', or legacy 'mine'
    arijeetShare = overall;
    priyaShare = undefined;
  }

  const isOverdue = isProjectOverdue(project.tentativeDeadline, project.status, todayIso);

  return {
    ...project,
    isOverdue,
    overall,
    arijeetShare,
    arijitShare: arijeetShare,
    priyaShare,
    myShare: arijeetShare,
    partnerShare: priyaShare,
  };
}

export interface PersonSummary {
  counts: {
    total: number;
    active: number;
    upcoming: number;
    completed: number;
    onHold: number;
  };
  money: {
    total: number;
    received: number;
    pendingAdvance: number;
    pendingBalance: number;
    pendingTotal: number;
  };
}

/**
 * Computes summary statistics for a specific person ('arijit' or 'priya')
 * including both their individual projects and their share in shared projects.
 */
export function computePersonSummary(
  projects: ComputedProject[],
  person: 'arijeet' | 'arijit' | 'priya'
): PersonSummary {
  const isArijeet = person === 'arijeet' || person === 'arijit';
  const relevantProjects = projects.filter((p) => {
    if (isArijeet) {
      return (
        p.ownership === 'arijeet' ||
        p.ownership === 'arijit' ||
        p.ownership === 'mine' ||
        p.ownership === 'shared'
      );
    } else {
      return p.ownership === 'priya' || p.ownership === 'shared';
    }
  });

  const counts = {
    total: relevantProjects.length,
    active: 0,
    upcoming: 0,
    completed: 0,
    onHold: 0,
  };

  const money = {
    total: 0,
    received: 0,
    pendingAdvance: 0,
    pendingBalance: 0,
    pendingTotal: 0,
  };

  for (const p of relevantProjects) {
    if (p.status === 'in_progress') counts.active++;
    else if (p.status === 'upcoming') counts.upcoming++;
    else if (p.status === 'completed') counts.completed++;
    else if (p.status === 'on_hold') counts.onHold++;

    const share = isArijeet ? p.arijeetShare : p.priyaShare;
    if (share) {
      money.total += share.totalAmount;
      money.received += share.receivedAmount;
      money.pendingAdvance += share.pendingAdvance;
      money.pendingBalance += share.pendingBalance;
      money.pendingTotal += share.pendingTotal;
    }
  }

  return { counts, money };
}

export interface SharedSummary {
  counts: {
    total: number;
    active: number;
    upcoming: number;
    completed: number;
    onHold: number;
  };
  overallMoney: {
    total: number;
    received: number;
    pendingAdvance: number;
    pendingBalance: number;
    pendingTotal: number;
  };
  arijeetMoney: {
    total: number;
    received: number;
    pendingAdvance: number;
    pendingBalance: number;
    pendingTotal: number;
  };
  arijitMoney: {
    total: number;
    received: number;
    pendingAdvance: number;
    pendingBalance: number;
    pendingTotal: number;
  };
  priyaMoney: {
    total: number;
    received: number;
    pendingAdvance: number;
    pendingBalance: number;
    pendingTotal: number;
  };
}

/**
 * Computes summary statistics for shared projects.
 */
export function computeSharedSummary(projects: ComputedProject[]): SharedSummary {
  const sharedList = projects.filter((p) => p.ownership === 'shared');

  const counts = {
    total: sharedList.length,
    active: 0,
    upcoming: 0,
    completed: 0,
    onHold: 0,
  };

  const overallMoney = {
    total: 0,
    received: 0,
    pendingAdvance: 0,
    pendingBalance: 0,
    pendingTotal: 0,
  };

  const arijeetMoney = {
    total: 0,
    received: 0,
    pendingAdvance: 0,
    pendingBalance: 0,
    pendingTotal: 0,
  };

  const priyaMoney = {
    total: 0,
    received: 0,
    pendingAdvance: 0,
    pendingBalance: 0,
    pendingTotal: 0,
  };

  for (const p of sharedList) {
    if (p.status === 'in_progress') counts.active++;
    else if (p.status === 'upcoming') counts.upcoming++;
    else if (p.status === 'completed') counts.completed++;
    else if (p.status === 'on_hold') counts.onHold++;

    overallMoney.total += p.overall.totalAmount;
    overallMoney.received += p.overall.receivedAmount;
    overallMoney.pendingAdvance += p.overall.pendingAdvance;
    overallMoney.pendingBalance += p.overall.pendingBalance;
    overallMoney.pendingTotal += p.overall.pendingTotal;

    if (p.arijeetShare) {
      arijeetMoney.total += p.arijeetShare.totalAmount;
      arijeetMoney.received += p.arijeetShare.receivedAmount;
      arijeetMoney.pendingAdvance += p.arijeetShare.pendingAdvance;
      arijeetMoney.pendingBalance += p.arijeetShare.pendingBalance;
      arijeetMoney.pendingTotal += p.arijeetShare.pendingTotal;
    }

    if (p.priyaShare) {
      priyaMoney.total += p.priyaShare.totalAmount;
      priyaMoney.received += p.priyaShare.receivedAmount;
      priyaMoney.pendingAdvance += p.priyaShare.pendingAdvance;
      priyaMoney.pendingBalance += p.priyaShare.pendingBalance;
      priyaMoney.pendingTotal += p.priyaShare.pendingTotal;
    }
  }

  return {
    counts,
    overallMoney,
    arijeetMoney,
    arijitMoney: arijeetMoney,
    priyaMoney,
  };
}
