import { getMe, logout } from "@/shared/auth/client";

export async function logoutAndConfirmGuest(): Promise<boolean> {
  await logout();

  const nextMe = await getMe();
  return nextMe.authStatus === "GUEST";
}
