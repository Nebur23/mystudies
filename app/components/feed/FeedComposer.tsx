import { useState } from "react";
import { useFetcher } from "react-router";
import { Image, Link2, Smile, Send, ChevronDown } from "lucide-react";

interface Props {
  currentUser: {
    id: string;
    userId: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
    school: string | null;
    region: "northwest" | "southwest" | "littoral" | "centre" | "west" | "adamawa" | "north" | "east" | "south" | "far_north" | null;
    level: "olevel" | "alevel";
    subjects: string[] | null;
};
  onActivityCreated?: (activity: any) => void;
}

export function FeedComposer({ currentUser, onActivityCreated }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activityType, setActivityType] = useState("quiz_completed");
  const [visibility, setVisibility] = useState("public");
  const [content, setContent] = useState<Record<string, any>>({});
  
  const fetcher = useFetcher();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    fetcher.submit(
      {
        type: activityType,
        content: JSON.stringify(content),
        visibility,
      },
      { method: "POST", action: "/api/feed/create" }
    );
    
    if (fetcher.data?.success) {
      onActivityCreated?.(fetcher.data.activity);
      // Reset form
      setContent({});
      setExpanded(false);
    }
  };
  
  // Render type-specific fields
  const renderTypeFields = () => {
    switch (activityType) {
      case "quiz_completed":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Subject</label>
              <select
                value={content.subject || ""}
                onChange={(e) => setContent({...content, subject: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
              >
                <option value="">Select subject</option>
                {["Mathematics", "Physics", "Chemistry", "Biology", "English", "French"].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Score</label>
                <input
                  type="number"
                  value={content.score || ""}
                  onChange={(e) => setContent({...content, score: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="18"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Total Questions</label>
                <input
                  type="number"
                  value={content.totalQuestions || ""}
                  onChange={(e) => setContent({...content, totalQuestions: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="20"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Paper</label>
              <input
                type="text"
                value={content.paper || ""}
                onChange={(e) => setContent({...content, paper: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Paper 1 (MCQ)"
              />
            </div>
          </div>
        );
      
      case "badge_earned":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Badge Name</label>
              <input
                type="text"
                value={content.badgeName || ""}
                onChange={(e) => setContent({...content, badgeName: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="Week Warrior"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Badge Icon (emoji)</label>
              <input
                type="text"
                value={content.badgeIcon || ""}
                onChange={(e) => setContent({...content, badgeIcon: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="🔥"
                maxLength={2}
              />
            </div>
          </div>
        );
      
      case "note_shared":
      case "question_asked":
        return (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {activityType === "note_shared" ? "Share a study note" : "Ask a question"}
            </label>
            <textarea
              value={content.note || content.question || ""}
              onChange={(e) => setContent({
                ...content, 
                [activityType === "note_shared" ? "note" : "question"]: e.target.value 
              })}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              placeholder={activityType === "note_shared" 
                ? "Share a tip that helped you..." 
                : "What are you stuck on?"}
            />
          </div>
        );
      
      default:
        return (
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Message</label>
            <textarea
              value={content.message || ""}
              onChange={(e) => setContent({...content, message: e.target.value})}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
              placeholder="What's on your mind?"
            />
          </div>
        );
    }
  };
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <fetcher.Form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-slate-200 overflow-hidden">
            
             {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.displayName} className="w-full h-full object-cover" />
                  ) : (
                    currentUser?.displayName.charAt(0)
                  )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex-1 text-left px-4 py-2.5 bg-slate-100 rounded-full text-sm text-slate-500 hover:bg-slate-200 transition-colors"
          >
            {expanded ? "Share an update..." : `What did you accomplish, @${currentUser.username}?`}
          </button>
        </div>
        
        {/* Expanded Form */}
        {expanded && (
          <div className="space-y-4 animate-in slide-in-from-top-2">
            {/* Activity Type Selector */}
            <div className="relative">
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full appearance-none px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              >
                <option value="quiz_completed">📚 Completed a Quiz</option>
                <option value="badge_earned">🏆 Earned a Badge</option>
                <option value="streak_milestone">🔥 Study Streak</option>
                <option value="leaderboard_rank">⭐ Leaderboard Rank</option>
                <option value="note_shared">📝 Share a Note</option>
                <option value="question_asked">❓ Ask a Question</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            
            {/* Type-Specific Fields */}
            {renderTypeFields()}
            
            {/* Visibility Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Visibility</label>
              <div className="flex gap-2">
                {[
                  { value: "public", label: "Public", icon: "🌍" },
                  { value: "connections_only", label: "Connections", icon: "👥" },
                  { value: "private", label: "Only Me", icon: "🔒" },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value)}
                    className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      visibility === opt.value
                        ? "border-purple-600 bg-purple-50 text-purple-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-purple-300"
                    }`}
                  >
                    <span>{opt.icon}</span> {opt.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <button type="button" className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Image size={18} />
                </button>
                <button type="button" className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Link2 size={18} />
                </button>
                <button type="button" className="p-2 text-slate-500 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors">
                  <Smile size={18} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setContent({});
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fetcher.state === "submitting" || !Object.keys(content).length}
                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  {fetcher.state === "submitting" ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </fetcher.Form>
    </div>
  );
}