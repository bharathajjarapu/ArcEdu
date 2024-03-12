export function calculate(
  format: "quiz" | "flashcards",
  answers: Record<number, string | boolean>,
  data: any[],
  startTime?: number,
  times?: number[],
  maxStreak?: number
) {
  if (format === "quiz") {
    const correct = Object.entries(answers).filter(([idx, answer]) => {
      const selected = (answer as string).charCodeAt(0) - 65;
      return data[parseInt(idx)].answer === selected;
    }).length;

    const total = data.length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const totalTime = startTime ? Date.now() - startTime : 0;
    const fastest = times && times.length > 0 ? Math.min(...times) : 0;

    return { correct, total, accuracy, totalTime, fastest, maxStreak: maxStreak || 0 };
  }

  const correct = Object.values(answers).filter(a => a).length;
  const total = data.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return { correct, total, accuracy, totalTime: 0, fastest: 0, maxStreak: 0 };
}
