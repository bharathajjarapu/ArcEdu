"use client";

import { SlidesScreen } from "@/components/screens/slides";
import { useAppState } from "@/contexts/state";
import { useRouter } from "next/navigation";

type SlidesPageClientProps = {
    sessionId?: string;
};

export default function SlidesPageClient({ sessionId }: SlidesPageClientProps) {
    const state = useAppState();
    const router = useRouter();
    const {
        slidesContent,
        isGenerating,
        currentSlide,
        goToSlide,
        finishSlides,
    } = state.slides;
    const backHref = sessionId ? `/sessions/${sessionId}` : "/format";

    return (
        <SlidesScreen
            content={slidesContent}
            isGenerating={isGenerating}
            error={state.error}
            currentSlide={currentSlide}
            slideDesign={state.slideDesign}
            slideColorPalette={state.slideColorPalette}
            onSlideChange={goToSlide}
            onEnd={finishSlides}
            onBackAction={() => router.push(backHref)}
        />
    );
}
