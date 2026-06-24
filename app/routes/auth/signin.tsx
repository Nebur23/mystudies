"use client";

import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
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
const signInSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
});

type SignInFormErrors = Partial<Record<keyof z.infer<typeof signInSchema>, string>>;

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Returns a safe redirect target from the `?redirect=` query param.
 * Only allows relative paths — strips any supplied origin so an attacker
 * cannot redirect to an external site.
 */
function getSafeRedirect(redirectParam: string | null, fallback = "/"): string {
    if (!redirectParam) return fallback;

    try {
        // If it parses as an absolute URL, extract only the pathname + search + hash
        const url = new URL(redirectParam, window.location.origin);
        // Reject redirects pointing to a different origin
        if (url.origin !== window.location.origin) return fallback;
        return url.pathname + url.search + url.hash;
    } catch {
        // Already a relative path like /courses/june-2024-paper-1-…
        return redirectParam.startsWith("/") ? redirectParam : fallback;
    }
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SignInCard() {
    const [searchParams] = useSearchParams();
    const redirectTo = getSafeRedirect(searchParams.get("redirect"));
    const posthog = usePostHog();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<SignInFormErrors>({});

    /** Validate a single field on blur for inline feedback */
    function validateField(field: keyof SignInFormErrors, value: string) {
        const result = signInSchema.shape[field].safeParse(value);
        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0].message,
        }));
    }

    /** Full form validation before submit; returns true when valid */
    function validateAll(): boolean {
        const result = signInSchema.safeParse({ email, password });
        if (result.success) {
            setErrors({});
            return true;
        }
        const fieldErrors: SignInFormErrors = {};
        for (const issue of result.error.issues) {
            const key = issue.path[0] as keyof SignInFormErrors;
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return false;
    }

    async function handleEmailSignIn() {
        if (!validateAll()) return;

        await signIn.email(
            {
                email,
                password,
                callbackURL: redirectTo,  // ← respects ?redirect= param
                rememberMe,
            },
            {
                onRequest: () => setLoading(true),
                onSuccess: () => {
                    setLoading(false);
                    posthog?.identify(email, { email });
                    posthog?.capture("user_signed_in", { method: "email" });
                    toast.success("Logged in successfully!");
                },
                onError: (ctx) => {
                    setLoading(false);
                    toast.error(ctx.error.message);
                },
            },
        );
    }

    async function handlePasswordReset() {
        if (!email) {
            toast.error("Please enter your email to reset your password.");
            return;
        }

       const { data, error } = await requestPasswordReset({
            email,
            redirectTo: "https://mystudies-production.up.railway.app/reset-password",
        });

        if (error) {
            toast.error(error.message);
        }

        toast.success("Password reset email sent! Please check your inbox.");


    }

    return (
        <Card className="z-50 rounded-md rounded-t-none w-full md:w-105 mx-auto">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                    Enter your email below to login to your account
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

                    {/* Password */}
                    <div className="grid gap-2">
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <button
                                onClick={handlePasswordReset}
                                className="ml-auto inline-block text-sm underline"
                            >
                                Forgot your password?
                            </button>
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

                    {/* Remember me */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="remember-me"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked === true)}
                        />
                        <Label htmlFor="remember-me">Remember me</Label>
                    </div>

                    {/* Submit */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                        onClick={handleEmailSignIn}
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : "Login"}
                    </Button>

                    {/* Google OAuth — also passes the redirect through */}
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                            posthog?.capture("user_signed_in", { method: "google" });
                            signIn.social({
                                provider: "google",
                                callbackURL: redirectTo,
                            });
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="0.98em" height="1em" viewBox="0 0 256 262">
                            <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" />
                            <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" />
                            <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z" />
                            <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
                        </svg>
                        Continue with Google
                    </Button>

                    <div className="text-center">
                        Don&apos;t have an account?{" "}
                        <Link className="underline" to="/sign-up">
                            Sign up
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}