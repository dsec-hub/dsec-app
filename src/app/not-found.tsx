import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-3d-pink">Page not found</h1>
      <p className="mt-3 text-paper/75">That link doesn&apos;t go anywhere any more.</p>
      <Link href="/" className="btn btn-pink mt-6">Back home</Link>
    </div>
  );
}
