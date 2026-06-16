"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CheckboxField, Field, FormError, TextInput } from "@/components/form";
import { Icons } from "@/components/icons";
import { SubmitButton } from "@/components/submit-button";
import { buttonGhost } from "@/components/ui";
import { cn } from "@/lib/format";
import type { ApiScope } from "@/lib/api-tokens";
import { useActionToast } from "@/lib/use-action-toast";

import { createApiToken } from "./actions";

type ScopeOption = { key: ApiScope; label: string; description: string };

/** Copy-to-clipboard button (raw key + connection snippet). */
function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("Couldn't copy to clipboard.");
        }
      }}
      className={cn(buttonGhost, "gap-1.5")}
    >
      {copied ? <Icons.check className="h-4 w-4" /> : <Icons.copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </button>
  );
}

/** The one-and-only reveal of a freshly minted key. */
function RevealedKey({ rawKey }: { rawKey: string }) {
  return (
    <div className="space-y-2 rounded-xl border border-accent/40 bg-accent/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Your new token</p>
        <CopyButton value={rawKey} />
      </div>
      <code className="block break-all rounded-md bg-background px-3 py-2 font-mono text-xs">
        {rawKey}
      </code>
      <p className="text-xs text-danger">
        Copy it now — for security it’s shown only once and can’t be retrieved again.
      </p>
    </div>
  );
}

export function CreateTokenForm({
  scopes,
  disabled,
}: {
  scopes: ScopeOption[];
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(createApiToken, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useActionToast(state);

  useEffect(() => {
    if (state && "ok" in state && state.ok) {
      toast.success("Token created.");
      formRef.current?.reset();
    }
  }, [state]);

  const revealed = state && "ok" in state && state.ok ? state.rawKey : null;

  return (
    <div className="space-y-4">
      {revealed && <RevealedKey rawKey={revealed} />}
      <form ref={formRef} action={formAction} className="space-y-5">
        <FormError>{state && "error" in state ? state.error : undefined}</FormError>
        <Field label="Token name" hint="e.g. “Claude desktop” or “my laptop”.">
          <TextInput name="name" required maxLength={120} disabled={disabled} />
        </Field>
        <fieldset className="space-y-3 rounded-xl border border-border p-4" disabled={disabled}>
          <legend className="px-1 text-xs text-muted">Scopes</legend>
          {scopes.map((s, i) => (
            <div key={s.key} className="space-y-0.5">
              <CheckboxField label={s.label} name={`scope_${s.key}`} defaultChecked={i === 0} />
              <p className="pl-[1.625rem] text-xs text-muted/70">{s.description}</p>
            </div>
          ))}
        </fieldset>
        <SubmitButton>Create token</SubmitButton>
      </form>
    </div>
  );
}

/** A copyable MCP connection snippet for chat clients. */
export function McpConnection({ url }: { url: string }) {
  const snippet = JSON.stringify(
    {
      mcpServers: {
        dsec: { type: "http", url, headers: { Authorization: "Bearer dsec_live_YOUR_KEY" } },
      },
    },
    null,
    2,
  );
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Server URL <code className="font-mono text-xs text-foreground">{url}</code> · transport
          Streamable HTTP · auth <code className="font-mono text-xs">Authorization: Bearer …</code>
        </p>
        <CopyButton value={snippet} label="Copy config" />
      </div>
      <pre className="overflow-x-auto rounded-md bg-background px-3 py-2 font-mono text-xs leading-relaxed">
        {snippet}
      </pre>
    </div>
  );
}
