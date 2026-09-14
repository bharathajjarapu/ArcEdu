"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon, Spinner } from "@/components/icons";
import { Button } from "@/components/ui";
import { Reading, accept } from "@/components/docs";
import { useApp } from "@/contexts/app";
import * as db from "@/lib/db";

// Upload step: add documents to a new or active session.
export function Upload() {
  const router = useRouter();
  const { docs, upload, busy, error, setError, load, pending, indexing } = useApp();

  return (
    <div className="relative isolate flex min-h-full items-center">
      {/* Chalkboard of equations: dark ink in light mode, chalk in dark mode. Pinned to the viewport so the sidebar's width never stretches it. */}
      <Image
        src="/hero.jpg"
        alt=""
        width={1920}
        height={1280}
        priority
        sizes="100vw"
        quality={60}
        className="pointer-events-none fixed inset-0 -z-10 h-dvh w-screen object-cover opacity-10 invert mask-b-from-40% dark:opacity-15 dark:invert-0"
      />
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-6xl">
            Ready to quiz anything?
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Drop your docs here. We&apos;ll handle the learning.
          </p>
        </div>

        <label
          aria-invalid={Boolean(error)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void upload(Array.from(event.dataTransfer.files));
          }}
          className="dropzone flex min-h-72 cursor-pointer flex-col gap-4 rounded-xl bg-background/70 p-4 backdrop-blur-sm transition-colors hover:bg-muted/40 has-focus-visible:ring-3 has-focus-visible:ring-ring/50 sm:p-6"
        >
          {(docs.length > 0 || pending.length > 0) && (
            <ul aria-label="Uploaded files" className="flex flex-wrap justify-center gap-x-2 gap-y-3">
              {docs.map((doc) => (
                <li
                  key={doc.id}
                  title={`${doc.name} · ${doc.size}`}
                  className="group relative flex w-20 flex-col items-center gap-1 transition-all duration-300 starting:translate-y-2 starting:opacity-0"
                >
                  <span className="relative">
                    <Icon name="file" strokeWidth="1.25" className="size-11 text-muted-foreground" />
                    <span className="absolute inset-x-0 bottom-2 text-center text-[8px] font-bold tracking-wide uppercase">
                      {doc.name.split(".").pop()}
                    </span>
                  </span>
                  <span className="w-full truncate text-center text-xs">{doc.name.replace(/\.[^.]+$/, "")}</span>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    aria-label={`Remove ${doc.name}`}
                    onClick={(event) => {
                      event.preventDefault();
                      void db.remove("documents", doc.id).then(() => load());
                    }}
                    className="absolute -top-1 right-2 bg-background text-muted-foreground hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  >
                    <Icon name="x" className="size-3" />
                  </Button>
                </li>
              ))}
              {pending.map((name, index) => <Reading key={`${name}-${index}`} name={name} />)}
            </ul>
          )}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            {busy ? (
              <span className="flex items-center gap-2 font-medium text-muted-foreground">
                <Spinner className="size-5" /> Reading your documents…
              </span>
            ) : indexing ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" /> Embedding for search…
              </span>
            ) : (
              <>
                <Icon name="upload" className="size-5 text-muted-foreground" />
                <span className="font-medium">{docs.length ? "Drop more files" : "Drag & drop your files"}</span>
                <span className="text-sm text-muted-foreground">
                  or <span className="text-foreground underline underline-offset-4">browse files</span> · PDF, Word, PowerPoint, Excel, EPUB, text
                </span>
              </>
            )}
            {error && <span role="alert" className="text-sm font-medium text-danger">{error}</span>}
          </div>
          <input
            type="file"
            multiple
            accept={accept}
            disabled={busy}
            className="sr-only"
            onChange={(event) => {
              void upload(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
        </label>

        <div className="mt-8 flex justify-center">
          <Button
            size="xl"
            disabled={busy}
            className="w-full sm:w-auto"
            onClick={() => (docs.length > 0 ? router.push("/format") : setError("Upload at least one document"))}
          >
            Let&apos;s start
            <Icon name="arrow-right" />
          </Button>
        </div>
      </div>
    </div>
  );
}
