import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { login, oauthLogin } from "@/app/actions";

export const metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
  const providers = [
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET && ["github", "GitHub"],
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET && ["google", "Google"],
  ].filter(Boolean) as [string, string][];
  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="mb-6 font-serif text-3xl font-bold">Log in</h1>
      <AuthForm action={login} submit="Log in" hidden={{ next: safeNext }} fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
      ]} />
      {providers.length > 0 && (
        <div className="mt-6 space-y-2 border-t border-line pt-6">
          {providers.map(([id, label]) => (
            <form key={id} action={oauthLogin}><input type="hidden" name="provider" value={id} />
              <button className="btn w-full justify-center">Continue with {label}</button></form>
          ))}
        </div>
      )}
      <p className="mt-6 text-sm text-muted">New here? <Link className="text-accent underline" href="/register">Create an account</Link></p>
    </div>
  );
}
