"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import {
  completeOnboarding,
  uploadFacePhoto,
  type FinishState,
  type PhotoState,
} from "./actions";

// Client-side courtesy check only. Keep in sync with MAX_UPLOAD_BYTES in
// ./actions.ts — the server remains the real control (client checks are bypassable).
const MAX_BYTES = 12_000_000; // 12 MB

/**
 * First-run setup. The ONE required step is a clear face photo — it's how
 * committee verifies a member against their membership card at events. Everything
 * else (display name) is optional, but the photo gate can't be skipped.
 */
export function OnboardingWizard({
  initialName,
  initialPhotoUrl,
}: {
  initialName: string;
  initialPhotoUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [hasFile, setHasFile] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const savedRef = useRef<HTMLParagraphElement>(null);

  const [photoState, uploadAction, uploading] = useActionState<PhotoState, FormData>(
    uploadFacePhoto,
    undefined,
  );
  const [finishState, finishAction, finishing] = useActionState<FinishState, FormData>(
    completeOnboarding,
    undefined,
  );

  // The actually-saved photo (drives the finish gate): the latest successful
  // upload, else whatever was already on the account. Derived — no effect.
  const savedPhotoUrl = (photoState?.ok && photoState.photoUrl) || initialPhotoUrl;

  // Reset hasFile the moment an upload succeeds, so the Upload button re-disables
  // until a new file is picked. Adjusting state during render (guarded by a change
  // check) is React's recommended alternative to a setState-in-effect here.
  const [seenPhotoState, setSeenPhotoState] = useState(photoState);
  if (photoState !== seenPhotoState) {
    setSeenPhotoState(photoState);
    if (photoState?.ok) setHasFile(false);
  }

  // Move focus to the confirmation on success. role="status" alone announces
  // unreliably when the element is inserted already containing its text; focusing
  // it is the belt-and-braces that always works.
  useEffect(() => {
    if (photoState?.ok) savedRef.current?.focus();
  }, [photoState]);

  // Revoke the local object URL on unmount (cleanup only — no setState).
  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    [],
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    if (file) {
      // Reject oversized files before the round trip (the server enforces the
      // same 12 MB cap, but only after buffering the whole upload).
      if (file.size > MAX_BYTES) {
        setPickError("That image is too large (max 12 MB). Try a smaller one.");
        previewRef.current = null;
        setPreview(null);
        setHasFile(false);
        return;
      }
      setPickError(null);
      const url = URL.createObjectURL(file);
      previewRef.current = url;
      setPreview(url);
      setHasFile(true);
    } else {
      previewRef.current = null;
      setPreview(null);
      setHasFile(false);
    }
  }

  // Prefer the local preview while picking; otherwise the saved photo (same
  // image after a successful upload, so there's nothing to reconcile).
  const shown = preview ?? savedPhotoUrl;

  return (
    <div className="pixel-card-lg p-6 sm:p-8">
      {/* The required photo. */}
      <p className="eyebrow">Step 1 · Required</p>
      <h2 className="mt-1 font-display text-xl font-bold">Add a clear photo of your face</h2>
      <p className="mt-2 text-sm text-paper/75">
        This goes on your digital membership card so our team can verify it&apos;s really you at events.
        Face the camera, good light, no sunnies or hats. Only DSEC committee can see it.
      </p>

      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        {/* Preview / current photo */}
        <div className="flex h-36 w-36 shrink-0 items-center justify-center overflow-hidden border-[3px] border-paper bg-panel-2">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- local object URL / remote Supabase URL; rendered as plain <img> (see next.config).
            <img src={shown} alt="Your verification photo preview" className="h-full w-full object-cover" />
          ) : (
            <span className="px-3 text-center font-mono text-[11px] text-paper/45">No photo yet</span>
          )}
        </div>

        <form action={uploadAction} className="flex w-full flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-xs uppercase tracking-wide text-paper/60">
              {savedPhotoUrl ? "Replace photo" : "Choose or take a photo"}
            </span>
            {/*
              NEW-UXA11Y-07: `capture="user"` intentionally removed so mobile
              members also get the Photo Library / Files option, honouring the
              "Choose or take a photo" label. If a live capture is required for
              anti-fraud door verification, the owner can re-add `capture="user"`
              here and relabel the span above to "Take a live photo".
            */}
            <input
              type="file"
              name="file"
              accept="image/*"
              required
              onChange={onPick}
              className="pixel-input file:mr-3 file:border-0 file:bg-pink file:px-3 file:py-1 file:font-mono file:text-xs file:text-paper"
            />
          </label>

          {pickError && (
            <p className="font-mono text-sm text-coral" role="alert">{pickError}</p>
          )}

          {photoState && "error" in photoState && photoState.error && (
            <p className="font-mono text-sm text-coral" role="alert">{photoState.error}</p>
          )}

          <button type="submit" disabled={uploading || !hasFile} className="btn btn-pink !text-sm disabled:opacity-60">
            {uploading ? "Uploading…" : savedPhotoUrl ? "Upload new photo" : "Upload photo"}
          </button>

          {photoState?.ok && !hasFile && (
            <p ref={savedRef} tabIndex={-1} className="font-mono text-xs text-mint outline-none" role="status">
              ✓ Photo saved — you can continue below.
            </p>
          )}
        </form>
      </div>

      <hr className="my-7 border-0 border-t-[3px] border-paper/15" />

      {/* Finish — gated on a saved photo. */}
      <form action={finishAction} className="flex flex-col gap-4">
        <p className="eyebrow">Step 2 · Optional</p>
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-xs uppercase tracking-wide text-paper/60">
            Display name <span className="text-paper/40">(optional)</span>
          </span>
          <input
            name="name"
            type="text"
            defaultValue={initialName}
            maxLength={256}
            placeholder="How your name appears on your card"
            className="pixel-input"
          />
        </label>

        {finishState?.error && (
          <p className="font-mono text-sm text-coral" role="alert">{finishState.error}</p>
        )}

        {!savedPhotoUrl && (
          <p className="font-mono text-xs text-yellow">Add your photo above to continue.</p>
        )}

        <button type="submit" disabled={!savedPhotoUrl || finishing} className="btn btn-mint disabled:opacity-50">
          {finishing ? "Entering…" : "Enter the portal →"}
        </button>
      </form>
    </div>
  );
}
