export type Course = {
    slug: string;
    id: string;
    description: string | null;
    level: "olevel" | "alevel";
    title: string;
    thumbnailUrl: string | null;
    subject: string;
}