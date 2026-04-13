export type MeetingStatus =
  | "RECRUITING"
  | "RECRUITMENT_CLOSED"
  | "COMPLETED"
  | "CANCELED";

export type MeetingResult = "NOT_RECORDED" | "SUCCESS" | "FAILURE";

export type MeetingParticipationStatus = "NOT_JOINED" | "JOINED";

export type CreateMeetingInput = {
  date: string;
  time: string;
  place: string;
  themeName: string;
  capacity: number;
  totalCost: number | null;
  reservationLink: string | null;
  openChatLink: string | null;
  description: string | null;
};

export type CreateMeetingResponse = {
  meetingId: number;
  crewId: number;
  themeName: string;
  place: string;
  date: string;
  time: string;
  status: MeetingStatus;
  result: MeetingResult;
};

export type MeetingListItem = {
  meetingId: number;
  themeName: string;
  place: string;
  date: string;
  time: string;
  status: MeetingStatus;
  result: MeetingResult;
  capacity: number;
};

export type MeetingDetail = {
  meetingId: number;
  crewId: number;
  hostUserId: number;
  themeName: string;
  place: string;
  date: string;
  time: string;
  capacity: number;
  totalCost: number | null;
  reservationLink: string | null;
  openChatLink: string | null;
  description: string | null;
  status: MeetingStatus;
  result: MeetingResult;
  myParticipationStatus: MeetingParticipationStatus;
};

export type JoinMeetingResponse = {
  meetingId: number;
  myParticipationStatus: "JOINED";
};
