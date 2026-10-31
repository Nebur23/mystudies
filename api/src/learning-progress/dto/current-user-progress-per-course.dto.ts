import { UserSession } from "@thallesp/nestjs-better-auth";

export class CurrentLearningProgressDto {
    courses: {
        slug: string;
        id: string;
        description: string | null;
        level: "olevel" | "alevel";
        title: string;
        thumbnailUrl: string | null;
        subject: string;
    }[];

    session: UserSession
    

}
