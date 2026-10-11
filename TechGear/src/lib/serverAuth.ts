import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "customer" | "admin";
  isActive: number;
  createdAt: string;
};

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<User | null> => {
    const { currentUser } = await import("@/server/auth");
    return currentUser();
  },
);

export const serverSignIn = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ email: z.string().min(1), password: z.string().min(1) }),
  )
  .handler(async ({ data }): Promise<User | null> => {
    const { signIn } = await import("@/server/auth");
    return signIn(data.email, data.password);
  });

export const serverSignUp = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string(),
      email: z.string(),
      password: z.string(),
      phone: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<User> => {
    const { signUp } = await import("@/server/auth");
    return signUp(data.name, data.email, data.password, data.phone);
  });

export const serverUpdateProfile = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string() }))
  .handler(async ({ data }): Promise<User | null> => {
    const { updateProfile } = await import("@/server/auth");
    return updateProfile(data.name);
  });

export const serverChangePassword = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ currentPassword: z.string(), newPassword: z.string() }),
  )
  .handler(async ({ data }) => {
    const { changePassword } = await import("@/server/auth");
    return changePassword(data.currentPassword, data.newPassword);
  });

export const serverSignOut = createServerFn({ method: "POST" }).handler(
  async () => {
    const { signOut } = await import("@/server/auth");
    signOut();
    return { ok: true };
  },
);

export const serverListAdmins = createServerFn({ method: "GET" }).handler(
  async (): Promise<User[]> => {
    const { listAdmins } = await import("@/server/auth");
    return listAdmins();
  },
);

export const serverListCustomers = createServerFn({ method: "GET" }).handler(
  async (): Promise<User[]> => {
    const { listCustomers } = await import("@/server/auth");
    return listCustomers();
  },
);

export const serverAddAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ name: z.string(), username: z.string(), password: z.string() }),
  )
  .handler(async ({ data }): Promise<User[]> => {
    const { addAdmin } = await import("@/server/auth");
    return addAdmin(data.name, data.username, data.password);
  });

export const serverRemoveAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }): Promise<User[]> => {
    const { removeAdmin } = await import("@/server/auth");
    return removeAdmin(data.id);
  });
