export type CrewVisibility = "PUBLIC" | "PRIVATE";

export type CrewJoinStatus =
  | "GUEST"
  | "COMPLETION_REQUIRED"
  | "CAN_REQUEST"
  | "PENDING"
  | "MEMBER"
  | "PRIVATE_RESTRICTED";

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
