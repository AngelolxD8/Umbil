import { PSQ_QUESTIONS } from "@/lib/psq-questions";
import { notFound } from "next/navigation";
import Link from "next/link";

// 1. Define the type locally to stop TypeScript errors
type QuestionType = {
  id: string;
  text: string;
  domain: string;
  description: string;
};

// 2. Define Props with a Promise for params (Next.js 15 fix)
type Props = {
  params: Promise<{ id: string }>;
};

export default async function SharedQuestionPage({ params }: Props) {
  // 3. Await the params before using them
  const { id } = await params;

  // 4. Find and cast the question
  const questionIndex = PSQ_QUESTIONS.findIndex((q) => q.id === id);
  const question = PSQ_QUESTIONS[questionIndex] as unknown as QuestionType;

  if (!question) {
    return notFound();
  }

  // Calculate next/prev navigation
  const nextQuestion = PSQ_QUESTIONS[questionIndex + 1];
  const prevQuestion = PSQ_QUESTIONS[questionIndex - 1];

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Header / Back Link */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Question {questionIndex + 1} of {PSQ_QUESTIONS.length}
          </span>
          <span className="text-sm text-gray-400">
            {question.domain}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {question.text}
        </h1>

        <div className="prose prose-blue max-w-none text-gray-600 mb-8">
          <p>{question.description}</p>
        </div>

        {/* Action Button */}
        <div className="flex gap-4 border-t pt-6">
            <Link
                href={`/psq/answer/${id}`} 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
            >
                Log Answer
            </Link>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex justify-between items-center text-sm">
        {prevQuestion ? (
          <Link
            href={`/s/${prevQuestion.id}`}
            className="text-gray-500 hover:text-gray-900 font-medium"
          >
            ← Previous Question
          </Link>
        ) : (
          <div /> 
        )}

        {nextQuestion ? (
          <Link
            href={`/s/${nextQuestion.id}`}
            className="text-gray-500 hover:text-gray-900 font-medium"
          >
            Next Question →
          </Link>
        ) : (
            <div /> 
        )}
      </div>
    </div>
  );
}