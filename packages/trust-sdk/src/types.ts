export type TrustRole = 'buyer' | 'seller' | 'employer' | 'worker' | 'freelancer' | 'organiser' | 'influencer' | 'investor';
export type TrustBand = 'AAA' | 'AAB' | 'ABB' | 'BBB' | 'BBC' | 'BCC' | 'CCC' | 'DDD';
export type TrustMode = 'onboarding' | 'recovery' | 'normal';
export type TrustPillarName = 'transaction_discipline' | 'payment_reliability' | 'consistency_volume' | 'dispute_resolution' | 'peer_feedback';
export type TrustEndorsementCategory = 'reliability' | 'quality' | 'collaboration' | 'innovation' | 'professionalism' | 'responsiveness';
export type TrustEventType =
  | 'RFQ' | 'QUOTE' | 'ORDER' | 'DISPATCH' | 'DELIVERED' | 'RETURN'
  | 'ESCROW_FUNDED' | 'ESCROW_RELEASED' | 'PAYMENT_LATE' | 'CHARGEBACK'
  | 'DISPUTE_OPENED' | 'LIABLE_PARTY_SET' | 'DISPUTE_RESOLVED'
  | 'REVIEW_CREATED' | 'REVIEW_VERIFIED'
  | 'KYC_VERIFIED' | 'GST_CIN_VERIFIED' | 'ASSOCIATION_VERIFIED'
  | 'ENQUIRY_QUALIFIED' | 'EVENT_ATTEND' | 'COMMENT_VERIFIED'
  | 'ENDORSEMENT_CREATED' | 'ENDORSEMENT_ACCEPTED' | 'ENDORSEMENT_REVOKED' | 'ENDORSEMENT_PENALIZED';

export interface TrustEvent {
  entityType: string;
  entityId: string;
  eventType: string;
  role: TrustRole;
  rawValue: number;
  metadata?: Record<string, any>;
}

export interface TrustEventResult {
  success: boolean;
  entityId: string;
  role: string;
  pillar: string;
  delta: number;
  newScore: number;
  newBand: TrustBand;
  prevScore: number;
  prevBand: TrustBand;
}

export interface TrustProfile {
  company: {
    company_score: number;
    company_band: TrustBand;
    company_confidence: number;
    company_mode: TrustMode;
    active_roles: TrustRole[];
  };
  roles: TrustRoleScore[];
  badges: TrustBadge[];
  endorsementCount: number;
}

export interface TrustRoleScore {
  role: TrustRole;
  score: number;
  band: TrustBand;
  confidence: number;
  mode: TrustMode;
  pillars: TrustPillarScore[];
}

export interface TrustPillarScore {
  pillar: TrustPillarName;
  pillar_value: number;
  max_points: number;
  scored_points: number;
  coverage: number;
}

export interface TrustBadge {
  id: string;
  badge_name: string;
  icon: string;
  color: string;
  badge_tier: string;
  trust_impact: number;
  earned_at: string;
}

export interface TrustVerification {
  entityType: string;
  entityId: string;
  score: number;
  band: TrustBand;
  confidence: number;
  verified: boolean;
  verifiedAt: string;
  badgeCount: number;
  endorsementCount: number;
}

export interface TrustEndorsement {
  id: string;
  endorserType: string;
  endorserId: string;
  category: TrustEndorsementCategory;
  categoryLabel?: string;
  categoryWeight?: number;
  rating: number;
  message: string;
  riskShareBps: number;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'active';
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  event: string;
  timestamp: string;
  data: Record<string, any>;
}

export interface WebhookEndpointConfig {
  url: string;
  events: string[];
  description?: string;
}

export interface SDKConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

// ── Trade Credit Types ──────────────────────────────────────────

export interface CreditRelationship {
  id: string;
  creditorEntityType: string;
  creditorEntityId: string;
  debtorEntityType: string;
  debtorEntityId: string;
  creditLimit: number;
  currentOutstanding: number;
  totalExtended: number;
  totalRepaid: number;
  totalDefaulted: number;
  onTimeRepayments: number;
  lateRepayments: number;
  defaults: number;
  relationshipScore: number;
  status: string;
  firstCreditAt: string | null;
  lastActivityAt: string | null;
}

export interface CreditEvent {
  id: string;
  relationshipId: string;
  eventType: 'credit_extended' | 'credit_repaid' | 'credit_defaulted' | 'credit_partial';
  amount: number;
  outstandingAfter: number;
  dueDate: string | null;
  paidDate: string | null;
  daysOverdue: number;
  isOnTime: boolean | null;
  invoiceRef: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreditLimitResult {
  suggestedLimit: number;
  band: string;
  score: number;
  confidence: number;
  medianTxValue: number;
  factors: Record<string, any>;
}

export interface CreditReport {
  entity: { entityType: string; entityId: string };
  trustProfile: any;
  creditSummary: {
    totalExtended: number;
    totalRepaid: number;
    totalDefaulted: number;
    currentOutstanding: number;
    onTimeRate: number;
    defaultRate: number;
  };
  relationships: CreditRelationship[];
  recentEvents: CreditEvent[];
  riskIndicators: Record<string, any>;
}

export interface ExtendCreditParams {
  creditorType: string;
  creditorId: string;
  debtorType: string;
  debtorId: string;
  amount: number;
  dueDate?: string;
  invoiceRef?: string;
  notes?: string;
}

export interface RecordRepaymentParams {
  creditorType: string;
  creditorId: string;
  debtorType: string;
  debtorId: string;
  amount: number;
  invoiceRef?: string;
}

export interface RecordDefaultParams {
  creditorType: string;
  creditorId: string;
  debtorType: string;
  debtorId: string;
  amount: number;
  invoiceRef?: string;
  notes?: string;
}
