"use client";

import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { Link, redirect, useSearchParams } from "react-router";
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
import { requestPasswordReset, resetPassword, signIn } from "~/lib/auth-client";
import { PasswordInput } from "~/components/ui/password-input";

// ─── Zod schema ────────────────────────────────────────────────────────────────
const resetPwdSchema = z.object({
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
});

type resetPwdFormErrors = Partial<Record<keyof z.infer<typeof resetPwdSchema>, string>>;



// ─── Component ─────────────────────────────────────────────────────────────────
export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token") ?? "";
    const posthog = usePostHog();

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<resetPwdFormErrors>({});

    /** Validate a single field on blur for inline feedback */
    function validateField(field: keyof resetPwdFormErrors, value: string) {
        const result = resetPwdSchema.shape[field].safeParse(value);
        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0].message,
        }));
    }

    /** Full form validation before submit; returns true when valid */
    function validateAll(): boolean {
        const result = resetPwdSchema.safeParse({ password });
        if (result.success) {
            setErrors({});
            return true;
        }
        const fieldErrors: resetPwdFormErrors = {};
        for (const issue of result.error.issues) {
            const key = issue.path[0] as keyof resetPwdFormErrors;
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return false;
    }



    async function handlePasswordReset() {
        if (!password || !validateAll()) {
            toast.error("Please enter a new password.");
            return;
        }

        const { data, error } = await resetPassword({
            newPassword: password,
            token,
        });

        if (error) {
            toast.error(error.message);
            return;
        }

        toast.success("Password has been reset successfully! You can now log in with your new password.");
        return redirect("/sign-in");


    }

    return (
        <Card className="z-50 rounded-md rounded-t-none w-full md:w-105 mx-auto">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Reset Password</CardTitle>

            </CardHeader>
            <CardContent>
                <div className="grid gap-4">


                    {/* Password */}
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Reset Password</Label>

                        </div>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => validateField("password", password)}
                            autoComplete="current-password"
                            placeholder="Password"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? "password-error" : undefined}
                            className={errors.password ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {errors.password && (
                            <p id="password-error" className="text-xs text-destructive">
                                {errors.password}
                            </p>
                        )}
                    </div>



                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        onClick={handlePasswordReset}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Reset Password"}
                    </Button>




                </div>
            </CardContent>
        </Card>
    );
}