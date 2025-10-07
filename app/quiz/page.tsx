import QuizPageClient from "./page-client";

type QuizPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function QuizPage({ searchParams }: QuizPageProps) {
    const resolvedSearchParams = await searchParams;
    const rawSessionId = resolvedSearchParams?.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

    return <QuizPageClient sessionId={sessionId} />;
}
