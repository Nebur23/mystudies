import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react

export const authClient = createAuthClient({
    //you can pass client configuration here
    baseURL: "https://mystudies-production.up.railway.app"
})

export const { useSession, getSession, signIn, signOut, signUp } = authClient;