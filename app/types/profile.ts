// types/profile.ts
export type UserLevel = 'olevel' | 'alevel';
export type CameroonRegion = 
  | 'northwest' | 'southwest' | 'littoral' | 'centre' 
  | 'west' | 'adamawa' | 'north' | 'east' | 'south';

export type SocialLinks = {
  whatsapp?: string;
  instagram?: string;
  tiktok?: string;
};

export type PrivacySettings = {
  isPublic: boolean;
  showStats: boolean;
  showSubjects: boolean;
  showBadges: boolean;
  allowDirectMessages: boolean;
  allowFriendRequests: boolean;
};

export type StudentProfile = {
  // Core
  id: string;
  userId: string;
  
  // Educational
  level: UserLevel;
  school?: string;
  location?: string;
  region?: CameroonRegion;
  
  // Social/Profile
  displayName: string;
  username: string; // unique @handle
  bio?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  
  // Study Preferences
  subjects: string[];
  targetExamYear?: number;
  studyGoals: string[];
  
  // Privacy
  privacy?: PrivacySettings;
  
  // Social
  socialLinks?: SocialLinks;
  
  // Metadata
  onboardCompletedAt?: Date;
  lastActiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Computed (not in DB)
  isOwner?: boolean;
  canEdit?: boolean;
  completionScore?: number;
};

export type ProfileLoaderData = StudentProfile & {
  stats?: {
    papersCompleted: number;
    accuracy: number;
    currentStreak: number;
    badges: Array<{ id: string; name: string; icon: string }>;
  };
};