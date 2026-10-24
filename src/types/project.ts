export type ProjectOwnership = 'arijeet' | 'arijit' | 'shared' | 'priya' | 'mine';

export type ProjectStatus = 'upcoming' | 'in_progress' | 'completed' | 'on_hold';

export interface Project {
  id: string;
  title: string;
  institute: string;
  description?: string;
  ownership: ProjectOwnership;
  startDate: string; // ISO date 'YYYY-MM-DD'
  tentativeDeadline: string; // ISO date 'YYYY-MM-DD'
  actualCompletionDate?: string; // ISO date 'YYYY-MM-DD'
  totalAmount: number; // Integer paise
  advancePercent: number; // 0 to 100, default 50
  advanceReceived: boolean;
  advanceReceivedDate?: string; // ISO date 'YYYY-MM-DD'
  balanceReceived: boolean;
  balanceReceivedDate?: string; // ISO date 'YYYY-MM-DD'
  status: ProjectStatus;
  mySharePercent?: number; // 0 to 100, Arijeet's share in shared projects (default 50)
  notes?: string;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface PersonShareBreakdown {
  totalAmount: number; // paise
  advanceAmount: number; // paise
  balanceAmount: number; // paise
  advanceReceived: boolean;
  advanceReceivedDate?: string;
  balanceReceived: boolean;
  balanceReceivedDate?: string;
  receivedAmount: number; // paise
  pendingAdvance: number; // paise
  pendingBalance: number; // paise
  pendingTotal: number; // paise
}

export interface ComputedProject extends Project {
  isOverdue: boolean;
  overall: PersonShareBreakdown;
  arijeetShare: PersonShareBreakdown;
  // Aliases for compatibility
  arijitShare: PersonShareBreakdown;
  priyaShare?: PersonShareBreakdown;
  myShare: PersonShareBreakdown;
  partnerShare?: PersonShareBreakdown;
}

export interface AppSettings {
  currencySymbol: string; // default "₹"
  defaultAdvancePercent: number; // default 50
  defaultMySharePercent: number; // default 50
}
