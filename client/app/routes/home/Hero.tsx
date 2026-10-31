import { HeroCards } from "./HeroCards";
import { Link } from "react-router";
import { ArrowRight, BookOpen, GraduationCap } from "lucide-react";

export const Hero = () => {
  return (
    <section className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 lg:px-8 lg:py-16">
      <div className="flex flex-col items-start">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-primary shadow-sm">
          <GraduationCap size={15} aria-hidden="true" />
          Learning built for GCE students
        </div>

        <h1 className="max-w-2xl font-sora text-[clamp(2.75rem,6vw,4.75rem)] font-semibold leading-[1.08] tracking-tight text-primary">
          Learn better.
          <span className="mt-1 block text-secondary">Grow further.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
          Build confidence for your exams with structured courses, focused practice, and a community that helps you keep moving forward.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Link
            to="/courses"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Explore courses
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <Link
            to="/practice"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-white/70 px-6 text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <BookOpen size={17} aria-hidden="true" />
            Start practising
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
          <span>O-Level and A-Level</span>
          <span className="hidden size-1 rounded-full bg-secondary sm:block" aria-hidden="true" />
          <span>Courses, practice, and progress</span>
        </div>
      </div>

      <div className="w-full min-w-0">
        <HeroCards />
      </div>
    </section>
  );
};