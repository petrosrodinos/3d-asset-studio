import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { AuthPageShell } from "@/components/layouts/AuthPageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { useRegister } from "@/features/auth/hooks/use-auth.hooks";
import { useAuthStore } from "@/store/authStore";

const fieldClass =
  "rounded-lg border-border/80 bg-surface/50 py-2.5 transition-colors focus:border-accent/50 focus:bg-surface/70";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const register = useRegister();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    register.mutate(
      { email, password, displayName },
      {
        onSuccess: async () => {
          await useAuthStore.getState().fetchMe();
          navigate("/forge");
        },
      },
    );
  }

  return (
    <AuthPageShell
      title="Create account"
      subtitle="Set up your profile — you will land in the forge as soon as you are signed in."
      icon={UserPlus}
      footer={
        <>
          Already registered?{" "}
          <Link
            to="/login"
            className="font-medium text-accent-light underline-offset-2 hover:underline"
          >
            Sign in instead
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input
          id="displayName"
          label="Display name"
          autoComplete="name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How we should greet you"
          className={fieldClass}
        />
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={fieldClass}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Choose a strong password"
          className={fieldClass}
          required
        />
        {register.isError ? (
          <div
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
            role="alert"
          >
            {(register.error as Error).message}
          </div>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={register.isPending}>
          {register.isPending ? <Spinner className="h-4 w-4" /> : "Create account"}
        </Button>
      </form>
    </AuthPageShell>
  );
}
