import { useState } from "react";

// app/routes/admin.courses.new.tsx (simplified)
export default function NewCourseForm() {
  const [courseData, setCourseData] = useState({ /* ... */ });
  
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Call API to create course + modules + lessons
    // Use extractYouTubeId() on each video URL
  };

  return null

 
}