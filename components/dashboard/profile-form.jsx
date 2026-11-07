"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Field, FormAlert } from "@/components/auth/field";
import { profileSchema } from "@/lib/validations/dashboard";
import { updateProfileName } from "@/lib/actions/profile";
import { getFirebaseAuth } from "@/lib/firebase/client";

export function ProfileForm({ name, email }) {
  const [status, setStatus] = useState({
    tone: "ok",
    text: "",
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: name || "",
    },
  });

  async function onSubmit(values) {
    setStatus({ tone: "ok", text: "" });

    try {
      const res = await updateProfileName(values);

      if (!res?.ok) {
        setStatus({
          tone: "error",
          text: res?.error || "Could not update your profile.",
        });
        return;
      }

      setStatus({
        tone: "ok",
        text: "Profile saved successfully.",
      });
    } catch {
      setStatus({
        tone: "error",
        text: "Something went wrong. Please try again.",
      });
    }
  }

  async function resetPassword() {
    setStatus({ tone: "ok", text: "" });

    try {
      if (!email) {
        throw new Error("Email address is missing.");
      }

      await sendPasswordResetEmail(getFirebaseAuth(), email);

      setStatus({
        tone: "ok",
        text: "Password reset email sent. Check your inbox.",
      });
    } catch {
      setStatus({
        tone: "error",
        text: "Could not send the password reset email. Please try again.",
      });
    }
  }

  return (
    <div className="max-w-md space-y-8">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field
          id="s-name"
          label="Full name"
          autoComplete="name"
          error={errors.name}
          register={register("name")}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium">Email</p>
          <p className="rounded-md border bg-muted px-3 py-2 text-sm">
            {email}
          </p>
        </div>

        <FormAlert tone={status.tone}>{status.text}</FormAlert>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </form>

      <div className="border-t pt-6">
        <h2 className="font-semibold">Password</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          We will email you a link to set a new password.
        </p>

        <Button
          type="button"
          className="mt-3"
          variant="outline"
          onClick={resetPassword}
        >
          Send password reset email
        </Button>
      </div>
    </div>
  );
}
