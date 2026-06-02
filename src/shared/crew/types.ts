export type CrewVisibility = "PUBLIC" | "PRIVATE";

export type CrewJoinStatus =
  | "GUEST"
  | "COMPLETION_REQUIRED"
  | "CAN_REQUEST"
  | "PENDING"
  | "MEMBER"
  | "PRIVATE_RESTRICTED";

export type CrewJoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type CrewCreateInput = {
  name: string;
  description: string | null;
  visibility: CrewVisibility;
  imageUploadId: number | null;
};

export type CrewCreateResponse = {
  crewId: number;
  name: string;
  myRole: string;
};

export type ExploreCrewSort =
  | "LATEST"
  | "OLDEST"
  | "MEMBER_COUNT_DESC"
  | "MEMBER_COUNT_ASC";

export const EXPLORE_CREW_SORT_LABELS: Record<ExploreCrewSort, string> = {
  LATEST: "최신순",
  OLDEST: "오래된순",
  MEMBER_COUNT_DESC: "멤버 많은순",
  MEMBER_COUNT_ASC: "멤버 적은순",
};

export type ExploreCrewCard = {
  crewId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  visibility: CrewVisibility;
  leaderNickname: string;
  memberCount: number;
};

export type ExploreCrewPageInfo = {
  page: number;
  size: number;
  hasNext: boolean;
};

export type ExploreCrewsResponse = {
  items: ExploreCrewCard[];
  pageInfo: ExploreCrewPageInfo;
};

export type ExploreCrewsQuery = {
  page: number;
  size: number;
  keyword?: string;
  sort?: ExploreCrewSort;
};

export type CrewJoinViewResponse = {
  crewId: number;
  name: string;
  description: string | null;
  visibility: CrewVisibility;
  imageUrl: string | null;
  myStatus: CrewJoinStatus;
};

export type CrewHubResponse = {
  crewId: number;
  name: string;
  description: string | null;
  visibility: CrewVisibility;
  imageUrl: string | null;
  myRole: string;
  hasNotice: boolean;
  pendingJoinRequestCount: number | null;
};

export type CrewVisibilityUpdateResponse = {
  crewId: number;
  visibility: CrewVisibility;
};

export type CrewLeaveResponse = {
  crewId: number;
};

export type CrewTransferLeadershipResponse = {
  crewId: number;
  leaderUserId: number;
};

export type CrewRemoveMemberResponse = {
  crewId: number;
  removedUserId: number;
};

export type CrewDeleteResponse = {
  crewId: number;
};

export type CrewMemberRole = "LEADER" | "MEMBER";

export type CrewMember = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  bio: string | null;
  gender: string | null;
  escapeCount: number;
  role: CrewMemberRole;
  joinedAt: string;
};

export type CrewMembersPageInfo = {
  page: number;
  size: number;
  hasNext: boolean;
};

export type CrewMembersQuery = {
  page?: number;
  size?: number;
};

export type CrewMembersResponse = {
  items: CrewMember[];
  pageInfo: CrewMembersPageInfo;
};

export type CrewPolicy = {
  policyId: number;
  title: string;
  content: string;
};

export type CrewJoinRequestInput = {
  message: string | null;
};

export type CrewJoinRequestResponse = {
  crewId: number;
  myStatus: Extract<CrewJoinStatus, "PENDING">;
};

export type PendingCrewJoinRequestSummary = {
  requestId: number;
  userId: number;
  nickname: string;
};

export type CrewJoinRequestRecord = {
  requestId: number;
  userId: number;
  nickname: string;
  message: string | null;
  status: CrewJoinRequestStatus;
};

export type CrewJoinRequestApproveResponse = {
  crewId: number;
  requestId: number;
  userId: number;
  role: string;
};

export type CrewJoinRequestRejectResponse = {
  crewId: number;
  requestId: number;
};

export type CrewInviteCandidate = {
  userId: number;
  nickname: string;
};

export type CrewInviteResponse = {
  crewId: number;
  targetUserId: number;
  status: "PENDING";
};

export type MyCrewInviteStatus = "PENDING" | "APPROVED" | "REJECTED";

export type MyCrewInvite = {
  inviteId: number;
  crewId: number;
  crewName: string;
  inviterNickname: string;
  status: MyCrewInviteStatus;
};

export type MyCrewInvitesPageInfo = {
  page: number;
  size: number;
  hasNext: boolean;
};

export type MyCrewInvitesResponse = {
  items: MyCrewInvite[];
  pageInfo: MyCrewInvitesPageInfo;
};

export type MyCrewInvitesQuery = {
  page: number;
  size: number;
};

export type CrewInviteAcceptResponse = {
  inviteId: number;
  crewId: number;
  status: "APPROVED";
};

export type CrewInviteRejectResponse = {
  inviteId: number;
  crewId: number;
  status: "REJECTED";
};

export type CrewScheduleMeetingStatus =
  | "RECRUITING"
  | "RECRUITMENT_CLOSED"
  | "COMPLETED"
  | "CANCELED";

export type CrewScheduleItem = {
  meetingId: number;
  themeName: string;
  date: string;
  time: string;
  meetingStatus: CrewScheduleMeetingStatus;
  recruitmentStatus: string;
  place: string;
  participantCount: number;
  capacity?: number;
  isCanceled: boolean;
};

export type CrewScheduleResponse = {
  items: CrewScheduleItem[];
};

export type CrewScheduleRange = {
  from: string;
  to: string;
};
