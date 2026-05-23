"use client";

import { useEffect, useRef, useState } from "react";
import type { Template } from "@/lib/templates/types";

function TemplateModal({
  template,
  onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      data-testid="template-modal"
      className="m-auto w-full max-w-lg rounded-lg border border-zinc-200 bg-white p-0 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex items-start justify-between border-b border-zinc-200 p-5 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {template.name}
        </h2>
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="ml-4 rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="space-y-4 p-5">
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-zinc-500">Slug</dt>
            <dd>
              <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {template.slug}
              </code>
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-zinc-500">Layout</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">
              {template.layout_id}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-zinc-500">Dimensiones</dt>
            <dd className="text-zinc-800 dark:text-zinc-200">
              {template.width}&times;{template.height}
            </dd>
          </div>
        </dl>

        {template.layers && template.layers.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Capas
            </h3>
            <ul className="space-y-1">
              {template.layers.map((layer, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 rounded border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {layer.name}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800">
                    {layer.type}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </dialog>
  );
}

export function TemplateGallery({ templates }: { templates: Template[] }) {
  const [selected, setSelected] = useState<Template | null>(null);

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <li key={template.id}>
            <button
              onClick={() => setSelected(template)}
              data-testid="template-card"
              className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-400 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
            >
              <p data-testid="template-card-name" className="font-medium text-zinc-900 dark:text-zinc-50">
                {template.name}
              </p>
              <p className="mt-1 font-mono text-xs text-zinc-500">
                {template.slug}
              </p>
              <p className="mt-2 text-xs text-zinc-400">
                {template.width}&times;{template.height}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <TemplateModal
          template={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
