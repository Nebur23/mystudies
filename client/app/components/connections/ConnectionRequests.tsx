import { useState } from "react";
import { useFetcher, useNavigate } from "react-router";
import { Check, X, User } from "lucide-react";


interface Request {
    id: string;
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    school: string | null;
    subjects: string[] | null;
    connectionContext: "search" | "same_school" | "same_subject" | "leaderboard" | "study_group" | "other" | null;
}

interface Props {
  requests: Request[];
  onAction: (requestId: string, action: "accept" | "decline") => void;
}

export function ConnectionRequests({ requests, onAction }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fetcher = useFetcher();
  const navigate = useNavigate();
  
  const handleAction = (requestId: string, action: "accept" | "decline", targetUserId: string) => {
    setProcessingId(requestId);
    
    fetcher.submit(
      { action, targetUserId },
      { method: "POST", action: "/api/connections/action" }
    );
    
    // Optimistic removal
    onAction(requestId, action);
  };
  
  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <User size={48} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">No pending requests</p>
        <p className="text-sm text-slate-500 mt-1">When someone wants to connect, they'll appear here</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div 
          key={request.id}
          className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-colors"
        >
          <button
            onClick={() => navigate(`/profile/${request.username}`)}
            className="flex items-center gap-3 flex-1 text-left"
          >
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold overflow-hidden">
              {request.avatarUrl ? (
                <img src={request.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                request.displayName.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 truncate">{request.displayName}</p>
              <p className="text-xs text-slate-500">@{request.username}</p>
              {request.school && (
                <p className="text-xs text-slate-600 mt-0.5 truncate">{request.school}</p>
              )}
              {request.subjects && request.subjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {request.subjects.slice(0, 2).map(subject => (
                    <span key={subject} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px]">
                      {subject}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
          
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => handleAction(request.id, "accept", request.userId)}
              disabled={processingId === request.id}
              className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition-colors"
              aria-label="Accept request"
            >
              <Check size={18} />
            </button>
            <button
              onClick={() => handleAction(request.id, "decline", request.userId)}
              disabled={processingId === request.id}
              className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
              aria-label="Decline request"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}