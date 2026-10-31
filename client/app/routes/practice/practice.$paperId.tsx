import { useState, useRef, type Key } from "react";
import { useLoaderData, useRevalidator, Link } from "react-router";
import { usePostHog } from "@posthog/react";
import { LatexText, SolutionRenderer } from "~/components/Tex";
import type { Route } from "./+types/practice.$paperId";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Loader2, ChevronRight, BookOpen, Trophy, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import { parsePaperId } from "~/utils/paperId";
import { Pressable } from "~/components/ui/Pressable";

// ── Loader ────────────────────────────────────────────────────────────────────
export async function clientLoader({ params }: Route.LoaderArgs) {
  const { paperId } = params;
  const parsed = parsePaperId(paperId);
  if (!parsed) throw new Response("Invalid paper ID", { status: 400 });

  try {
    const response = await fetch(
      `/data/questions/${parsed.level}/${parsed.subject}/${parsed.year}/${parsed.paper}.json`
    );

    // ✅ Paper not found — return structured "not found" instead of crashing
    if (!response.ok) {
      return {
        ...parsed,
        questions: null,
        notFound: true,
        meta: { title: `${parsed.subject} ${parsed.year}`, description: "" },
      };
    }

    const questions = await response.json();

    // ✅ Empty or malformed JSON
    if (!Array.isArray(questions) || questions.length === 0) {
      return {
        ...parsed,
        questions: null,
        notFound: true,
        meta: { title: `${parsed.subject} ${parsed.year}`, description: "" },
      };
    }

    return {
      ...parsed,
      questions,
      notFound: false,
      meta: {
        title: `${parsed.subject} — ${parsed.year} ${parsed.paper}`,
        description: `Practice ${parsed.level} ${parsed.subject} past paper`,
      },
    };
  } catch {
    return {
      ...parsed,
      questions: null,
      notFound: true,
      meta: { title: `${parsed.subject} ${parsed.year}`, description: "" },
    };
  }
}

export function meta({ data }: Route.MetaArgs) {
  return [
    { title: data?.meta?.title ?? "Practice Quiz" },
    { name: "description", content: data?.meta?.description ?? "" },
  ];
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Question {
  id: Key;
  question: string;
  options: string[];
  correctAnswer: number;
  solution: string;
}

type AnswerState = "unanswered" | "correct" | "wrong";

type QuizState = {
  currentQuestion: number;
  score: number;
  showResults: boolean;
  answers: number[];          // selected index per question
  answerStates: AnswerState[];
  showSolution: boolean;
  startTime: number;
};

// ── Paper metadata header ─────────────────────────────────────────────────────
function PaperHeader({
  subject, level, year, paper,
}: { subject: string; level: string; year: number; paper: string }) {
  const levelLabel = level === "alevel" ? "A-Level" : "O-Level";
  const paperLabel = paper.replace("paper", "Paper ");
  const subjectLabel = subject.replace(/[_-]+/g, " ").replace(/\b\w/g, character => character.toUpperCase());

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <Pressable
        as={Link}
        to="/practice"
        className="mr-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg pr-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft size={15} aria-hidden="true" /> Back to practice
      </Pressable>
      <span className="hidden h-5 w-px bg-border sm:block" aria-hidden="true" />
      <Badge variant="outline" className="border-primary/15 bg-card text-foreground">{levelLabel}</Badge>
      <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">{subjectLabel}</Badge>
      <Badge variant="outline" className="bg-card">{year}</Badge>
      <Badge variant="outline" className="bg-card">{paperLabel}</Badge>
    </div>
  );
}

// ── Not found state ───────────────────────────────────────────────────────────
function PaperNotFound({
  subject, level, year, paper,
}: { subject: string; level: string; year: number; paper: string }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg rounded-2xl border-border shadow-sm">
        <CardContent className="space-y-4 pb-8 pt-8 text-center sm:px-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertTriangle size={25} aria-hidden="true" />
          </div>
          <div>
            <h2 className="mb-1 text-lg font-semibold text-foreground">Paper not available</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              The <span className="font-medium text-foreground">{level} {subject} {year} {paper.replace("paper", "Paper ")}</span> questions
              haven't been added yet.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            We’re continuously adding past papers. Try another available paper or check back later.
          </p>
          <div className="flex justify-center pt-2">
            <Button asChild variant="default" className="rounded-xl">
              <Pressable as={Link} to="/practice">Browse available papers</Pressable>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Practice() {
  const data = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();
  const posthog = usePostHog();
  const quizStartedRef = useRef(false);

  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    score: 0,
    showResults: false,
    answers: [],
    answerStates: [],
    showSolution: false,
    startTime: Date.now(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);

  // ── Not found guard ─────────────────────────────────────────────────────────
  if (data.notFound || !data.questions) {
    return (
      <PaperNotFound
        subject={data.subject}
        level={data.level}
        year={data.year}
        paper={data.paper}
      />
    );
  }

  const { questions, subject, level, year, paper } = data;
  const currentQ = questions[quizState.currentQuestion] as Question;
  const progress = ((quizState.currentQuestion + 1) / questions.length) * 100;
  const currentAnswer = quizState.answerStates[quizState.currentQuestion];
  const hasAnswered = currentAnswer !== undefined && currentAnswer !== "unanswered";

  // ── Handlers ────────────────────────────────────────────────────────────────

  // ✅ Answer is submitted — feedback shown, solution unlocked, Next button appears
  const handleAnswer = (selectedIndex: number) => {
    if (hasAnswered) return; // prevent double-answer

    if (!quizStartedRef.current) {
      quizStartedRef.current = true;
      posthog?.capture("quiz_started", {
        subject,
        level,
        year,
        paper,
        total_questions: questions.length,
      });
    }

    const isCorrect = selectedIndex === currentQ.correctAnswer;
    const newAnswers = [...quizState.answers, selectedIndex];
    const newAnswerState: AnswerState = isCorrect ? "correct" : "wrong";
    const newStates = [...quizState.answerStates, newAnswerState];
    const newScore = quizState.score + (isCorrect ? 1 : 0);

    setQuizState(s => ({
      ...s,
      answers: newAnswers,
      answerStates: newStates,
      score: newScore,
      showSolution: false,
    }));
  };

  // ✅ Explicit Next button — user reviews feedback before moving
  const handleNext = () => {
    const isLast = quizState.currentQuestion + 1 >= questions.length;
    if (isLast) {
      const percentage = Math.round((quizState.score / questions.length) * 100);
      posthog?.capture("quiz_completed", {
        subject,
        level,
        year,
        paper,
        score: quizState.score,
        total_questions: questions.length,
        percentage,
        time_spent_seconds: Math.round((Date.now() - quizState.startTime) / 1000),
      });
      setQuizState(s => ({ ...s, showResults: true }));
    } else {
      setQuizState(s => ({
        ...s,
        currentQuestion: s.currentQuestion + 1,
        showSolution: false,
      }));
    }
  };

  const toggleSolution = () => {
    setQuizState(s => ({ ...s, showSolution: !s.showSolution }));
  };

  const resetQuiz = () => {
    setScoreSubmitted(false);
    setQuizState({
      currentQuestion: 0,
      score: 0,
      showResults: false,
      answers: [],
      answerStates: [],
      showSolution: false,
      startTime: Date.now(),
    });
  };

  const handleSubmitScore = async () => {
    if (scoreSubmitted || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const timeSpent = Math.round((Date.now() - quizState.startTime) / 1000);
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quizId: `${year}/${level}/${subject}/${paper}`,
          score: quizState.score,
          totalQuestions: questions.length,
          timeSpent,
        }),
      });

      if (!response.ok) throw new Error("Failed to submit score");

      const result = await response.json();
      posthog?.capture("quiz_score_saved", {
        subject,
        level,
        year,
        paper,
        score: quizState.score,
        total_questions: questions.length,
        percentage: Math.round((quizState.score / questions.length) * 100),
        time_spent_seconds: Math.round((Date.now() - quizState.startTime) / 1000),
      });
      toast.success(result.message ?? "Score saved!");
      setScoreSubmitted(true);
      revalidator.revalidate();
    } catch {
      toast.error("Couldn't save score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Option button style ──────────────────────────────────────────────────────
  function optionStyle(index: number): string {
    const base = "flex min-h-14 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ";
    if (!hasAnswered) {
      return base + "border-border bg-card hover:border-primary/40 hover:bg-primary/5";
    }
    if (index === currentQ.correctAnswer) {
      return base + "border-emerald-500 bg-emerald-50 text-emerald-900";
    }
    if (index === quizState.answers[quizState.currentQuestion]) {
      return base + "border-rose-400 bg-rose-50 text-rose-900";
    }
    return base + "border-border bg-card opacity-50";
  }

  // ── Results screen ───────────────────────────────────────────────────────────
  if (quizState.showResults) {
    const percentage = Math.round((quizState.score / questions.length) * 100);
    const timeSpent = Math.round((Date.now() - quizState.startTime) / 1000);
    const minutes = Math.floor(timeSpent / 60);
    const seconds = timeSpent % 60;

    const gradeLabel =
      percentage >= 80 ? "Excellent!" :
        percentage >= 60 ? "Good work" :
          percentage >= 40 ? "Keep practising" :
            "Needs improvement";

    const gradeColor =
      percentage >= 80 ? "text-emerald-700" :
        percentage >= 60 ? "text-primary" :
          percentage >= 40 ? "text-amber-700" :
            "text-rose-700";

    return (
      <main className="min-h-screen bg-background px-4 py-6 pb-20 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-3xl">
          <PaperHeader subject={subject} level={level} year={year} paper={paper} />

          <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
            <div className="h-1.5 bg-muted">
              <div className="h-full bg-secondary" style={{ width: `${percentage}%` }} />
            </div>
            <CardContent className="space-y-6 px-5 py-8 text-center sm:px-8 sm:py-10">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary">
                <Trophy size={26} aria-hidden="true" />
              </div>
              <div>
                <p className={`text-5xl font-semibold tracking-tight tabular-nums ${gradeColor}`}>{percentage}%</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {quizState.score} of {questions.length} correct
                </p>
                <p className={`mt-3 text-xl font-semibold ${gradeColor}`}>{gradeLabel}</p>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-xs font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                  <Target size={14} aria-hidden="true" /> {questions.length} questions
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
                  <Clock size={14} aria-hidden="true" /> {minutes}m {seconds}s
                </span>
              </div>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row">
                <Button
                  onClick={handleSubmitScore}
                  className="flex-1 rounded-xl"
                  disabled={isSubmitting || scoreSubmitted}
                >
                  {isSubmitting ? (
                    <Loader2 size={15} className="mr-2 animate-spin" />
                  ) : (
                    <Trophy size={15} className="mr-2" />
                  )}
                  {scoreSubmitted ? "Score saved" : "Save score"}
                </Button>
                <Button onClick={resetQuiz} variant="outline" className="flex-1 rounded-xl">
                  <RotateCcw size={15} className="mr-2" /> Try again
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="mt-8 space-y-3">
            <div className="flex items-end justify-between gap-3 px-1">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Answer review</h2>
                <p className="mt-1 text-sm text-muted-foreground">Review each response and the correct answer.</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-muted-foreground">
                {quizState.score}/{questions.length} correct
              </span>
            </div>
            {(questions as Question[]).map((q, idx) => {
              const chosen = quizState.answers[idx];
              const isCorrect = chosen === q.correctAnswer;
              return (
                <Card key={q.id} className={`rounded-xl shadow-none ${isCorrect ? "border-emerald-200 bg-emerald-50/30" : "border-rose-200 bg-rose-50/30"}`}>
                  <CardContent className="px-4 py-4 sm:px-5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isCorrect
                          ? <CheckCircle2 size={17} aria-label="Correct" className="text-emerald-700" />
                          : <XCircle size={17} aria-label="Incorrect" className="text-rose-700" />
                        }
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-medium leading-6 text-foreground">
                          Q{idx + 1}. <LatexText text={q.question} />
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-muted-foreground">
                            Your answer: <span className="font-medium text-rose-700">
                              {String.fromCharCode(65 + chosen)}. <LatexText text={q.options[chosen]} />
                            </span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Correct: <span className="font-medium text-emerald-800">
                            {String.fromCharCode(65 + q.correctAnswer)}. <LatexText text={q.options[q.correctAnswer]} />
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </div>
      </main>
    );
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background px-4 py-6 pb-20 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <PaperHeader subject={subject} level={level} year={year} paper={paper} />

        <Card className="overflow-hidden rounded-2xl border-border shadow-sm">
          <CardHeader className="space-y-4 border-b border-border bg-card px-5 pb-5 pt-5 sm:px-7 sm:pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Question</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {quizState.currentQuestion + 1} <span className="font-normal text-muted-foreground">of {questions.length}</span>
                </p>
              </div>
              <div className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                Score: {quizState.score}
              </div>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="Quiz progress"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={quizState.currentQuestion + 1}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-5 py-6 sm:px-7 sm:py-8">
            <div className="rounded-xl bg-muted/40 p-4 sm:p-5">
              <h2 className="text-base font-medium leading-7 text-foreground sm:text-lg sm:leading-8">
                <LatexText text={currentQ.question} />
              </h2>
            </div>

            <div className="space-y-3" role="group" aria-label="Answer choices">
              {currentQ.options.map((option: string, index: number) => (
                <button
                  key={index}
                  type="button"
                  disabled={hasAnswered}
                  aria-pressed={quizState.answers[quizState.currentQuestion] === index}
                  onClick={() => handleAnswer(index)}
                  className={optionStyle(index)}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    hasAnswered && index === currentQ.correctAnswer
                      ? "bg-emerald-600 text-white"
                      : hasAnswered && index === quizState.answers[quizState.currentQuestion]
                        ? "bg-rose-600 text-white"
                        : "bg-muted text-foreground"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="min-w-0 flex-1"><LatexText text={option} /></span>
                  {hasAnswered && index === currentQ.correctAnswer && (
                    <CheckCircle2 size={17} aria-hidden="true" className="ml-auto shrink-0 text-emerald-700" />
                  )}
                  {hasAnswered && index === quizState.answers[quizState.currentQuestion] && index !== currentQ.correctAnswer && (
                    <XCircle size={17} aria-hidden="true" className="ml-auto shrink-0 text-rose-700" />
                  )}
                </button>
              ))}
            </div>

            {hasAnswered && (
              <div
                role="status"
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${
                  currentAnswer === "correct"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {currentAnswer === "correct"
                  ? <><CheckCircle2 size={17} aria-hidden="true" /> Correct answer</>
                  : <><XCircle size={17} aria-hidden="true" /> Not quite — review the explanation</>
                }
              </div>
            )}

            {hasAnswered && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={toggleSolution}
                  aria-expanded={quizState.showSolution}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  {quizState.showSolution
                    ? <><EyeOff size={16} aria-hidden="true" /> Hide explanation</>
                    : <><Eye size={16} aria-hidden="true" /> Show explanation</>
                  }
                </button>

                {quizState.showSolution && (
                  <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 sm:p-5">
                    <h3 className="mb-2 text-sm font-semibold text-foreground">Explanation</h3>
                    <div className="text-sm leading-6 text-foreground/80">
                      <SolutionRenderer solution={currentQ.solution} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasAnswered ? (
              <Button onClick={handleNext} className="w-full rounded-xl" size="lg">
                {quizState.currentQuestion + 1 >= questions.length
                  ? <><Trophy size={16} className="mr-2" /> See results</>
                  : <>Next question <ChevronRight size={16} className="ml-1" /></>
                }
              </Button>
            ) : (
              <p className="text-center text-xs text-muted-foreground">
                Choose an answer to see feedback and continue.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
