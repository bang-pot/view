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

export type AuthProfileHubResponse = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  createdMeetingsCount: number;
  joinedMeetingsCount: number;
  myCrewsCount: number;
  pendingCrewsCount: number;
};

export type AuthProfileUpdateResponse = {
  id: number;
  nickname: string;
  profileImageUrl: string | null;
  createdMeetingsCount: number | null;
  joinedMeetingsCount: number | null;
  myCrewsCount: number | null;
  pendingCrewsCount: number | null;
};
