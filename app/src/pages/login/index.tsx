import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/use-auth.hooks";
import { LandingNav } from "@/pages/landing/components/LandingNav";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/forge");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="landing-mesh flex min-h-svh flex-col text-slate-200">
      <LandingNav />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm p-8 bg-panel border border-border rounded-lg shadow-lg shadow-black/20">
          <h1 className="text-xl font-semibold text-slate-100 mb-6">Sign in</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full mt-2">
              {loading ? <Spinner className="w-3.5 h-3.5" /> : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-slate-500 text-center">
            No account?{" "}
            <Link to="/register" className="text-accent-light hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
