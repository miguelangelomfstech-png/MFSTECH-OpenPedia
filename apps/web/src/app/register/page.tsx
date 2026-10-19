import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { register } from "@/app/actions";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="mb-6 font-serif text-3xl font-bold">Create account</h1>
      <AuthForm action={register} submit="Create account" fields={[
        { name: "name", label: "Username", autoComplete: "username", hint: "Shown publicly on your edits." },
        { name: "email", label: "Email", type: "email", autoComplete: "email", hint: "Never shown publicly." },
        { name: "password", label: "Password", type: "password", autoComplete: "new-password", hint: "At least 10 characters." },
      ]} />
      <p className="mt-6 text-sm text-muted">Already registered? <Link className="text-accent underline" href="/login">Log in</Link></p>
    </div>
  );
}
