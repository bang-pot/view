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

export type CreatedMeetingStatus =
  | "RECRUITING"
  | "RECRUITMENT_CLOSED"
  | "COMPLETED"
  | "CANCELED";

export type CreatedMeetingListItem = {
  meetingId: number;
  title: string;
  status: CreatedMeetingStatus;
  date: string;
  time: string;
  crewId: number;
  crewName: string;
};

export type CreatedMeetingsResponse = {
  items: CreatedMeetingListItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type JoinedMeetingStatus =
  | "RECRUITING"
  | "RECRUITMENT_CLOSED"
  | "COMPLETED"
  | "CANCELED";

export type JoinedMeetingResult = "SUCCESS" | "FAILURE";

export type JoinedMeetingListItem = {
  meetingId: number;
  title: string;
  themeName: string;
  crewId: number;
  crewName: string;
  date: string;
  time: string;
  status: JoinedMeetingStatus;
  result: JoinedMeetingResult | null;
  canWriteReview: boolean;
};

export type JoinedMeetingsResponse = {
  items: JoinedMeetingListItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type MyCrewVisibility = "PUBLIC" | "PRIVATE";

export type MyCrewListItem = {
  crewId: number;
  crewName: string;
  visibility: MyCrewVisibility;
  leaderNickname: string;
  coverImageUrl: string | null;
};

export type MyCrewsResponse = {
  items: MyCrewListItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type PendingCrewListItem = {
  joinRequestId: number;
  crewId: number;
  crewName: string;
  requestedAt: string;
  messageSummary: string | null;
};

export type PendingCrewsResponse = {
  items: PendingCrewListItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type CancelPendingCrewResponse = {
  joinRequestId: number;
  crewId: number;
};

export type WithdrawalBlockingActiveCrew = {
  crewId: number;
  crewName: string;
};

export type WithdrawalBlockingMeetingStatus = "RECRUITING" | "RECRUITMENT_CLOSED";

export type WithdrawalParticipationRole = "HOST" | "PARTICIPANT";

export type WithdrawalBlockingParticipatingMeeting = {
  meetingId: number;
  meetingTitle: string;
  crewId: number;
  crewName: string;
  meetingStatus: WithdrawalBlockingMeetingStatus;
  date: string;
  time: string;
  participationRole: WithdrawalParticipationRole;
};

export type WithdrawalCheckResponse = {
  canWithdraw: boolean;
  blockingActiveCrews: WithdrawalBlockingActiveCrew[];
  blockingParticipatingMeetings: WithdrawalBlockingParticipatingMeeting[];
};
