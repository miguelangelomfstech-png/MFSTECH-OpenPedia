import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { register } from "@/app/actions";
import { getT } from "@/lib/i18n";

export const metadata = { title: "Create account" };

export default async function RegisterPage() {
  const t = await getT();

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="mb-6 font-serif text-3xl font-bold">{t("register")}</h1>
      <AuthForm
        action={register}
        submit={t("register")}
        fields={[
          {
            name: "name",
            label: "Username",
            autoComplete: "username",
            hint: "Shown publicly on your edits (up to 100 characters).",
          },
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            hint: "Never shown publicly.",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "new-password",
            hint: "At least 10 characters.",
          },
        ]}
        checkbox={{
          name: "gdprConsent",
          required: true,
          label: (
            <span>
              {t("gdprRegisterConsent")}{" "}
              <Link href="/privacy" target="_blank" className="text-accent underline font-medium">
                {t("privacy")}
              </Link>
            </span>
          ),
        }}
      />
      <p className="mt-6 text-sm text-muted">
        Already registered?{" "}
        <Link className="text-accent underline" href="/login">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
