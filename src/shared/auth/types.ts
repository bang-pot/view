export type AuthStatus = "GUEST" | "TEMP" | "FULL";

export type AuthenticatedUser = {
  id: number;
  nickname: string | null;
};

export type AuthMeResponse = {
  authStatus: AuthStatus;
  completionRequired: boolean;
  redirectTo: string | null;
  requiredTermsVersion: string;
  user: AuthenticatedUser | null;
  requiredTermsAcceptedAt: string | null;
};

export type AuthCompletionResponse = {
  authStatus: "FULL";
  completionRequired: false;
  nextPath: string;
};

export type NicknameAvailabilityResponse = {
  nickname: string | null;
  available: boolean;
};
