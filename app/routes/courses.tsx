import { Navbar1 } from "~/components/navbar1";
import type { Route } from "./+types/courses";
import SubjectList from "~/components/scroll-area-layout-2";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "App" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

// Dynamic resources array - easy to add/remove video cards
const resources = [
    {
        id: 1,
        title: "Introduction to React",
        description: "Learn the basics of React including components, state, and props in this comprehensive tutorial.",
        videoUrl: "https://www.youtube.com/watch?v=Ke90Tje7VS0",
        thumbnail: "https://img.youtube.com/vi/Ke90Tje7VS0/maxresdefault.jpg",
        duration: "2:30:00",
        category: "React"
    },
    {
        id: 2,
        title: "TypeScript for Beginners",
        description: "A complete guide to TypeScript for JavaScript developers looking to add type safety to their projects.",
        videoUrl: "https://www.youtube.com/watch?v=BwuLxPH8IDs",
        thumbnail: "https://img.youtube.com/vi/BwuLxPH8IDs/maxresdefault.jpg",
        duration: "1:45:00",
        category: "TypeScript"
    },
    {
        id: 3,
        title: "Building REST APIs with Node.js",
        description: "Learn how to create robust REST APIs using Node.js and Express from scratch.",
        videoUrl: "https://www.youtube.com/watch?v=oUVoH9nJ9Oo",
        thumbnail: "https://img.youtube.com/vi/oUVoH9nJ9Oo/maxresdefault.jpg",
        duration: "3:15:00",
        category: "Node.js"
    },
    {
        id: 4,
        title: "CSS Grid Layout Mastery",
        description: "Master CSS Grid layout with practical examples and real-world use cases.",
        videoUrl: "https://www.youtube.com/watch?v=9zBsdzdE4sM",
        thumbnail: "https://img.youtube.com/vi/9zBsdzdE4sM/maxresdefault.jpg",
        duration: "1:20:00",
        category: "CSS"
    },
    {
        id: 5,
        title: "React Hooks Deep Dive",
        description: "Understand useState, useEffect, useContext and custom hooks in depth.",
        videoUrl: "https://www.youtube.com/watch?v=TNhaISOUy6Q",
        thumbnail: "https://img.youtube.com/vi/TNhaISOUy6Q/maxresdefault.jpg",
        duration: "2:00:00",
        category: "React"
    },
    {
        id: 6,
        title: "Git & GitHub Essentials",
        description: "Learn version control with Git and GitHub collaboration workflows.",
        videoUrl: "https://www.youtube.com/watch?v=SWYqp7pYwbU",
        thumbnail: "https://img.youtube.com/vi/SWYqp7pYwbU/maxresdefault.jpg",
        duration: "1:10:00",
        category: "Git"
    }
];

// Helper function to extract YouTube video ID
function getYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "";
}

export default function Courses() {
    return (
        <div className="bg-purple-50">

           
            <div className="px-4 pt-2">
                <SubjectList />
            </div>

            {/* Course List Section */}
            <div className="px-4 py-6">
                <h2 className="text-2xl font-bold mb-4">Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map((resource) => {
                        const videoId = getYouTubeId(resource.videoUrl);
                        return (
                            <div 
                                key={resource.id} 
                                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                            >
                                {/* Video Thumbnail */}
                                <a 
                                    href={resource.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block relative"
                                >
                                    <img 
                                        src={resource.thumbnail} 
                                        alt={resource.title}
                                        className="w-full h-40 object-cover"
                                    />
                                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                                        {resource.duration}
                                    </div>
                                </a>
                                
                                {/* Card Content */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <Badge variant="secondary">{resource.category}</Badge>
                                    </div>
                                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                                        {resource.title}
                                    </h3>
                                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                                        {resource.description}
                                    </p>
                                    <Button asChild className="w-full">
                                        <a 
                                            href={resource.videoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                        >
                                            Watch Video
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
