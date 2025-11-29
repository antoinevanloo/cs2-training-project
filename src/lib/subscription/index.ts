// Configuration des tiers
export {
  type Feature,
  type TierConfig,
  TIER_CONFIGS,
  FEATURE_LABELS,
  getTierConfig,
  hasFeature,
  getTierLimits,
  isDemoLimitReached,
  isStorageLimitReached,
  getVisibleHistoryDate,
  getPurchasableTiers,
  isTierHigherThan,
} from './tiers';

// Permissions et vérifications
export {
  type UserWithSubscription,
  type PermissionResult,
  isSubscriptionExpired,
  getEffectiveTier,
  isAdmin,
  canAccessFeature,
  canUploadDemo,
  canViewFullHistory,
  canExportPdf,
  canAccessAiCoaching,
  incrementDemoCount,
  resetDemoCountIfNeeded,
  isTeamMember,
  hasTeamRole,
  canViewTeamMemberDemos,
  canManageTeamMembers,
  getUserSubscription,
  checkPermission,
} from './permissions';