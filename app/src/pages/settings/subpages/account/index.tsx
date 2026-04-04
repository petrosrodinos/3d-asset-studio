import { useAuth } from "@/features/auth/hooks/use-auth.hooks";

export default function SettingsAccountPage() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h1 className="text-lg font-semibold text-slate-100 mb-1">Account</h1>
      <p className="text-sm text-slate-400 mb-6">Your profile and sign-in details.</p>
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="text-slate-500 mb-0.5">Email</dt>
          <dd className="text-slate-200">{user?.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500 mb-0.5">Display name</dt>
          <dd className="text-slate-200">{user?.displayName ?? "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
