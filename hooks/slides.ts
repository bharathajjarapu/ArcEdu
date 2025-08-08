import { useState, useCallback } from "react";

export function useSlides() {
  const [slidesContent, setSlidesContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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
  };
}
