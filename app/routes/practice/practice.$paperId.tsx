import { useState, type Key } from "react";
import { useLoaderData, useRevalidator, Link } from "react-router";
import { LatexText, SolutionRenderer } from "~/components/Tex";
import type { Route } from "./+types/practice.$paperId";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Loader2, ChevronRight, BookOpen, Trophy, RotateCcw, AlertTriangle, CheckCircle2, XCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
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

  return (
    <div className="flex items-center gap-3 flex-wrap mb-6">
      <Pressable
        as={Link}
        to="/practice"
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft size={15} /> Back
      </Pressable>
      <div className="h-4 w-px bg-slate-300" />
      <Badge variant="outline" className="capitalize">{levelLabel}</Badge>
      <Badge variant="secondary" className="capitalize">{subject}</Badge>
      <Badge variant="outline">{year}</Badge>
      <Badge variant="outline">{paperLabel}</Badge>
    </div>
  );
}

// ── Not found state ───────────────────────────────────────────────────────────
function PaperNotFound({
  subject, level, year, paper,
}: { subject: string; level: string; year: number; paper: string }) {
  return (
    <div className="min-h-screen p-4 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle size={26} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Paper Not Available</h2>
            <p className="text-sm text-slate-500">
              The <span className="font-medium">{level} {subject} {year} {paper.replace("paper", "Paper ")}</span> questions
              haven't been added yet.
            </p>
          </div>
          <p className="text-xs text-slate-400">
            We're continuously adding past papers. Check back soon or try another paper.
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <Button asChild variant="outline" size="sm">
              <Pressable as={Link} to="/practice">Browse Papers</Pressable>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Practice() {
  const data = useLoaderData<typeof clientLoader>();
  const revalidator = useRevalidator();

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
    const base = "w-full justify-start text-left h-auto py-3 px-4 transition-all border ";
    if (!hasAnswered) {
      return base + "hover:border-purple-400 hover:bg-purple-50";
    }
    if (index === currentQ.correctAnswer) {
      return base + "border-green-500 bg-green-50 text-green-800";
    }
    if (index === quizState.answers[quizState.currentQuestion]) {
      return base + "border-red-400 bg-red-50 text-red-800";
    }
    return base + "opacity-50";
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
      percentage >= 80 ? "text-green-600" :
        percentage >= 60 ? "text-blue-600" :
          percentage >= 40 ? "text-amber-600" :
            "text-red-600";

    return (
      <div className="min-h-screen p-4 pb-20">
        <div className="max-w-2xl mx-auto mt-6 space-y-4">
          <PaperHeader subject={subject} level={level} year={year} paper={paper} />

          {/* Score card */}
          <Card>
            <CardContent className="pt-8 pb-6 text-center space-y-2">
              <p className={`text-5xl font-bold ${gradeColor}`}>{percentage}%</p>
              <p className="text-slate-500 text-sm">
                {quizState.score} / {questions.length} correct
              </p>
              <p className={`text-lg font-semibold ${gradeColor}`}>{gradeLabel}</p>
              <p className="text-xs text-slate-400 mt-1">
                ⏱ {minutes}m {seconds}s
              </p>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSubmitScore}
              className="flex-1"
              disabled={isSubmitting || scoreSubmitted}
            >
              {isSubmitting ? (
                <Loader2 size={15} className="animate-spin mr-2" />
              ) : (
                <Trophy size={15} className="mr-2" />
              )}
              {scoreSubmitted ? "Score Saved ✓" : "Save Score"}
            </Button>
            <Button onClick={resetQuiz} variant="outline" className="flex-1">
              <RotateCcw size={15} className="mr-2" /> Try Again
            </Button>
          </div>

          {/* Answer review */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-800 text-sm px-1">Answer Review</h3>
            {(questions as Question[]).map((q, idx) => {
              const chosen = quizState.answers[idx];
              const isCorrect = chosen === q.correctAnswer;
              return (
                <Card key={q.id} className={`border ${isCorrect ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}`}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {isCorrect
                          ? <CheckCircle2 size={16} className="text-green-600" />
                          : <XCircle size={16} className="text-red-500" />
                        }
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm text-slate-700 font-medium">
                          Q{idx + 1}. <LatexText text={q.question} />
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-slate-500">
                            Your answer: <span className="text-red-600 font-medium">
                              {String.fromCharCode(65 + chosen)}. <LatexText text={q.options[chosen]} />
                            </span>
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          Correct: <span className="text-green-700 font-medium">
                            {String.fromCharCode(65 + q.correctAnswer)}. <LatexText text={q.options[q.correctAnswer]} />
                          </span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-2xl mx-auto mt-6">
        <PaperHeader subject={subject} level={level} year={year} paper={paper} />

        <Card>
          <CardHeader className="pb-3">
            {/* Progress row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-500 font-medium">
                {quizState.currentQuestion + 1} / {questions.length}
              </span>
              <span className="text-xs font-semibold text-purple-700">
                Score: {quizState.score}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="bg-purple-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Question */}
            <h2 className="text-base font-semibold text-slate-900 leading-relaxed">
              <LatexText text={currentQ.question} />
            </h2>

            {/* Options */}
            <div className="space-y-2.5">
              {currentQ.options.map((option: string, index: number) => (
                <button
                  key={index}
                  disabled={hasAnswered}
                  onClick={() => handleAnswer(index)}
                  className={`${optionStyle(index)} rounded-lg flex items-center gap-3 w-full text-sm`}
                >
                  {/* Letter label */}
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${hasAnswered && index === currentQ.correctAnswer
                    ? "bg-green-500 text-white"
                    : hasAnswered && index === quizState.answers[quizState.currentQuestion]
                      ? "bg-red-400 text-white"
                      : "bg-slate-100 text-slate-700"
                    }`}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <LatexText text={option} />
                  {/* Feedback icon */}
                  {hasAnswered && index === currentQ.correctAnswer && (
                    <CheckCircle2 size={15} className="ml-auto text-green-600 shrink-0" />
                  )}
                  {hasAnswered && index === quizState.answers[quizState.currentQuestion] && index !== currentQ.correctAnswer && (
                    <XCircle size={15} className="ml-auto text-red-500 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Answer feedback banner */}
            {hasAnswered && (
              <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${currentAnswer === "correct"
                ? "bg-green-100 text-green-800"
                : "bg-red-50 text-red-800"
                }`}>
                {currentAnswer === "correct"
                  ? <><CheckCircle2 size={15} /> Correct!</>
                  : <><XCircle size={15} /> Incorrect — see the solution below</>
                }
              </div>
            )}

            {/* Solution — only unlocked after answering */}
            {hasAnswered && (
              <>
                <button
                  onClick={toggleSolution}
                  className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 transition-colors w-full justify-center py-1"
                >
                  {quizState.showSolution
                    ? <><EyeOff size={14} /> Hide Solution</>
                    : <><Eye size={14} /> Show Solution</>
                  }
                </button>

                {quizState.showSolution && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2 text-sm">Solution</h4>
                    <div className="text-blue-900 text-sm">
                      <SolutionRenderer solution={currentQ.solution} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Next / Finish button — appears only after answering */}
            {hasAnswered && (
              <Pressable className="w-full">

                <Button onClick={handleNext} className="w-full" size="lg">
                  {quizState.currentQuestion + 1 >= questions.length
                    ? <><Trophy size={15} className="mr-2" /> See Results</>
                    : <>Next Question <ChevronRight size={15} className="ml-1" /></>
                  }
                </Button>
              </Pressable>
            )}

            {/* Hint while unanswered */}
            {!hasAnswered && (
              <p className="text-center text-xs text-slate-400">
                Select an answer to continue
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
