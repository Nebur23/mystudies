"use client";

import { Link, useSearchParams } from "react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { usePostHog } from "@posthog/react";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { requestPasswordReset, signIn } from "~/lib/auth-client";
import { PasswordInput } from "~/components/ui/password-input";

// ─── Zod schema ────────────────────────────────────────────────────────────────
const requestResetPwdSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),
   
});

type RequestResetPwdFormErrors = Partial<Record<keyof z.infer<typeof requestResetPwdSchema>, string>>;



// ─── Component ─────────────────────────────────────────────────────────────────
export default function RequestResetPassword() {
   
    const posthog = usePostHog();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<RequestResetPwdFormErrors>({});

    /** Validate a single field on blur for inline feedback */
    function validateField(field: keyof RequestResetPwdFormErrors, value: string) {
        const result = requestResetPwdSchema.shape[field].safeParse(value);
        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0].message,
        }));
    }

    /** Full form validation before submit; returns true when valid */
    function validateAll(): boolean {
        const result = requestResetPwdSchema.safeParse({ email });
        if (result.success) {
            setErrors({});
            return true;
        }
        const fieldErrors: RequestResetPwdFormErrors = {};
        for (const issue of result.error.issues) {
            const key = issue.path[0] as keyof RequestResetPwdFormErrors;
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return false;
    }

 

    async function handlePasswordResetRequest() {
        if (!email) {
            toast.error("Please enter your email to reset your password.");
            return;
        }

        setLoading(true);
        toast.info("Sending password reset email...");

        const { data, error } = await requestPasswordReset({
            email,
            redirectTo: "https://mystudies-production.up.railway.app/reset-password",
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
            return;
        }

        console.log("Password reset email sent:", data,email);

        toast.success("Password reset email sent! Please check your inbox.");
        setLoading(false);

    }

    return (
        <Card className="z-50 rounded-md rounded-t-none w-full md:w-105 mx-auto">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Request Password Reset</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    Enter your email below to request a password reset. You will receive an email with instructions to reset your password.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    {/* Email */}
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="m@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => validateField("email", email)}
                            aria-invalid={!!errors.email}
                            aria-describedby={errors.email ? "email-error" : undefined}
                            className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {errors.email && (
                            <p id="email-error" className="text-xs text-destructive">
                                {errors.email}
                            </p>
                        )}
                    </div>

                  

                   

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        onClick={handlePasswordResetRequest}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Request Reset Password"}
                    </Button>

                  

                </div>
            </CardContent>
        </Card>
    );
}