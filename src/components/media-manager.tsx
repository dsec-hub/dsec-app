"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { toast } from "sonner";

import { deleteMedia, uploadMedia, type MediaState } from "@/app/(app)/media/actions";
import { Field, FormError, SelectField, TextInput } from "@/components/form";
import { Modal } from "@/components/modal";
import {
  Badge,
  Card,
  EmptyState,
  SectionCard,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
} from "@/components/ui";
import { cn } from "@/lib/format";

export type EntityType = "event" | "project";

export type MediaItem = {
  id: number;
  role: string;
  webpUrl: string;
  pngUrl: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

type RoleDef = { value: string; label: string; aspect: number; hint: string };

const ROLES: RoleDef[] = [
  { value: "banner", label: "Banner", aspect: 16 / 9, hint: "Wide hero — 16:9" },
  { value: "image", label: "Image", aspect: 1, hint: "Square — 1:1" },
  { value: "poster", label: "Poster", aspect: 4 / 5, hint: "Instagram poster — 4:5" },
];

function roleVariant(role: string) {
  return role === "banner" ? "accent" : role === "poster" ? "success" : "neutral";
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("could not load image"));
    img.src = src;
  });
}

// Cap the exported longest side so uploads stay small. Mirrors the server's
// MEDIA_MAX_DIMENSION (the API re-caps anyway), keeping bodies well under the
// Server Action limit. The API still produces the final WebP + PNG derivatives.
const MAX_OUTPUT_DIMENSION = 2000;

/** Draw the selected crop region to a canvas and export a compressed WebP blob.
 *  WebP @0.9 is a fraction of an equivalent PNG, so the upload comfortably fits
 *  the Server Action body limit; the API still emits the lossless-ish PNG. */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src);
  const cw = Math.max(1, Math.round(area.width));
  const ch = Math.max(1, Math.round(area.height));
  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(cw, ch));
  const ow = Math.max(1, Math.round(cw * scale));
  const oh = Math.max(1, Math.round(ch * scale));
  const canvas = document.createElement("canvas");
  canvas.width = ow;
  canvas.height = oh;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas not supported");
  ctx.drawImage(image, Math.round(area.x), Math.round(area.y), cw, ch, 0, 0, ow, oh);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("crop export failed"))),
      "image/webp",
      0.9,
    ),
  );
}

/** Downscale a whole image (no crop) to the dimension cap and export WebP@0.9 —
 *  the bulk path, where there's no interactive crop. Aspect ratio is preserved;
 *  the API still emits the final WebP + PNG derivatives. */
async function fileToWebpBlob(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    const scale = Math.min(
      1,
      MAX_OUTPUT_DIMENSION / Math.max(image.width, image.height),
    );
    const ow = Math.max(1, Math.round(image.width * scale));
    const oh = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = ow;
    canvas.height = oh;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas not supported");
    ctx.drawImage(image, 0, 0, ow, oh);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("image export failed"))),
        "image/webp",
        0.9,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Tiny dependency-free spinner that inherits the button's text colour. */
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

/** Swaps an idle ↔ busy label inside one shared grid cell. Both labels stay
 *  mounted and only one is shown at a time (the other is hidden, not unmounted),
 *  so the button never flickers from a node swap and Safari never ghosts from an
 *  in-place text change. The swap is instant — no opacity transition — so the two
 *  labels never overlap mid-fade. The shared cell auto-sizes to the wider label,
 *  so the button width never jumps either. */
function PendingLabel({
  pending,
  idle,
  busy,
}: {
  pending: boolean;
  idle: React.ReactNode;
  busy: React.ReactNode;
}) {
  return (
    <span className="grid place-items-center">
      <span
        aria-hidden={pending}
        className={cn(
          "col-start-1 row-start-1 flex items-center gap-1.5",
          pending && "invisible",
        )}
      >
        {idle}
      </span>
      <span
        aria-hidden={!pending}
        className={cn(
          "col-start-1 row-start-1 flex items-center gap-1.5",
          !pending && "invisible",
        )}
      >
        {busy}
      </span>
    </span>
  );
}

export function MediaManager({
  entityType,
  entityId,
  existing,
  canWrite = true,
}: {
  entityType: EntityType;
  entityId: number;
  existing: MediaItem[];
  canWrite?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <SectionCard
      title="Images"
      action={
        canWrite ? (
          <button type="button" className={buttonPrimary} onClick={() => setOpen(true)}>
            Add image
          </button>
        ) : undefined
      }
    >
      {existing.length === 0 ? (
        <EmptyState>
          {canWrite
            ? "No images yet. Upload a banner, poster, or image — they show on the public site."
            : "No images yet."}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
          {existing.map((m) => (
            <MediaCard
              key={m.id}
              item={m}
              entityType={entityType}
              entityId={entityId}
              canWrite={canWrite}
            />
          ))}
        </div>
      )}

      {canWrite && (
        <Modal open={open} onClose={() => setOpen(false)} title="Upload images">
          <Uploader
            entityType={entityType}
            entityId={entityId}
            onDone={() => setOpen(false)}
          />
        </Modal>
      )}
    </SectionCard>
  );
}

function MediaCard({
  item,
  entityType,
  entityId,
  canWrite,
}: {
  item: MediaItem;
  entityType: EntityType;
  entityId: number;
  canWrite: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | undefined>();

  const onDelete = () => {
    if (!confirm("Remove this image? This cannot be undone.")) return;
    setError(undefined);
    start(async () => {
      const res = await deleteMedia(item.id, entityType, entityId);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success("Image removed.");
      }
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-elevated">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.webpUrl}
          alt={item.altText ?? ""}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-2 top-2">
          <Badge variant={roleVariant(item.role)}>{item.role}</Badge>
        </span>
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <a
          href={`${item.pngUrl}?download`}
          className="text-xs text-muted transition-colors hover:text-foreground"
        >
          Download PNG
        </a>
        {canWrite && (
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className={cn(buttonDanger, "px-2 py-1 text-xs")}
            aria-busy={pending}
          >
            {/* Busy state is just the spinner so the button stays as narrow as
                "Delete" (PendingLabel sizes to the wider label). */}
            <PendingLabel
              pending={pending}
              idle="Delete"
              busy={<Spinner className="size-3" />}
            />
          </button>
        )}
      </div>
      {error && <p className="px-3 pb-2 text-xs text-danger">{error}</p>}
    </Card>
  );
}

function Uploader({
  entityType,
  entityId,
  onDone,
}: {
  entityType: EntityType;
  entityId: number;
  onDone: () => void;
}) {
  const [role, setRole] = useState<RoleDef>(ROLES[0]);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [alt, setAlt] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [state, setState] = useState<MediaState>();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [statuses, setStatuses] = useState<("ok" | "err")[]>([]);
  const [pending, start] = useTransition();

  const bulk = files.length > 1;

  // Revoke object URLs whenever the selection changes / on unmount.
  useEffect(() => {
    return () => previews.forEach((u) => URL.revokeObjectURL(u));
  }, [previews]);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setState(undefined);
    setProgress(null);
    setStatuses([]);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setArea(null);
    setFiles(picked);
    setPreviews(picked.map((f) => URL.createObjectURL(f)));
  };

  const onCropComplete = useCallback((_a: Area, pixels: Area) => setArea(pixels), []);

  const uploadOne = (blob: Blob, name: string, altText?: string) => {
    const fd = new FormData();
    fd.set("entity_type", entityType);
    fd.set("entity_id", String(entityId));
    fd.set("role", role.value);
    if (altText?.trim()) fd.set("alt_text", altText.trim());
    fd.set("file", blob, name);
    return uploadMedia(undefined, fd);
  };

  const warn = (msg: string) => {
    setState({ error: msg });
    toast.error(msg);
  };

  const onUpload = () => {
    if (!files.length) return warn("Pick at least one image first.");
    if (!bulk && !area) return warn("Frame the crop first.");
    start(async () => {
      try {
        if (!bulk) {
          // Single image — interactive crop.
          if (!area) return;
          const blob = await cropToBlob(previews[0], area);
          const res = await uploadOne(blob, `${role.value}.webp`, alt);
          if (res?.error) {
            setState(res);
            toast.error(res.error);
            return;
          }
          toast.success("Image uploaded.");
          onDone();
          return;
        }
        // Bulk — downscale + compress each, upload sequentially with progress.
        let ok = 0;
        const failed: string[] = [];
        const next: ("ok" | "err")[] = [];
        setProgress({ done: 0, total: files.length });
        for (let i = 0; i < files.length; i++) {
          try {
            const blob = await fileToWebpBlob(files[i]);
            const res = await uploadOne(blob, `${role.value}-${i + 1}.webp`);
            if (res?.error) {
              failed.push(`${files[i].name}: ${res.error}`);
              next.push("err");
            } else {
              ok += 1;
              next.push("ok");
            }
          } catch (err) {
            failed.push(`${files[i].name}: ${(err as Error).message}`);
            next.push("err");
          }
          setStatuses([...next]);
          setProgress({ done: i + 1, total: files.length });
        }
        if (failed.length) {
          setState({
            error: `Uploaded ${ok}/${files.length}. Failed — ${failed.join("; ")}`.slice(
              0,
              300,
            ),
          });
          toast.error(`${failed.length} of ${files.length} image(s) failed.`);
        } else {
          toast.success(`Uploaded ${ok} image${ok === 1 ? "" : "s"}.`);
          onDone();
        }
      } catch (e) {
        const msg = (e as Error).message;
        setState({ error: msg });
        toast.error(msg);
      }
    });
  };

  const ready = files.length > 0 && (bulk || area !== null);
  const idleLabel = bulk ? `Upload ${files.length} images` : "Upload";
  const busyLabel =
    bulk && progress ? `Uploading ${progress.done}/${progress.total}…` : "Uploading…";

  return (
    <div className="flex flex-col gap-4">
      <FormError>{state?.error}</FormError>

      <Field label="Type" hint={bulk ? "Tag applied to every image in this batch." : role.hint}>
        <SelectField
          value={role.value}
          onChange={(e) =>
            setRole(ROLES.find((r) => r.value === e.target.value) ?? ROLES[0])
          }
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </SelectField>
      </Field>

      <Field
        label="Image file"
        hint="JPEG, PNG, or WebP. Pick several to upload in bulk — each is resized & compressed automatically."
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={onPick}
          className="block w-full text-sm text-muted file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground hover:file:opacity-90"
        />
      </Field>

      {/* Single image → interactive crop. */}
      {!bulk && previews[0] && (
        <>
          <div className="relative h-72 w-full overflow-hidden rounded-md bg-elevated">
            <Cropper
              image={previews[0]}
              crop={crop}
              zoom={zoom}
              aspect={role.aspect}
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
          <Field label="Alt text" hint="Describes the image for accessibility (optional).">
            <TextInput
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="e.g. Crowd at the 2026 hackathon finale"
            />
          </Field>
        </>
      )}

      {/* Multiple images → thumbnail grid, processed without per-image cropping. */}
      {bulk && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted">
            {files.length} images selected — resized &amp; compressed on upload (no
            cropping in bulk).
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {previews.map((u, i) => (
              <div
                key={u}
                className="relative aspect-square overflow-hidden rounded-md border border-border bg-elevated"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" />
                {statuses[i] && (
                  <span
                    className={cn(
                      "absolute inset-0 grid place-items-center text-lg font-semibold text-white",
                      statuses[i] === "ok" ? "bg-success/70" : "bg-danger/70",
                    )}
                  >
                    {statuses[i] === "ok" ? "✓" : "✗"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button type="button" className={buttonSecondary} onClick={onDone}>
          Cancel
        </button>
        <button
          type="button"
          className={buttonPrimary}
          onClick={onUpload}
          disabled={pending || !ready}
          aria-busy={pending}
        >
          <PendingLabel
            pending={pending}
            idle={idleLabel}
            busy={
              <>
                <Spinner />
                {busyLabel}
              </>
            }
          />
        </button>
      </div>
    </div>
  );
}
