import { Link } from "react-router";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { calculateProfileCompletion } from "~/utils/profileCompletion";
import type { StudentProfile } from "~/types/profile";

interface Props {
  profile: Partial<StudentProfile>;
  onDismiss?: () => void;
}

export function CompleteProfileBanner({ profile, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const completion = calculateProfileCompletion(profile);
  
  // Don't show if complete, dismissed, or user explicitly hid it
  if (completion.isComplete || dismissed || profile.onboardCompletedAt) {
    return null;
  }
  
  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };
  
  return (
    <div 
      role="alert"
      className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 animate-in slide-in-from-top-2"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-amber-900 text-sm">
            Complete your profile ({completion.score}%)
          </h3>
          <p className="text-xs text-amber-800 mt-1 line-clamp-2">
            Add your {completion.nextSuggestion.toLowerCase()} to connect with study partners.
          </p>
          
          <div className="flex gap-2 mt-3">
            <Link
              to="/onboarding/profile"
              className="flex-1 bg-amber-600 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-amber-700 active:scale-95 transition-all text-center"
            >
              Complete Now
            </Link>
            <button
              onClick={handleDismiss}
              className="p-2 text-amber-700 hover:bg-amber-100 rounded-lg transition-colors"
              aria-label="Dismiss reminder"
            >
              <X size={16} />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-amber-200 rounded-full overflow-hidden" aria-hidden="true">
            <div 
              className="h-full bg-amber-600 rounded-full transition-all duration-300"
              style={{ width: `${completion.score}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}