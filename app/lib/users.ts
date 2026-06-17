import bcrypt from "bcryptjs";

export type UserRole = "admin" | "user";

export interface CredentialUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
}

const DEFAULT_CREDENTIAL_USERS: CredentialUser[] = [
  {
    id: "admin-1",
    email: "admin@wewin.edu.vn",
    name: "WeWIN Admin",
    passwordHash:
      "$2b$10$/ogenboWLOhi7PC2oOtGIehZI0wo2exr3BzAKUpIhnrvdo3LI.VnS",
    role: "admin",
  },
  {
    id: "user-1",
    email: "user@wewin.edu.vn",
    name: "Học viên Demo",
    passwordHash:
      "$2b$10$/ogenboWLOhi7PC2oOtGIehZI0wo2exr3BzAKUpIhnrvdo3LI.VnS",
    role: "user",
  },
];

function normalizeCredentialUser(
  user: Partial<CredentialUser>,
  index: number
): CredentialUser {
  const role: UserRole = user.role === "admin" ? "admin" : "user";
  return {
    id: user.id || `credential-user-${index + 1}`,
    email: String(user.email || "").trim(),
    name: String(user.name || user.email || "").trim(),
    passwordHash: String(user.passwordHash || "").trim(),
    role,
  };
}

function getCredentialUsers(): CredentialUser[] {
  const raw = process.env.CREDENTIAL_USERS_JSON;
  if (!raw) return DEFAULT_CREDENTIAL_USERS;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error("CREDENTIAL_USERS_JSON must be an array.");
    }

    const users = parsed
      .map(normalizeCredentialUser)
      .filter((user) => user.email && user.passwordHash);

    return users.length ? users : DEFAULT_CREDENTIAL_USERS;
  } catch (error) {
    console.error("Invalid CREDENTIAL_USERS_JSON:", error);
    return DEFAULT_CREDENTIAL_USERS;
  }
}

export async function verifyCredentialUser(
  email: string,
  password: string
): Promise<CredentialUser | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const user = getCredentialUsers().find(
    (u) => u.email.toLowerCase() === normalizedEmail
  );

  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  return valid ? user : null;
}
