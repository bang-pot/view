export type MeetingStatus =
  | "RECRUITING"
  | "RECRUITMENT_CLOSED"
  | "COMPLETED"
  | "CANCELED";

export type MeetingResult = "NOT_RECORDED" | "SUCCESS" | "FAILURE";

export type MeetingParticipationStatus =
  | "NOT_JOINED"
  | "JOINED"
  | "LEFT"
  | "PENDING"
  | "APPROVED";

export type CreateMeetingInput = {
  title: string;
  date: string;
  time: string;
  place: string;
  themeName: string;
  capacity: number;
  totalCost: number | null;
  contactLink: string | null;
  description: string | null;
};

export type CreateMeetingResponse = {
  meetingId: number;
  crewId: number;
  hostUserId: number;
  title: string;
  themeName: string;
  place: string;
  date: string;
  time: string;
  capacity: number;
  totalCost: number | null;
  contactLink: string | null;
  description: string | null;
  status: MeetingStatus;
  result: MeetingResult;
};

export type MeetingListItem = {
  meetingId: number;
  title: string;
  themeName: string;
  place: string;
  date: string;
  time: string;
  status: MeetingStatus;
  result: MeetingResult;
  capacity: number;
};

export type MeetingListPageInfo = {
  page: number;
  size: number;
  hasNext: boolean;
};

export type MeetingListResponse = {
  items: MeetingListItem[];
  pageInfo: MeetingListPageInfo;
};

export type MeetingListQuery = {
  page: number;
  size: number;
};

export type MeetingDetail = {
  meetingId: number;
  crewId: number;
  hostUserId: number;
  title: string;
  themeName: string;
  place: string;
  date: string;
  time: string;
  capacity: number;
  totalCost: number | null;
  contactLink: string | null;
  description: string | null;
  status: MeetingStatus;
  result: MeetingResult;
  myParticipationStatus: MeetingParticipationStatus;
};

export type UpdateMeetingInput = {
  title: string;
  themeName: string;
  place: string;
  date: string;
  time: string;
  capacity: number;
  description: string | null;
  totalCost: number | null;
  contactLink: string | null;
};

export type UpdateMeetingResponse = {
  meetingId: number;
  crewId: number;
  hostUserId: number;
  title: string;
  themeName: string;
  place: string;
  date: string;
  time: string;
  capacity: number;
  totalCost: number | null;
  contactLink: string | null;
  description: string | null;
  status: MeetingStatus;
  result: MeetingResult;
};

export type JoinMeetingResponse = {
  meetingId: number;
  myParticipationStatus: "JOINED";
};

export type CancelMeetingJoinResponse = {
  meetingId: number;
  myParticipationStatus: "NOT_JOINED";
};

export type MeetingStatusUpdateResponse = {
  meetingId: number;
  status: MeetingStatus;
};

export type MeetingResultRecordResponse = {
  meetingId: number;
  result: Exclude<MeetingResult, "NOT_RECORDED">;
};
