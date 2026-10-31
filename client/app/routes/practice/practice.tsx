import { useState } from "react";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { Link, useLoaderData, useNavigate } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  FileQuestion,
  GraduationCap,
  Layers3,
} from "lucide-react";
import type { Route } from "./+types/practice";

type Level = "olevel" | "alevel";

type AvailablePaper = {
  level: Level;
  subject: string;
  year: number;
  paper: string;
};

type PracticeConfig = {
  level: Level | null;
  subject: string | null;
  year: number | null;
  paper: AvailablePaper | null;
};

const LEVEL_DETAILS: Record<Level, { title: string; description: string }> = {
  olevel: {
    title: "GCE Ordinary Level",
    description: "Prepare for your O-Level examinations.",
  },
  alevel: {
    title: "GCE Advanced Level",
    description: "Prepare for your A-Level examinations.",
  },
};

function toSubjectLabel(subject: string) {
  return subject
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, character => character.toUpperCase());
}

export async function loader(_: Route.LoaderArgs) {
  const questionsDirectory = path.resolve(process.cwd(), "public", "data", "questions");
  const availablePapers: AvailablePaper[] = [];

  const levelEntries = await readdir(questionsDirectory, { withFileTypes: true });
  for (const levelEntry of levelEntries) {
    if (!levelEntry.isDirectory() || !["olevel", "alevel"].includes(levelEntry.name)) continue;
    const level = levelEntry.name as Level;
    const subjectDirectory = path.join(questionsDirectory, level);
    const subjectEntries = await readdir(subjectDirectory, { withFileTypes: true });

    for (const subjectEntry of subjectEntries) {
      if (!subjectEntry.isDirectory()) continue;
      const yearDirectory = path.join(subjectDirectory, subjectEntry.name);
      const yearEntries = await readdir(yearDirectory, { withFileTypes: true });

      for (const yearEntry of yearEntries) {
        if (!yearEntry.isDirectory() || !/^\d{4}$/.test(yearEntry.name)) continue;
        const paperDirectory = path.join(yearDirectory, yearEntry.name);
        const paperEntries = await readdir(paperDirectory, { withFileTypes: true });

        for (const paperEntry of paperEntries) {
          const paperMatch = paperEntry.name.match(/^(paper\d+)\.json$/i);
          if (!paperEntry.isFile() || !paperMatch) continue;

          availablePapers.push({
            level,
            subject: subjectEntry.name.toLowerCase(),
            year: Number(yearEntry.name),
            paper: paperMatch[1].toLowerCase(),
          });
        }
      }
    }
  }

  availablePapers.sort((a, b) =>
    a.level.localeCompare(b.level)
    || a.subject.localeCompare(b.subject)
    || b.year - a.year
    || a.paper.localeCompare(b.paper)
  );

  return { availablePapers };
}

export default function PracticePage() {
  const { availablePapers } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [config, setConfig] = useState<PracticeConfig>({
    level: null,
    subject: null,
    year: null,
    paper: null,
  });
  const [currentStep, setCurrentStep] = useState(1);

  const subjects = config.level
    ? [...new Set(availablePapers
      .filter(paper => paper.level === config.level)
      .map(paper => paper.subject))]
    : [];
  const years = config.level && config.subject
    ? [...new Set(availablePapers
      .filter(paper => paper.level === config.level && paper.subject === config.subject)
      .map(paper => paper.year))]
      .sort((a, b) => b - a)
    : [];
  const papers = config.level && config.subject && config.year
    ? availablePapers.filter(paper =>
      paper.level === config.level
      && paper.subject === config.subject
      && paper.year === config.year
    )
    : [];

  const steps = ["Level", "Subject", "Year", "Paper"];
  const selectionReady = currentStep === 1
    ? config.level !== null
    : currentStep === 2
      ? config.subject !== null
      : currentStep === 3
        ? config.year !== null
        : config.paper !== null;

  const chooseLevel = (level: Level) => {
    setConfig({ level, subject: null, year: null, paper: null });
  };

  const chooseSubject = (subject: string) => {
    setConfig(previous => ({ ...previous, subject, year: null, paper: null }));
  };

  const chooseYear = (year: number) => {
    setConfig(previous => ({ ...previous, year, paper: null }));
  };

  const startPractice = () => {
    if (!config.paper) return;
    const { level, subject, year, paper } = config.paper;
    navigate(`/practice/${level}-${subject}-${year}-${paper}`);
  };

  const renderChoices = () => {
    if (availablePapers.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/5 text-primary">
            <FileQuestion size={22} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Practice papers are coming soon</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            There aren’t any question sets available here yet. Check the library for other study materials.
          </p>
          <Link
            to="/library"
            className="mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Browse the library
          </Link>
        </div>
      );
    }

    if (currentStep === 1) {
      const levels = [...new Set(availablePapers.map(paper => paper.level))];
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {levels.map(level => {
            const count = availablePapers.filter(paper => paper.level === level).length;
            const selected = config.level === level;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseLevel(level)}
                className={`group rounded-2xl border p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:p-6 ${
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <span className={`flex size-11 items-center justify-center rounded-xl ${
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
                }`}>
                  <GraduationCap size={22} aria-hidden="true" />
                </span>
                <span className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-semibold text-foreground">{LEVEL_DETAILS[level].title}</span>
                  {selected && <CheckCircle2 size={19} aria-hidden="true" className="text-primary" />}
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">{LEVEL_DETAILS[level].description}</span>
                <span className="mt-4 block text-xs font-medium text-muted-foreground">
                  {count} {count === 1 ? "paper" : "papers"} available
                </span>
              </button>
            );
          })}
          <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">
            Levels and subjects appear here when practice papers are available.
          </p>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {subjects.map(subject => {
            const selected = config.subject === subject;
            const count = availablePapers.filter(paper =>
              paper.level === config.level && paper.subject === subject
            ).length;
            return (
              <button
                key={subject}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseSubject(subject)}
                className={`flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <BookOpen size={17} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">{toSubjectLabel(subject)}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {count} {count === 1 ? "paper" : "papers"}
                  </span>
                </span>
                {selected && <Check size={18} aria-hidden="true" className="shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      );
    }

    if (currentStep === 3) {
      return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {years.map(year => {
            const selected = config.year === year;
            return (
              <button
                key={year}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseYear(year)}
                className={`flex min-h-14 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  selected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/40"
                }`}
              >
                <CalendarDays size={16} aria-hidden="true" />
                {year}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {papers.map(paper => {
          const selected = config.paper === paper;
          const paperNumber = paper.paper.replace(/^paper/i, "");
          return (
            <button
              key={paper.paper}
              type="button"
              aria-pressed={selected}
              onClick={() => setConfig(previous => ({ ...previous, paper }))}
              className={`flex min-h-20 w-full items-center gap-4 rounded-xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
              }`}
            >
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-primary"
              }`}>
                <Layers3 size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-foreground">Paper {paperNumber}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {paper.paper.toLowerCase().includes("paper1") ? "Multiple choice questions" : "Past examination paper"}
                </span>
              </span>
              {selected && <CheckCircle2 size={20} aria-hidden="true" className="shrink-0 text-primary" />}
            </button>
          );
        })}
      </div>
    );
  };

  const stepTitle = [
    "Choose your examination level",
    "Select a subject",
    "Pick an exam year",
    "Choose a paper",
  ][currentStep - 1];

  const stepDescription = [
    "Start with the GCE level you’re preparing for.",
    "Choose from subjects with papers ready to practise.",
    "Only years with available questions are shown.",
    "Select a paper to begin your practice session.",
  ][currentStep - 1];

  return (
    <main className="min-h-full bg-background px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 sm:mb-8">
          <Link
            to="/students"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10 sm:pb-8">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-secondary">Past paper practice</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Build confidence, one question at a time
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Choose an available GCE paper and work through questions at your own pace.
              </p>
            </div>
            {availablePapers.length > 0 && (
              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                <FileQuestion size={16} aria-hidden="true" className="text-primary" />
                {availablePapers.length} {availablePapers.length === 1 ? "paper" : "papers"} available
              </div>
            )}
          </div>

          {availablePapers.length > 0 && (
            <div className="py-6 sm:py-8">
              <ol aria-label="Practice setup progress" className="mb-8 flex items-center">
                {steps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isComplete = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;
                  return (
                    <li key={step} className="flex min-w-0 flex-1 items-center last:flex-none">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          isComplete
                            ? "bg-secondary text-white"
                            : isCurrent
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                        }`}>
                          {isComplete ? <Check size={15} aria-hidden="true" /> : stepNumber}
                        </span>
                        <span className={`hidden truncate text-xs font-medium sm:block ${
                          isCurrent ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {step}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <span className={`mx-2 h-px min-w-3 flex-1 sm:mx-4 ${
                          isComplete ? "bg-secondary" : "bg-border"
                        }`} aria-hidden="true" />
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="mb-5">
                <p className="text-xs font-semibold text-primary">Step {currentStep} of {steps.length}</p>
                <h2 className="mt-1 text-xl font-semibold text-foreground">{stepTitle}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{stepDescription}</p>
              </div>

              <div key={currentStep} className="animate-in fade-in duration-200">
                {renderChoices()}
              </div>

              {config.paper && (
                <div className="mt-6 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Selected:</span>{" "}
                  {config.level === "alevel" ? "A-Level" : "O-Level"} ·{" "}
                  {toSubjectLabel(config.subject ?? "")} · {config.year} · Paper{" "}
                  {config.paper.paper.replace(/^paper/i, "")}
                </div>
              )}
            </div>
          )}

          {availablePapers.length > 0 && (
            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    setConfig({ level: null, subject: null, year: null, paper: null });
                  } else {
                    setCurrentStep(step => step - 1);
                  }
                }}
                disabled={currentStep === 1}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                Back
              </button>
              {currentStep < steps.length ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(step => step + 1)}
                  disabled={!selectionReady}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
                >
                  Continue
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startPractice}
                  disabled={!config.paper}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
                >
                  <BookOpen size={16} aria-hidden="true" />
                  Start practice
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
