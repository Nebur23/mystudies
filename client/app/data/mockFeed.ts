
export const mockFeedData = [
  {
    id: "act_1",
    userId: "usr_1",
    type: "quiz_completed",
    content: {
      subject: "Mathematics",
      paper: "Paper 1 (MCQ)",
      score: 18,
      totalQuestions: 20,
      timeSpent: 1350, // seconds
    },
    visibility: "public",
    likesCount: 12,
    commentsCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // 10 mins ago
    displayName: "Emmanuel Njoya",
    username: "emmanuel_math",
    avatarUrl: "", // Empty to test initials fallback
    level: "alevel",
    isLiked: false,
  },
  {
    id: "act_2",
    userId: "usr_2",
    type: "badge_earned",
    content: {
      badgeName: "Week Warrior",
      badgeIcon: "🔥",
    },
    visibility: "public",
    likesCount: 24,
    commentsCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    displayName: "Aisha Bello",
    username: "aisha_b",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=aisha", // Test with URL
    level: "olevel",
    isLiked: true,
  },
  {
    id: "act_3",
    userId: "usr_3",
    type: "streak_milestone",
    content: {
      streakDays: 7,
    },
    visibility: "connections_only",
    likesCount: 5,
    commentsCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    displayName: "John Tamba",
    username: "john_physics",
    avatarUrl: "",
    level: "alevel",
    isLiked: false,
  },
  {
    id: "act_4",
    userId: "usr_4",
    type: "note_shared",
    content: {
      note: "💡 Tip: Always check the oxidation states in redox reactions! If Mn goes from +7 to +2, it gains 5 electrons.",
    },
    visibility: "public",
    likesCount: 8,
    commentsCount: 4,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    displayName: "Sarah Mbeki",
    username: "sarah_chem",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    level: "olevel",
    isLiked: false,
  },
  {
    id: "act_5",
    userId: "usr_5",
    type: "leaderboard_rank",
    content: {
      rank: 1,
      category: "A-Level Physics",
    },
    visibility: "public",
    likesCount: 45,
    commentsCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    displayName: "Michael Fonyuy",
    username: "mike_topp",
    avatarUrl: "",
    level: "alevel",
    isLiked: true,
  },
  {
    id: "act_6",
    userId: "usr_6",
    type: "question_asked",
    content: {
      question: "Can someone help me with Question 4 on the 2023 Biology Paper 2? I'm stuck on the respiration part.",
    },
    visibility: "public",
    likesCount: 2,
    commentsCount: 8,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
    displayName: "Grace Ngum",
    username: "grace_bio",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=grace",
    level: "olevel",
    isLiked: false,
  },
];