
export function StudentCardSkeleton({ compact = false }: { compact?: boolean }) {
    if (compact) {
        return (
            <div className="bg-white rounded-2xl p-3 border border-slate-100 animate-pulse">
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="w-14 h-14 rounded-full bg-slate-200" />
                    <div className="w-20 h-3.5 rounded-full bg-slate-200" />
                    <div className="w-14 h-3 rounded-full bg-slate-100" />
                    <div className="w-16 h-5 rounded-full bg-slate-100 mt-1" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-4 border border-slate-100 animate-pulse flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="w-32 h-3.5 rounded-full bg-slate-200" />
                <div className="w-24 h-3 rounded-full bg-slate-100" />
                <div className="flex gap-1.5 mt-1">
                    <div className="w-16 h-5 rounded-full bg-slate-100" />
                    <div className="w-14 h-5 rounded-full bg-slate-100" />
                </div>
            </div>
        </div>
    );
}