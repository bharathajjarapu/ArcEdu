"use client";

import { SlidesScreen } from "@/components/screens/slides";
import { useAppState } from "@/contexts/state";

export default function SlidesPage() {
    const state = useAppState();

    return (
        <SlidesScreen
            content={state.slides.slidesContent}
            isGenerating={state.slides.isGenerating}
            currentSlide={state.slides.currentSlide}
            slideDesign={state.slideDesign}
            slideColorPalette={state.slideColorPalette}
            onSlideChange={state.slides.goToSlide}
            onEnd={state.slides.finishSlides}
        />
    );
}
