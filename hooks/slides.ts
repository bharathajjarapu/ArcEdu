import { useCallback } from "react";
import {
  clearSessionStorageKey,
  useSessionStorageState,
} from "@/lib/storage";

export function useSlides() {
  const [slidesContent, setSlidesContent] = useSessionStorageState("slides-content", "");
  const [isGenerating, setIsGenerating] = useSessionStorageState("slides-generating", false);
  const [currentSlide, setCurrentSlide] = useSessionStorageState("slides-current-slide", 0);

  const startSlides = useCallback(() => {
    setSlidesContent("");
    setIsGenerating(true);
    setCurrentSlide(0);
  }, []);

  const finishSlides = useCallback(() => {
    setIsGenerating(false);
  }, []);

  const nextSlide = useCallback((total: number) => {
    setCurrentSlide((prev) => Math.min(prev + 1, total - 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const hydrateSlides = useCallback((content: string, slideIndex: number = 0) => {
    setSlidesContent(content);
    setCurrentSlide(slideIndex);
    setIsGenerating(false);
  }, [setCurrentSlide, setIsGenerating, setSlidesContent]);

  const clearSlides = useCallback(() => {
    setSlidesContent("");
    setIsGenerating(false);
    setCurrentSlide(0);
    clearSessionStorageKey("slides-content");
    clearSessionStorageKey("slides-generating");
    clearSessionStorageKey("slides-current-slide");
  }, [setCurrentSlide, setIsGenerating, setSlidesContent]);

  return {
    slidesContent,
    setSlidesContent,
    isGenerating,
    currentSlide,
    setCurrentSlide,
    startSlides,
    finishSlides,
    nextSlide,
    prevSlide,
    goToSlide,
    hydrateSlides,
    clearSlides,
  };
}
