import NotesPageClient from "./page-client";

type NotesPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotesPage({ searchParams }: NotesPageProps) {
    const resolvedSearchParams = await searchParams;
    const rawSessionId = resolvedSearchParams?.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

    return <NotesPageClient sessionId={sessionId} />;
}
