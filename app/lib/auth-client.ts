import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react

export const authClient = createAuthClient({
    //you can pass client configuration here
    //cleabaseURL: "http://localhost:5173" // Base URL of your app, can also be set via env variable
    baseURL: "https://mystudies-production.up.railway.app"
})

export const { useSession, getSession, signIn, signOut, signUp } = authClient; 