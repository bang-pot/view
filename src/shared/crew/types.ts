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
