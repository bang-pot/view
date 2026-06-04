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

export type ProfileCalendarMeetingStatus =
  | "RECRUITING"
  | "RECRUITMENT_CLOSED"
  | "COMPLETED"
  | "CANCELED";

export type ProfileCalendarParticipationRole = "HOST" | "PARTICIPANT";

export type ProfileCalendarItem = {
  meetingId: number;
  meetingTitle: string;
  crewId: number;
  crewName: string;
  date: string;
  time: string;
  meetingStatus: ProfileCalendarMeetingStatus;
  isCanceled: boolean;
  participationRole: ProfileCalendarParticipationRole;
};

export type ProfileCalendarResponse = {
  items: ProfileCalendarItem[];
  totalCount: number;
};

export type MyMeetingLogListItem = {
  logId: number;
  crewId: number;
  crewName: string;
  meetingId: number;
  meetingTitle: string;
  meetingDate: string;
  createdAt: string;
  excerpt: string | null;
  coverPhotoUrl: string | null;
  photoCount: number;
};

export type MyMeetingLogsResponse = {
  items: MyMeetingLogListItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type FavoriteThemeSummaryItem = {
  themeId: number;
  themeName: string;
  storeName: string;
  regionName: string;
  thumbnailUrl: string | null;
  favoriteCount: number;
  isFavorite: boolean;
};

export type FavoriteThemesSummaryResponse = {
  items: FavoriteThemeSummaryItem[];
  totalCount: number;
  hasMore: boolean;
};

export type FavoriteThemeListItem = {
  themeId: number;
  themeName: string;
  storeName: string;
  regionName: string;
  thumbnailUrl: string | null;
  favoriteCount: number;
  isFavorite: boolean;
};

export type FavoriteThemesResponse = {
  items: FavoriteThemeListItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type UserSearchItem = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  gender: string | null;
  escapeCount: number;
};

export type UserSearchResponse = {
  items: UserSearchItem[];
  pageInfo: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export type HomeResponse = {
  isLoggedIn: boolean;
  myCrews: {
    items: HomeMyCrewPreviewItem[];
    totalCount: number;
  };
  upcomingMeetings: {
    nearestMeeting: HomeUpcomingMeetingPreviewItem | null;
    totalCount: number;
  };
  activityRecord: {
    completedCount: number;
    successRate: number;
  };
  publicCrewPreview: {
    items: HomePublicCrewPreviewItem[];
  };
  themeExplorePreview: {
    items: HomeThemeExplorePreviewItem[];
  };
};

export type HomeMyCrewPreviewItem = {
  crewId: number;
  crewName: string;
};

export type HomeUpcomingMeetingPreviewItem = {
  meetingId: number;
  themeName: string;
  date: string;
  time: string;
};

export type HomePublicCrewPreviewItem = {
  crewId: number;
  crewName: string;
  coverImageUrl: string | null;
  memberCount: number;
};

export type HomeThemeExplorePreviewItem = {
  themeId: number;
  themeName: string;
  storeName: string;
  regionName: string;
  thumbnailUrl: string | null;
  favoriteCount: number;
  isFavorite: boolean;
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

export type JoinedMeetingListItem = {
  meetingId: number;
  title: string;
  themeName: string;
  crewId: number;
  crewName: string;
  date: string;
  time: string;
  status: JoinedMeetingStatus;
  canWriteReview: boolean;
  participantCount?: number | null;
  capacity?: number | null;
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

export type WithdrawalCheckResponse = {
  canWithdraw: boolean;
  blockingActiveCrews: WithdrawalBlockingActiveCrew[];
};

export type WithdrawalReasonCode =
  | "NOT_USING"
  | "SERVICE_UNSATISFIED"
  | "LOW_ACTIVITY"
  | "OTHER";

export type WithdrawalRequest = {
  reasonCode: WithdrawalReasonCode;
  reasonDetail: string | null;
  confirmationChecked: true;
};

export type WithdrawalResponse = {
  withdrawnAt: string;
  canLogin: false;
};
