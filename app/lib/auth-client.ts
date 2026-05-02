import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react

const isProduction = import.meta.env.MODE === "production"

export const authClient = createAuthClient({
    //you can pass client configuration here
    baseURL: isProduction ? window.location.origin : "http://localhost:5173"
})

export const { useSession, getSession, signIn, signOut, signUp } = authClient;