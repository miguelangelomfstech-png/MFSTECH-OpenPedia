import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/viewer";
import { UploadForm } from "@/components/UploadForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upload file" };

export default async function UploadPage() {
  const { user } = await getViewer();
  if (!user) redirect("/login?next=/upload");
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-2 font-serif text-3xl font-bold">Upload an image or video</h1>
      <p className="mb-6 text-muted">
        Supported: JPEG, PNG, WebP, GIF, SVG, MP4, WebM, MOV. Videos are transcoded to 360p/720p/1080p automatically.
        Embed it in articles with <code>[[File:Name.ext|Caption]]</code>. Only upload content you have the right to share. <Link className="underline" href="/search?type=media">Browse media</Link>.
      </p>
      <UploadForm />
    </div>
  );
}
