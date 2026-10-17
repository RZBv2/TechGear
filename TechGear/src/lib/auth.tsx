import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  serverChangePassword,
  serverResendVerification,
  serverSignIn,
  serverSignOut,
  serverSignUp,
  serverUpdateProfile,
  serverVerifyEmail,
} from "@/lib/serverAuth";

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  isAdmin: boolean;
};
export type AuthResult =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; verificationRequired: true; email: string };
type AuthContextValue = {
  user: AuthUser | null;
  ready: boolean;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  verifyEmail: (email: string, code: string) => Promise<AuthResult>;
  resendVerification: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  updateProfile: (name: string) => Promise<AuthResult>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<AuthResult>;
};

export const ADMIN_EMAIL = "rzbv2@techgear.local";
const AuthContext = createContext<AuthContextValue | null>(null);

type ServerUser = Awaited<ReturnType<typeof getCurrentUser>>;
function toAuthUser(serverUser: ServerUser): AuthUser | null {
  if (!serverUser) return null;
  return {
    id: serverUser.id,
    name: serverUser.name,
    email: serverUser.email,
    phone: serverUser.phone,
    isAdmin: serverUser.role === "admin",
  };
}
function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((serverUser) => {
        if (active) setUser(toAuthUser(serverUser));
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const serverUser = await serverSignIn({ data: { email, password } });
        if (!serverUser)
          return { ok: false, error: "Email or password is incorrect." };
        setUser(toAuthUser(serverUser));
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error, "Unable to sign in right now."),
        };
      }
    },
    [],
  );

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      try {
        const response = await serverSignUp({
          data: { name, email, password },
        });
        return {
          ok: false,
          verificationRequired: true,
          email: response.email,
        };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(
            error,
            "Unable to create your account right now.",
          ),
        };
      }
    },
    [],
  );

  const verifyEmail = useCallback(
    async (email: string, code: string): Promise<AuthResult> => {
      try {
        const serverUser = await serverVerifyEmail({ data: { email, code } });
        setUser(toAuthUser(serverUser));
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error, "Unable to verify this code."),
        };
      }
    },
    [],
  );

  const resendVerification = useCallback(
    async (email: string): Promise<AuthResult> => {
      try {
        await serverResendVerification({ data: { email } });
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error, "Unable to send another code."),
        };
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      await serverSignOut();
    } finally {
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(
    async (name: string): Promise<AuthResult> => {
      try {
        const updated = await serverUpdateProfile({ data: { name } });
        if (!updated) return { ok: false, error: "You must be signed in." };
        setUser(toAuthUser(updated));
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error, "Unable to update your profile."),
        };
      }
    },
    [],
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      newPassword: string,
    ): Promise<AuthResult> => {
      try {
        await serverChangePassword({ data: { currentPassword, newPassword } });
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: errorMessage(error, "Unable to change your password."),
        };
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      signUp,
      signIn,
      verifyEmail,
      resendVerification,
      signOut,
      updateProfile,
      changePassword,
    }),
    [
      user,
      ready,
      signUp,
      signIn,
      verifyEmail,
      resendVerification,
      signOut,
      updateProfile,
      changePassword,
    ],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

/** @deprecated Customer listings are now loaded by the server admin API. */
export function getAllCustomers(): AuthUser[] {
  return [];
}
