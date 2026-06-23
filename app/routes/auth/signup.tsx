import { usePostHog } from "@posthog/react";
import { Button } from "~/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { PasswordInput } from "~/components/ui/password-input";
import { useState } from "react";
import { authClient, signIn, signUp } from "~/lib/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Facebook } from "@hugeicons/core-free-icons";
import { Link, useNavigate } from "react-router";
import { FieldDescription } from "~/components/ui/field";
import { z } from "zod";

// ─── Schema ────────────────────────────────────────────────────────────────────
const signUpSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z
        .string()
        .min(1, "Email is required")
        .email("Please enter a valid email address"),
    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Password must be at least 8 characters"),
});

type SignUpFields = keyof z.infer<typeof signUpSchema>;
type FormErrors = Partial<Record<SignUpFields, string>>;

// ─── Component ─────────────────────────────────────────────────────────────────
export default function SignUp() {
    const navigate = useNavigate();
    const posthog = usePostHog();

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});

    function validateField(field: SignUpFields, value: string) {
        const result = signUpSchema.shape[field].safeParse(value);
        setErrors((prev) => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0].message,
        }));
    }

    function validateAll(): boolean {
        const result = signUpSchema.safeParse({ firstName, lastName, email, password });
        if (result.success) {
            setErrors({});
            return true;
        }
        const fieldErrors: FormErrors = {};
        for (const issue of result.error.issues) {
            const key = issue.path[0] as SignUpFields;
            if (!fieldErrors[key]) fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        return false;
    }

    async function handleSignUp() {
        if (!validateAll()) return;

        await signUp.email({
            email,
            password,
            name: `${firstName} ${lastName}`,
            image: "",
            callbackURL: "/sign-in",
            fetchOptions: {
                onRequest: () => setLoading(true),
                onResponse: () => {
                    setLoading(false);
                    posthog?.identify(email, { email, name: `${firstName} ${lastName}` });
                    posthog?.capture("user_signed_up", { method: "email" });
                    toast.success("Account created successfully! Please sign in.");
                    navigate("/sign-in");
                },
                onError: (ctx) => {
                    setLoading(false);
                    toast.error(ctx.error.message);
                },
            },
        });
    }

    return (
        <div >
            <Card className="z-50 rounded-md rounded-t-none w-full md:w-105 mx-auto">
                <CardHeader>
                    <CardTitle className="text-lg md:text-xl">Sign Up</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                        Enter your information to create an account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {/* Name row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="first-name">First name</Label>
                                <Input
                                    id="first-name"
                                    placeholder="Max"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    onBlur={() => validateField("firstName", firstName)}
                                    aria-invalid={!!errors.firstName}
                                    aria-describedby={errors.firstName ? "first-name-error" : undefined}
                                    className={errors.firstName ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.firstName && (
                                    <p id="first-name-error" className="text-xs text-destructive">
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="last-name">Last name</Label>
                                <Input
                                    id="last-name"
                                    placeholder="Robinson"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    onBlur={() => validateField("lastName", lastName)}
                                    aria-invalid={!!errors.lastName}
                                    aria-describedby={errors.lastName ? "last-name-error" : undefined}
                                    className={errors.lastName ? "border-destructive focus-visible:ring-destructive" : ""}
                                />
                                {errors.lastName && (
                                    <p id="last-name-error" className="text-xs text-destructive">
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Email */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="me@example.com"
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
                            <Label htmlFor="password">Password</Label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={() => validateField("password", password)}
                                autoComplete="new-password"
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
                            size="lg"
                            type="submit"
                            className="w-full"
                            disabled={loading}
                            onClick={handleSignUp}
                        >
                            {loading ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                "Create an account"
                            )}
                        </Button>

                        {/* Google */}
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full gap-2"
                            disabled={loading}
                            onClick={async () => {
                                posthog?.capture("user_signed_up", { method: "google" });
                                await authClient.signIn.social({
                                    provider: "google",
                                    callbackURL: "/",
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

                        {/* Facebook */}
                        <Button
                            variant="outline"
                            className="w-full gap-2"
                            disabled={loading}
                            onClick={async () => {
                                posthog?.capture("user_signed_up", { method: "facebook" });
                                await signIn.social({
                                    provider: "facebook",
                                    callbackURL: "/",
                                });
                            }}
                        >
                            <HugeiconsIcon icon={Facebook} />
                            Continue with Facebook
                        </Button>

                        <div className="text-center">
                            Already have an account?{" "}
                            <Link className="underline" to="/sign-in">
                                Sign in
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <FieldDescription className="px-6 text-center mt-7 text-xs">
                By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
                and <a href="#">Privacy Policy</a>.
            </FieldDescription>
        </div>
    );
}