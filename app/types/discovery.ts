export type DiscoverSearchData = {
  results: Array<{
    id: string;
    userId: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    school?: string;
    region?: string;
    level: string;
    subjects: string[];
    matchScore?: number;
  }>;
  hasNextPage: boolean;
  query: string;
  filters: { level?: string; region?: string; subject?: string };
};

export type DiscoverSuggestionsData = {
  suggestions: Array<{
    id: string;
    userId: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    school?: string;
    region?: string;
    level: string;
    subjects: string[];
    matchReason: string;
  }>;
};