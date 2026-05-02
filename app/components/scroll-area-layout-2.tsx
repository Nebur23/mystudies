import { Badge } from "~/components/ui/badge";
import { ScrollArea, ScrollBar } from "~/components/ui/scroll-area";

export const title = "Scrollable Tags";

const tags = [
  "React",
  "Next.js",
  "TypeScript",
  "Tailwind CSS",
  "shadcn/ui",
  "Radix UI",
  "JavaScript",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "GraphQL",
  "REST API",
  "Docker",
  "Kubernetes",
  "AWS",
  "Vercel",
  "Git",
  "GitHub",
  "CI/CD",
];

const SubjectList = () => (
  <div className="w-full max-w-md space-y-2">
    <h3 className="text-sm font-semibold">Categories</h3>
    <ScrollArea className="w-full rounded-md  whitespace-nowrap">
      <div className="flex w-max space-x-2 p-0">
        {tags.map((tag) => (
          <Badge key={tag} variant="ghost"className="p-5 border border-gray-300">
            {tag}
          </Badge>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  </div>
);

export default SubjectList;
