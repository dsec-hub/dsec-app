"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

import { Field, FormError, TextArea, TextInput } from "@/components/form";
import { buttonPrimary, buttonSecondary } from "@/components/ui";
import { cn } from "@/lib/format";
import { cropToBlob, isHeic, toDisplayable } from "@/lib/image-crop";

import { finishOnboarding, uploadOwnPhoto, type OnboardingProfile } from "./actions";

const LINK_FIELDS: { key: keyof OnboardingProfile; label: string; placeholder: string }[] = [
  { key: "website", label: "Website / portfolio", placeholder: "https://…" },
  { key: "linkedin", label: "LinkedIn", placeholder: "profile URL" },
  { key: "github", label: "GitHub", placeholder: "username" },
  { key: "instagram", label: "Instagram", placeholder: "@handle" },
  { key: "discord", label: "Discord", placeholder: "username" },
];

const STEPS = ["Welcome", "Your details", "Profile photo", "Links"] as const;

function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
    />
  );
}

export function OnboardingWizard({
  email,
  firstName,
  initial,
  initialPhotoUrl,
}: {
  email: string;
  firstName: string | null;
  initial: OnboardingProfile;
  initialPhotoUrl: string | null;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<OnboardingProfile>(initial);
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [error, setError] = useState<string | undefined>();
  const [pending, start] = useTransition();

  const set = (key: keyof OnboardingProfile, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const hasLink = LINK_FIELDS.some(({ key }) => (form[key] ?? "").trim());

  // Per-step gate for the "Continue" button (matched server-side on finish).
  const canAdvance =
    step === 0 ? true
    : step === 1 ? !!form.name.trim() && !!form.bio.trim()
    : step === 2 ? !!photoUrl
    : hasLink;

  const next = () => {
    setError(undefined);
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else finish();
  };
  const back = () => {
    setError(undefined);
    setStep((s) => Math.max(0, s - 1));
  };

  const finish = () => {
    setError(undefined);
    start(async () => {
      const res = await finishOnboarding(form);
      // On success the action redirects; only an error returns here.
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-3 text-center">
        <p className="text-sm font-medium tracking-wide text-accent">DSEC</p>
        <h1 className="text-2xl font-semibold">
          {step === 0
            ? `Welcome${firstName ? `, ${firstName}` : ""} 👋`
            : "Set up your profile"}
        </h1>
        <Steps step={step} />
      </header>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
        <FormError>{error}</FormError>

        {step === 0 && <WelcomeStep email={email} />}

        {step === 1 && (
          <div className="space-y-5">
            <Field label="Full name" hint="Shown to the committee and on the public team page.">
              <TextInput
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                autoComplete="name"
                placeholder="Jane Citizen"
              />
            </Field>
            <Field
              label="Short bio"
              hint="One line about you for the public team page — your role, interests, or a fun fact."
            >
              <TextArea
                value={form.bio}
                onChange={(e) => set("bio", e.target.value)}
                maxLength={200}
                placeholder="Second-year CS student who loves CTFs and bad puns."
              />
            </Field>
          </div>
        )}

        {step === 2 && (
          <PhotoStep photoUrl={photoUrl} onUploaded={setPhotoUrl} />
        )}

        {step === 3 && (
          <div className="space-y-5">
            <p className="text-sm text-muted">
              Add at least one link so people can reach you. All optional beyond that.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {LINK_FIELDS.map(({ key, label, placeholder }) => (
                <Field key={key} label={label}>
                  <TextInput
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                  />
                </Field>
              ))}
            </div>
            <Field label="Student ID" hint="Optional — links your DUSA club membership.">
              <TextInput
                value={form.studentId}
                onChange={(e) => set("studentId", e.target.value)}
                placeholder="220123456"
              />
            </Field>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {step > 0 ? (
          <button type="button" className={buttonSecondary} onClick={back} disabled={pending}>
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={buttonPrimary}
          onClick={next}
          disabled={!canAdvance || pending}
          aria-busy={pending}
        >
          {pending ? (
            <span className="flex items-center gap-2">
              <Spinner /> Finishing…
            </span>
          ) : step === 0 ? (
            "Get started"
          ) : step === STEPS.length - 1 ? (
            "Finish & enter"
          ) : (
            "Continue"
          )}
        </button>
      </div>
    </div>
  );
}

function Steps({ step }: { step: number }) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
      {STEPS.map((label, i) => (
        <span
          key={label}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === step ? "w-8 bg-accent" : i < step ? "w-4 bg-accent/50" : "w-4 bg-border",
          )}
        />
      ))}
    </div>
  );
}

function WelcomeStep({ email }: { email: string }) {
  return (
    <div className="space-y-4 text-sm text-muted">
      <p className="text-foreground">
        Before you jump in, let’s set up your committee profile. It only takes a minute.
      </p>
      <ul className="space-y-2">
        {[
          "Your name and a short bio for the team page",
          "A profile photo (headshot)",
          "A link or two so people can reach you",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <span className="mt-0.5 text-accent">✓</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <p className="rounded-lg bg-elevated px-3 py-2 text-xs">
        Signed in as <span className="font-medium text-foreground">{email}</span>
      </p>
    </div>
  );
}

/** Pick → square-crop → upload a single headshot. Uploads immediately (via the
 * self-scoped action) and previews the cropped blob locally; the parent tracks
 * whether a photo now exists for the per-step gate. */
function PhotoStep({
  photoUrl,
  onUploaded,
}: {
  photoUrl: string | null;
  onUploaded: (url: string | null) => void;
}) {
  const [src, setSrc] = useState<string | null>(null); // image being cropped
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [converting, setConverting] = useState(false);
  const [pending, start] = useTransition();

  // Revoke the crop-source object URL when it changes / unmounts.
  useEffect(() => {
    return () => {
      if (src) URL.revokeObjectURL(src);
    };
  }, [src]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    if (!isHeic(file)) {
      setSrc(URL.createObjectURL(file));
      return;
    }
    setConverting(true);
    void toDisplayable([file])
      .then(([ready]) => setSrc(URL.createObjectURL(ready)))
      .catch((err: unknown) =>
        toast.error(`Couldn't read that HEIC photo — ${(err as Error).message}`),
      )
      .finally(() => setConverting(false));
  };

  const onCropComplete = useCallback((_a: Area, pixels: Area) => setArea(pixels), []);

  const upload = () => {
    if (!src || !area) return;
    start(async () => {
      try {
        const blob = await cropToBlob(src, area);
        const fd = new FormData();
        fd.set("file", blob, "photo.webp");
        const res = await uploadOwnPhoto(undefined, fd);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        onUploaded(URL.createObjectURL(blob));
        setSrc(null);
        toast.success("Photo saved.");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  };

  // Cropping an image right now.
  if (src) {
    return (
      <div className="space-y-4">
        <div className="relative h-72 w-full overflow-hidden rounded-md bg-elevated">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <label className="flex items-center gap-3 text-xs text-muted">
          <span className="shrink-0">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[var(--color-accent)]"
          />
        </label>
        <div className="flex items-center justify-end gap-2">
          <button type="button" className={buttonSecondary} onClick={() => setSrc(null)} disabled={pending}>
            Cancel
          </button>
          <button type="button" className={buttonPrimary} onClick={upload} disabled={pending || !area} aria-busy={pending}>
            {pending ? (
              <span className="flex items-center gap-2">
                <Spinner /> Uploading…
              </span>
            ) : (
              "Use this photo"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Idle: show current photo (if any) + a picker.
  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <div className="size-32 overflow-hidden rounded-full border border-border bg-elevated">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="Your profile photo" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-3xl text-muted">📷</div>
        )}
      </div>
      <p className="text-sm text-muted">
        {photoUrl
          ? "Looking good. You can change it if you like."
          : "Upload a square headshot — it appears on the public team page."}
      </p>
      {converting && (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Spinner className="size-3" /> Converting HEIC photo…
        </p>
      )}
      <label className={cn(buttonSecondary, "cursor-pointer")}>
        {photoUrl ? "Change photo" : "Choose photo"}
        <input type="file" accept="image/*,.heic,.heif" onChange={onPick} className="hidden" />
      </label>
    </div>
  );
}
