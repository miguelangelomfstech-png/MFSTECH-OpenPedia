"use client";

import { useActionState } from "react";
import type { FormState } from "@/app/actions";

type Field = { name: string; label: string; type?: string; autoComplete?: string; hint?: string };

export function AuthForm({
  action, fields, submit, hidden,
}: {
  action: (s: FormState, fd: FormData) => Promise<FormState>;
  fields: Field[]; submit: string; hidden?: Record<string, string>;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hidden ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="mb-1 block text-sm font-semibold">{f.label}</label>
          <input id={f.name} name={f.name} type={f.type ?? "text"} autoComplete={f.autoComplete} required className="input"
            aria-describedby={f.hint ? `${f.name}-hint` : undefined} />
          {f.hint && <p id={`${f.name}-hint`} className="mt-1 text-xs text-muted">{f.hint}</p>}
        </div>
      ))}
      {state?.error && <p role="alert" className="text-red">{state.error}</p>}
      <button className="btn btn-primary w-full justify-center" disabled={pending}>{pending ? "Please wait…" : submit}</button>
    </form>
  );
}
