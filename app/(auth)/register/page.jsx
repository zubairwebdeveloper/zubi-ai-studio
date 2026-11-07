import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create Account",
  description: "Create your account.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-muted-foreground">
          Get started by creating your free account.
        </p>
      </div>

      <RegisterForm />
    </div>
  );
}
