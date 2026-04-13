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
  imageUrl: string | null;
};

export type CrewCreateResponse = {
  crewId: number;
  name: string;
  myRole: string;
};

export type PublicCrewSummary = {
  crewId: number;
  name: string;
  description: string | null;
  visibility: CrewVisibility;
  imageUrl: string | null;
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
