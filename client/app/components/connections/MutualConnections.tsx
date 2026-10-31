import { useEffect } from "react";
import { useFetcher } from "react-router";
import { Users } from "lucide-react";

interface Props {
  targetUsername: string;
}

export function MutualConnections({ targetUsername }: Props) {
  const fetcher = useFetcher();
  
  useEffect(() => {
    if (!fetcher.data) {
      fetcher.load(`/api/connections/mutual/${targetUsername}`);
    }
  }, [targetUsername, fetcher]);
  
  if (!fetcher.data) {
    return <div className="h-6 w-20 bg-slate-100 rounded animate-pulse" />;
  }
  
  const { count, previews } = fetcher.data as { count: number; previews: Array<{ avatarUrl?: string; displayName: string }> };
  
  if (count === 0) return null;
  
  return (
    <div className="flex items-center gap-2 text-xs text-slate-600">
      <Users size={14} className="text-purple-600" />
      <span className="font-medium">{count} mutual</span>
      {previews.length > 0 && (
        <div className="flex -space-x-1.5">
          {previews.slice(0, 3).map((preview, i) => (
            <div 
              key={i}
              className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white overflow-hidden"
              title={preview.displayName}
            >
              {preview.avatarUrl ? (
                <img src={preview.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400" />
              )}
            </div>
          ))}
          {previews.length > 3 && (
            <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-slate-500">
              +{previews.length - 3}
            </div>
          )}
        </div>
      )}
    </div>
  );
}