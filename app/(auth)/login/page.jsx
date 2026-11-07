import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
  title: "Login",
  description: "Sign in to your account.",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account.
        </p>
      </div>

      <LoginForm />
    </div>
  );
}
