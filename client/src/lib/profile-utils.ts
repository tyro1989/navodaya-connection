import type { User } from "@shared/schema";

/**
 * Checks if a user's profile has all the mandatory JNV fields completed
 * Mandatory fields: name, batchYear, state, district, password
 * Optional fields: email, profession
 */
export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;

  // Check all mandatory fields including password
  const mandatoryFields = [
    user.name?.trim(),
    user.batchYear,
    user.state?.trim(),
    user.district?.trim(),
    user.password // Password is also required for profile completion
  ];

  // All mandatory fields must be present and non-empty
  return mandatoryFields.every(field => 
    field !== undefined && field !== null && field !== ""
  );
}

/**
 * Gets the missing mandatory fields for a user
 */
export function getMissingProfileFields(user: User | null): string[] {
  if (!user) return ["All profile information"];

  const missingFields: string[] = [];

  if (!user.name?.trim()) missingFields.push("Full Name");
  if (!user.batchYear) missingFields.push("JNV Batch Year");
  if (!user.state?.trim()) missingFields.push("JNV State");
  if (!user.district?.trim()) missingFields.push("JNV District");
  if (!user.password) missingFields.push("Password");

  return missingFields;
}

/**
 * Gets completion percentage for user profile
 */
export function getProfileCompletionPercentage(user: User | null): number {
  if (!user) return 0;

  const totalRequiredFields = 5; // name, batchYear, state, district, password
  let completedFields = 0;

  if (user.name?.trim()) completedFields++;
  if (user.batchYear) completedFields++;
  if (user.state?.trim()) completedFields++;
  if (user.district?.trim()) completedFields++;
  if (user.password) completedFields++;

  return Math.round((completedFields / totalRequiredFields) * 100);
}

/**
 * Check if user has completed onboarding (stored in localStorage)
 */
export function hasCompletedOnboarding(userId: number | null): boolean {
  if (!userId) return false;
  const stored = localStorage.getItem(`onboarding_completed_${userId}`);
  return stored === 'true';
}

/**
 * Mark onboarding as completed for a user
 */
export function markOnboardingCompleted(userId: number): void {
  localStorage.setItem(`onboarding_completed_${userId}`, 'true');
}

/**
 * Reset onboarding status for a user (useful for testing)
 */
export function resetOnboardingStatus(userId: number): void {
  localStorage.removeItem(`onboarding_completed_${userId}`);
}

/**
 * Get detailed profile completion status for debugging
 */
export function getProfileCompletionDetails(user: User | null): {
  isComplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  hasCompletedOnboarding: boolean;
  details: {
    name: boolean;
    batchYear: boolean;
    state: boolean;
    district: boolean;
    password: boolean;
  };
} {
  if (!user) {
    return {
      isComplete: false,
      missingFields: ["All profile information"],
      completionPercentage: 0,
      hasCompletedOnboarding: false,
      details: {
        name: false,
        batchYear: false,
        state: false,
        district: false,
        password: false,
      }
    };
  }

  const details = {
    name: !!(user.name?.trim()),
    batchYear: !!user.batchYear,
    state: !!(user.state?.trim()),
    district: !!(user.district?.trim()),
    password: !!user.password,
  };

  return {
    isComplete: isProfileComplete(user),
    missingFields: getMissingProfileFields(user),
    completionPercentage: getProfileCompletionPercentage(user),
    hasCompletedOnboarding: hasCompletedOnboarding(user.id),
    details
  };
}