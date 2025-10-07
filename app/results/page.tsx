import ResultsPageClient from "./page-client";

type ResultsPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
    const resolvedSearchParams = await searchParams;
    const rawSessionId = resolvedSearchParams?.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

    return <ResultsPageClient sessionId={sessionId} />;
}
