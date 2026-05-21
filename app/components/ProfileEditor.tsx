// components/profile/ProfileEditor.tsx
import { useFetcher } from "react-router";
import { Upload, X } from "lucide-react";
import type { StudentProfile } from "~/types/profile";

interface Props {
  profile: StudentProfile;
}

export function ProfileEditor({ profile }: Props) {
  const fetcher = useFetcher();
  
  return (
    <fetcher.Form method="POST" action="/api/profile/update" className="space-y-6">
      {/* Avatar Upload */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
            ) : (
              profile.displayName.charAt(0)
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow border border-slate-200 cursor-pointer hover:bg-slate-50">
            <Upload size={14} className="text-slate-600" />
            <input 
              type="file" 
              accept="image/*"
              name="avatarFile"
              className="hidden"
              // Handle upload via Uploadthing in a real implementation
              onChange={(e) => {
                // TODO: Implement Uploadthing upload
                //console.log("File selected:", e.target.files?.[0]);
              }}
            />
          </label>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">Profile Photo</p>
          <p className="text-xs text-slate-500">PNG, JPG up to 2MB</p>
        </div>
      </div>
      
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
          <input
            type="text"
            name="displayName"
            defaultValue={profile.displayName}
            maxLength={50}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            placeholder="How you want to be known"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username @</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 border border-r-0 border-slate-300 rounded-l-lg bg-slate-50 text-slate-500 text-sm">@</span>
            <input
              type="text"
              name="username"
              defaultValue={profile.username}
              pattern="[a-zA-Z0-9_]{3,20}"
              maxLength={20}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-r-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
              placeholder="john_physics_cm"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">3-20 characters, letters/numbers/underscores</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio || ""}
            maxLength={200}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
            placeholder="Tell others about your study goals..."
          />
          <p className="text-xs text-slate-500 text-right mt-1">{(profile.bio?.length || 0)}/200</p>
        </div>
      </div>
      
      {/* Educational Info */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Educational Details</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <select
              name="level"
              defaultValue={profile.level}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="olevel">O-Level</option>
              <option value="alevel">A-Level</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Year</label>
            <select
              name="targetExamYear"
              defaultValue={profile.targetExamYear || ""}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
            >
              <option value="">Select year</option>
              {[2025, 2026, 2027].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">School</label>
          <input
            type="text"
            name="school"
            defaultValue={profile.school || ""}
            maxLength={100}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            placeholder="e.g., Government Bilingual High School"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Region</label>
          <select
            name="region"
            defaultValue={profile.region || ""}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
          >
            <option value="">Select region</option>
            <option value="northwest">Northwest</option>
            <option value="southwest">Southwest</option>
            <option value="littoral">Littoral</option>
            <option value="centre">Centre</option>
            <option value="west">West</option>
            <option value="adamawa">Adamawa</option>
            <option value="north">North</option>
            <option value="east">East</option>
            <option value="south">South</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Subjects</label>
          <div className="flex flex-wrap gap-2">
            {["Mathematics", "English", "French", "Biology", "Physics", "Chemistry", "Geography", "History", "Economics", "Computer Science"].map(subject => {
              const isSelected = profile.subjects?.includes(subject);
              return (
                <label key={subject} className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-all border ${
                  isSelected 
                    ? "bg-purple-100 text-purple-700 border-purple-300" 
                    : "bg-slate-100 text-slate-700 border-slate-200 hover:border-purple-300"
                }`}>
                  <input
                    type="checkbox"
                    name="subjects"
                    value={subject}
                    defaultChecked={isSelected}
                    className="hidden"
                  />
                  {subject}
                </label>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Privacy Settings */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Privacy & Visibility</h3>
        
        <div className="space-y-3">
          <PrivacyToggle
            name="isPublic"
            label="Make profile public"
            description="Let other students find and view your profile"
            defaultChecked={profile.privacy?.isPublic ?? true}
          />
          <PrivacyToggle
            name="showStats"
            label="Show my stats"
            description="Papers completed, accuracy, streaks"
            defaultChecked={profile.privacy?.showStats ?? true}
          />
          <PrivacyToggle
            name="showSubjects"
            label="Show my subjects"
            description="Let others see what you're studying"
            defaultChecked={profile.privacy?.showSubjects ?? true}
          />
          <PrivacyToggle
            name="allowDirectMessages"
            label="Allow direct messages"
            description="Study partners can message you"
            defaultChecked={profile.privacy?.allowDirectMessages ?? true}
          />
        </div>
      </div>
      
      {/* Social Links */}
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">Social Links (Optional)</h3>
        
        <div className="space-y-3">
          <SocialLinkInput 
            name="socialLinks.whatsapp" 
            label="WhatsApp" 
            placeholder="https://wa.me/237..."
            defaultValue={profile.socialLinks?.whatsapp}
          />
          <SocialLinkInput 
            name="socialLinks.instagram" 
            label="Instagram" 
            placeholder="https://instagram.com/..."
            defaultValue={profile.socialLinks?.instagram}
          />
          <SocialLinkInput 
            name="socialLinks.tiktok" 
            label="TikTok" 
            placeholder="https://tiktok.com/..."
            defaultValue={profile.socialLinks?.tiktok}
          />
        </div>
      </div>
      
      {/* Manual Complete Override */}
      <input type="hidden" name="markAsComplete" value="false" />
      
      {/* Submit */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={fetcher.state === "submitting"}
          className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 active:scale-95 transition-all disabled:opacity-50"
        >
          {fetcher.state === "submitting" ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            // Set markAsComplete to true for manual override
            const form = document.querySelector("form") as HTMLFormElement;
            const input = form.querySelector('input[name="markAsComplete"]') as HTMLInputElement;
            if (input) input.value = "true";
            form.requestSubmit();
          }}
          className="px-6 py-3 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
        >
          Mark Complete
        </button>
      </div>
      
      {/* Form Status */}
      {fetcher.data?.errors && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {Object.values(fetcher.data.errors).flat().join(", ")}
        </div>
      )}
    </fetcher.Form>
  );
}

// Sub-components
function PrivacyToggle({ name, label, description, defaultChecked }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
      <div>
        <div className="text-sm font-medium text-slate-900">{label}</div>
        {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          name={name}
          defaultChecked={defaultChecked}
          className="sr-only peer" 
        />
        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
      </label>
    </div>
  );
}

function SocialLinkInput({ name, label, placeholder, defaultValue }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="url"
        name={name}
        defaultValue={defaultValue || ""}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
      />
    </div>
  );
}