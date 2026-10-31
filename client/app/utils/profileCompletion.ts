// lib/profileCompletion.ts
import type { StudentProfile } from "~/types/profile";

type CompletionResult = {
  isComplete: boolean;
  score: number; // 0-100
  missingFields: string[];
  nextSuggestion: string;
};

const COMPLETION_WEIGHTS = [
  { field: 'level' as const, weight: 25, label: 'Exam level' },
  { field: 'displayName' as const, weight: 15, label: 'Display name' },
  { field: 'username' as const, weight: 15, label: 'Username' },
  { 
    field: 'subjects' as const, 
    weight: 20, 
    label: 'At least 1 subject',
    check: (v: any) => Array.isArray(v) && v.length >= 1 
  },
  { field: 'region' as const, weight: 15, label: 'Region' },
  { field: 'school' as const, weight: 10, label: 'School' },
];

export function calculateProfileCompletion(
  profile: any //Partial<StudentProfile>
): CompletionResult {
  let score = 0;
  const missing: string[] = [];
  
  for (const item of COMPLETION_WEIGHTS) {
    const value = profile[item.field];
    const isValid = item.check 
      ? item.check(value) 
      : (value !== undefined && value !== null && value !== '');
    
    if (isValid) {
      score += item.weight;
    } else {
      missing.push(item.label);
    }
  }
  
  const finalScore = Math.min(100, score);
  
  return {
    isComplete: finalScore >= 80, // Threshold for "complete enough"
    score: finalScore,
    missingFields: missing,
    nextSuggestion: missing[0] || "Great job! Your profile is complete.",
  };
}

// Helper to generate default username from name
export function generateUsername(name: string, year?: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 20);
  
  const suffix = year ? `_${year}` : `_${new Date().getFullYear()}`;
  return `${base}${suffix}`;
}