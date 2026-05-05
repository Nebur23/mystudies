import { useState, type Key } from "react";
import { useLoaderData, useRevalidator } from "react-router";
import { LatexText, SolutionRenderer } from "~/components/Tex";
import type { Route } from "./+types/practice.$paperId";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { parsePaperId } from "~/utils/paperId";
//import questions from "~/data/questions/alevel/mathematics/2022/paper1.json"; // For testing, can be removed later

export async function clientLoader({ params }: Route.LoaderArgs) {
  const { paperId } = params;
  
  // paperId format: "olevel-mathematics-2023-paper1"
  const parsed = parsePaperId(paperId);
  if (!parsed) throw new Response("Invalid paper ID", { status: 400 });

  // Lazy-load questions only when route is accessed
  // Vite supports dynamic imports with template literals if configured
  const responsr = await fetch(`/data/questions/${parsed.level}/${parsed.subject}/${parsed.year}/${parsed.paper}.json`);
  
const module = await responsr.json();

  return {
    ...parsed,
    questions: module,
    meta: {
      title: `${parsed.subject} - ${parsed.year} ${parsed.paper}`,
      description: `Practice ${parsed.level} ${parsed.subject} past paper`
    }
  };
}

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Practice Quiz" },
        { name: "description", content: "Take a practice quiz and track your progress" },
    ];
}

type QuizState = {
    currentQuestion: number;
    score: number;
    showResults: boolean;
    answers: number[];
    showSolution: number | null;
    startTime: number;
};

interface QuestionOption {
    text: string;
}

interface Question {
    id: Key;
    question: string;
    options: QuestionOption[];
    correctAnswer: number;
    solution: string;
}

export default function Practice() {

     const data = useLoaderData<typeof clientLoader>();
     const { questions } = data;

    const revalidator = useRevalidator();
    const [quizState, setQuizState] = useState<QuizState>({
        currentQuestion: 0,
        score: 0,
        showResults: false,
        answers: [],
        showSolution: null,
        startTime: Date.now(),
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const currentQ = questions[quizState.currentQuestion];
    const progress = ((quizState.currentQuestion + 1) / questions.length) * 100;

    const handleAnswer = (selectedIndex: number) => {
        const isCorrect = selectedIndex === currentQ.correctAnswer;
        const newAnswers = [...quizState.answers, selectedIndex];
        
        if (quizState.currentQuestion + 1 >= questions.length) {
            setQuizState({
                ...quizState,
                answers: newAnswers,
                score: quizState.score + (isCorrect ? 1 : 0),
                showResults: true
            });
        } else {
            setQuizState({
                ...quizState,
                currentQuestion: quizState.currentQuestion + 1,
                score: quizState.score + (isCorrect ? 1 : 0),
                answers: newAnswers
            });
        }
    };

    const toggleSolution = () => {
        setQuizState({
            ...quizState,
            showSolution: quizState.showSolution === quizState.currentQuestion ? null : quizState.currentQuestion
        });
    };

    const resetQuiz = () => {
        setQuizState({
            currentQuestion: 0,
            score: 0,
            showResults: false,
            answers: [],
            showSolution: null,
            startTime: Date.now(),
        });
    };

    const handleSubmitScore = async () => {
        setIsSubmitting(true);
        try {
            const timeSpent = Math.round((Date.now() - quizState.startTime) / 1000);
            
            const response = await fetch("/api/quiz/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    quizId: "2022/A/math/paper1",
                    score: quizState.score,
                    totalQuestions: questions.length,
                    timeSpent,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit score");
            }

            const data = await response.json();
            console.log("Score submitted successfully:", data);
            toast.success(data.message || "Score submitted successfully!");
            
            // Revalidate leaderboard data
            revalidator.revalidate();
        } catch (error) {
            console.error("Error submitting score:", error);
            // Show error toast or notification
        } finally {
            setIsSubmitting(false);
        }
    };

    // Results screen
    if (quizState.showResults) {
        const percentage = Math.round((quizState.score / questions.length) * 100);
        const timeSpent = Math.round((Date.now() - quizState.startTime) / 1000);
        const minutes = Math.floor(timeSpent / 60);
        const seconds = timeSpent % 60;

        return (
            <div className="min-h-screen p-4">
                <Card className="max-w-2xl mx-auto mt-8">
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Quiz Complete!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center">
                            <div className="text-6xl font-bold mb-2 text-primary">{percentage}%</div>
                            <p className="text-muted-foreground">
                                You got {quizState.score} out of {questions.length} correct
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                                Time spent: {minutes}m {seconds}s
                            </p>
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="font-semibold text-lg">Review Answers:</h3>
                            {questions.map((q :Question, idx: number) => (
                                <div key={q.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                    <span className="text-sm"><LatexText text={q.question} /></span>
                                    <Badge variant={quizState.answers[idx] === q.correctAnswer ? "default" : "destructive"}>
                                        {quizState.answers[idx] === q.correctAnswer ? "✓" : "✗"}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 flex-col md:flex-row">
                            <Button 
                                onClick={handleSubmitScore} 
                                className="w-full" 
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Save Score & View Leaderboard"}
                            </Button>
                            <Button 
                                onClick={resetQuiz} 
                                variant="outline"
                                className="w-full" 
                                size="lg"
                                disabled={isSubmitting}
                            >
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Quiz screen
    return (
        <div className="min-h-screen p-4">
            <Card className="max-w-2xl mx-auto mt-8">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">
                            Question {quizState.currentQuestion + 1} of {questions.length}
                        </Badge>
                        <Badge variant="secondary">
                            Score: {quizState.score}
                        </Badge>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2">
                        <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                    {/* Question - using LatexText for inline latex */}
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold">
                            <LatexText text={currentQ.question} />
                        </h2>
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentQ.options.map((option : string, index : number) => (
                            <Button
                                key={index}
                                variant="outline"
                                className="w-full justify-start text-left h-auto py-3 px-4"
                                onClick={() => handleAnswer(index)}
                            >
                                <span className="font-medium mr-3">
                                    {String.fromCharCode(65 + index)}.
                                </span>
                                <LatexText text={option} />
                            </Button>
                        ))}
                    </div>

                    {/* Show Solution Button */}
                    <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={toggleSolution}
                    >
                        {quizState.showSolution === quizState.currentQuestion ? "Hide Solution" : "Show Solution"}
                    </Button>

                    {/* Solution Display - using SolutionRenderer for proper formatting */}
                    {quizState.showSolution === quizState.currentQuestion && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">Solution:</h4>
                            <div className="text-green-700 text-sm">
                                <SolutionRenderer solution={currentQ.solution} />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
