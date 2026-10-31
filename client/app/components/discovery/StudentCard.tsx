import { Link } from "react-router";
import { School, MapPin, BookOpen, Star } from "lucide-react";

interface Props {
  user: {
    id: string;
    userId: string;
    displayName: string;
    username: string;
    avatarUrl?: string;
    school?: string;
    region?: string;
    level: string;
    subjects: string[];
    matchReason?: string;
  };
  compact?: boolean;
}

export function StudentCard({ user, compact = false }: Props) {
  const matchLabels: Record<string, string> = {
    same_school: "Same School",
    same_region: "Same Region",
    same_subject: "Same Subject",
    recommended: "Recommended"
  };

  if (compact) {
    return (
      <Link 
        to={`/profile/${user.username}`}
        className="bg-white rounded-xl p-3 border border-slate-200 hover:border-purple-300 transition-all active:scale-95"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
            {user.avatarUrl ? (
              <img src={user?.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.displayName?.charAt(0)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-slate-900 truncate">{user.displayName}</p>
            <p className="text-xs text-slate-500 truncate">@{user.username}</p>
          </div>
        </div>
        {user.matchReason && (
          <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
            <Star size={10} /> {matchLabels[user.matchReason]}
          </span>
        )}
      </Link>
    );
  }

  return (
    <Link 
      to={`/profile/${user.username}`}
      className="block bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 transition-all active:scale-[0.98]"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            user.displayName.charAt(0)
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-slate-900 truncate">{user.displayName}</h3>
              <p className="text-xs text-slate-500">@{user.username}</p>
            </div>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium whitespace-nowrap">
              {user.level === "olevel" ? "O-Level" : "A-Level"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-600">
            {user.school && (
              <span className="flex items-center gap-1">
                <School size={12} /> {user.school}
              </span>
            )}
            {user.region && (
              <span className="flex items-center gap-1 capitalize">
                <MapPin size={12} /> {user.region.replace("_", " ")}
              </span>
            )}
          </div>

          {user.subjects.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user.subjects.slice(0, 3).map(subject => (
                <span key={subject} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                  {subject}
                </span>
              ))}
              {user.subjects.length > 3 && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                  +{user.subjects.length - 3}
                </span>
              )}
            </div>
          )}

          {user.matchReason && (
            <div className="mt-2 pt-2 border-t border-slate-100">
              <span className="inline-flex items-center gap-1 text-xs text-purple-700 font-medium">
                <Star size={12} /> {matchLabels[user.matchReason]} match
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}