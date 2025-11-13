import SlidesPageClient from "./page-client";

type SlidesPageProps = {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SlidesPage({ searchParams }: SlidesPageProps) {
    const resolvedSearchParams = await searchParams;
    const rawSessionId = resolvedSearchParams?.sessionId;
    const sessionId = Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId;

    return <SlidesPageClient sessionId={sessionId} />;
}
