"use client";

import type { ReactNode } from "react";
import { NumberField } from "@base-ui/react/number-field";
import { Switch } from "@base-ui/react/switch";
import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { Icon, Spinner } from "@/components/icons";
import { Button, Card, cn } from "@/components/ui";
import { useApp } from "@/contexts/app";
import type { Format as Kind, Palette } from "@/types";

type Name = Parameters<typeof Icon>[0]["name"];

const focus = "outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

const formats: { value: Kind; label: string; description: string; icon: Name }[] = [
  { value: "notes", label: "Notes", description: "Structured study notes", icon: "sticky-note" },
  { value: "quiz", label: "Quiz", description: "Multiple choice questions", icon: "circle-help" },
  { value: "slides", label: "Slides", description: "A deck to present", icon: "presentation" },
];

const extras: { value: string; icon: Name }[] = [
  { value: "code", icon: "code" },
  { value: "formulas", icon: "sigma" },
  { value: "diagrams", icon: "workflow" },
  { value: "tables", icon: "table" },
];

export const palettes: Record<Palette, string> = {
  minimal: "bg-white text-gray-900 [--dim:var(--color-gray-500)]",
  dark: "bg-gradient-to-br from-zinc-900 to-zinc-700 text-white [--dim:var(--color-zinc-400)]",
  colorful: "bg-gradient-to-br from-violet-500 via-pink-500 to-amber-400 text-white [--dim:rgb(255_255_255/0.8)]",
  ocean: "bg-gradient-to-br from-blue-600 to-cyan-500 text-white [--dim:var(--color-blue-100)]",
  forest: "bg-gradient-to-br from-emerald-700 to-green-500 text-white [--dim:var(--color-emerald-100)]",
  sunset: "bg-gradient-to-br from-orange-500 to-rose-500 text-white [--dim:var(--color-orange-100)]",
  purple: "bg-gradient-to-br from-purple-700 to-indigo-600 text-white [--dim:var(--color-purple-100)]",
};

// One labelled option row; stacks on small screens.
function Row({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

// Segmented single choice, styled like shadcn tabs.
function Choice({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <ToggleGroup aria-label={label} value={[value]} onValueChange={(next) => next[0] && onChange(next[0])} className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {options.map((option) => (
        <Toggle
          key={option}
          value={option}
          className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground capitalize transition-colors hover:text-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm", focus)}
        >
          {option}
        </Toggle>
      ))}
    </ToggleGroup>
  );
}

// Compact number input with - and + buttons.
function Count({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min: number; max: number }) {
  const step = cn("flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40", focus);
  return (
    <NumberField.Root value={value} min={min} max={max} onValueChange={(next) => onChange(next ?? min)} className="flex w-fit items-center overflow-hidden rounded-lg border">
      <NumberField.Decrement aria-label={`Fewer ${label}`} className={step}><Icon name="minus" className="size-4" /></NumberField.Decrement>
      <NumberField.Input aria-label={label} className="h-9 w-14 border-x bg-transparent text-center text-sm font-medium tabular-nums outline-none" />
      <NumberField.Increment aria-label={`More ${label}`} className={step}><Icon name="plus" className="size-4" /></NumberField.Increment>
    </NumberField.Root>
  );
}

// Format step: pick what to generate and tune it.
export function Format() {
  const { docs, options, setOptions, generate, busy, error } = useApp();
  const { format } = options;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-12 sm:px-6">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">What do you want to make?</h1>
      <p className="mt-1 truncate text-sm text-muted-foreground">
        {docs.length ? `From ${docs.map((doc) => doc.name).join(", ")}` : "Upload documents first."}
      </p>

      <ToggleGroup
        aria-label="Format"
        value={[format]}
        onValueChange={(next) => next[0] && setOptions({ format: next[0] as Kind })}
        className="mt-6 grid grid-cols-3 gap-3"
      >
        {formats.map((option) => (
          <Toggle
            key={option.value}
            value={option.value}
            className={cn("flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50 aria-pressed:border-foreground aria-pressed:bg-muted/50 aria-pressed:ring-1 aria-pressed:ring-foreground sm:p-4", focus)}
          >
            <Icon name={option.icon} className="size-5" />
            <span>
              <span className="block font-heading font-semibold">{option.label}</span>
              <span className="hidden text-sm text-muted-foreground sm:block">{option.description}</span>
            </span>
          </Toggle>
        ))}
      </ToggleGroup>

      <label className="mt-6 block">
        <span className="text-sm font-medium">Focus <span className="font-normal text-muted-foreground">(optional)</span></span>
        <textarea
          rows={3}
          placeholder="Topics or questions to emphasize, e.g. “the Calvin cycle and its inputs”"
          value={options.prompt}
          onChange={(event) => setOptions({ prompt: event.target.value })}
          className={cn("mt-2 block w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground md:text-sm", focus)}
        />
      </label>

      <Card className="mt-6 divide-y">
        {format === "quiz" && (
          <>
            <Row label="Questions">
              <Count label="questions" value={options.questions} onChange={(questions) => setOptions({ questions })} min={1} max={30} />
            </Row>
            <Row label="Difficulty">
              <Choice label="Difficulty" value={options.difficulty} onChange={(difficulty) => setOptions({ difficulty })} options={["easy", "medium", "hard", "adaptive"]} />
            </Row>
            <Row label="Time limit" hint="Minutes for the whole quiz, 0 for none">
              <Count label="minutes" value={options.minutes} onChange={(minutes) => setOptions({ minutes })} min={0} max={120} />
            </Row>
            <Row label="Explanations" hint="Show why an answer is right after checking">
              <Switch.Root
                checked={options.reveal}
                onCheckedChange={(reveal) => setOptions({ reveal })}
                aria-label="Show explanations"
                className={cn("flex h-6 w-11 items-center rounded-full bg-muted p-0.5 transition-colors data-checked:bg-primary", focus)}
              >
                <Switch.Thumb className="size-5 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-5" />
              </Switch.Root>
            </Row>
          </>
        )}

        {format === "notes" && (
          <>
            <Row label="Style">
              <Choice label="Style" value={options.style} onChange={(style) => setOptions({ style })} options={["structured", "summary", "exam", "cheatsheet", "prompt"]} />
            </Row>
            <Row label="Length">
              <Choice label="Length" value={options.length} onChange={(length) => setOptions({ length })} options={["short", "medium", "long", "adaptive"]} />
            </Row>
            <Row label="Include">
              <ToggleGroup multiple aria-label="Include" value={options.extras} onValueChange={(extras) => setOptions({ extras })} className="flex flex-wrap gap-2">
                {extras.map((extra) => (
                  <Toggle
                    key={extra.value}
                    value={extra.value}
                    className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground capitalize transition-colors hover:text-foreground aria-pressed:border-foreground aria-pressed:bg-foreground aria-pressed:text-background", focus)}
                  >
                    <Icon name={extra.icon} className="size-3.5" />
                    {extra.value}
                  </Toggle>
                ))}
              </ToggleGroup>
            </Row>
          </>
        )}

        {format === "slides" && (
          <>
            <Row label="Slides">
              <Count label="slides" value={options.slides} onChange={(slides) => setOptions({ slides })} min={1} max={50} />
            </Row>
            <Row label="Design">
              <Choice label="Design" value={options.design} onChange={(design) => setOptions({ design })} options={["professional", "academic", "creative", "technical", "visual"]} />
            </Row>
            <Row label="Palette">
              <ToggleGroup
                aria-label="Palette"
                value={[options.palette]}
                onValueChange={(next) => next[0] && setOptions({ palette: next[0] as Palette })}
                className="flex flex-wrap gap-1.5"
              >
                {Object.entries(palettes).map(([name, look]) => (
                  <Toggle
                    key={name}
                    value={name}
                    aria-label={`${name} palette`}
                    className={cn("size-8 rounded-full border ring-offset-2 ring-offset-background transition-shadow aria-pressed:ring-2 aria-pressed:ring-foreground", look, focus)}
                  />
                ))}
              </ToggleGroup>
            </Row>
          </>
        )}
      </Card>

      {error && <p role="alert" className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

      <div className="mt-6 flex justify-end">
        <Button size="xl" onClick={() => void generate()} disabled={busy} className="max-sm:w-full">
          {busy ? <><Spinner /> Generating…</> : <><Icon name="sparkles" /> Generate {format}</>}
        </Button>
      </div>
    </div>
  );
}
