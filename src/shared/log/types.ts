export type LogPhotoInput = {
  uploadId: number;
};

export type UploadLogPhotoResponse = {
  uploadId: number;
  url: string;
  sizeBytes: number;
};

export type CreateMeetingLogInput = {
  body: string;
  photos: LogPhotoInput[];
};

export type UpdateMeetingLogInput = CreateMeetingLogInput;

export type MeetingLogMeStatus =
  | "EXISTS"
  | "NOT_WRITTEN"
  | "DELETED_BLOCKED";

type MeetingLogMeMetadata = {
  meetingId: number;
  meetingTitle: string | null;
  themeName: string | null;
  place: string | null;
  date: string | null;
  authorNickname: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type ExistingMeetingLog = MeetingLogMeMetadata & {
  status: "EXISTS";
  logId: number;
  body: string;
  photos: string[];
};

export type MissingMeetingLog = MeetingLogMeMetadata & {
  status: "NOT_WRITTEN" | "DELETED_BLOCKED";
  logId: null;
  body: null;
  photos: string[];
};

export type MeetingLogMeResponse = ExistingMeetingLog | MissingMeetingLog;

export type CrewLogFeedItem = {
  logId: number;
  meetingId: number;
  authorNickname: string;
  meetingTitle: string;
  meetingDate: string;
  createdAt: string;
  excerpt: string;
  coverPhotoUrl: string | null;
  extraPhotoCount: number;
};

export type CrewLogFeedQuery = {
  page: number;
  size: number;
};

export type CrewLogFeedResponse = {
  items: CrewLogFeedItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type SaveMeetingLogResponse = {
  logId: number;
  meetingId: number;
};

export type DeleteMeetingLogResponse = {
  logId: number;
  deletedBy: "AUTHOR" | "LEADER";
};

export type MeetingLogDetail = {
  logId: number;
  meetingId: number;
  meetingTitle: string;
  themeName: string;
  place: string;
  date: string;
  authorNickname: string;
  createdAt: string;
  updatedAt: string;
  body: string;
  photos: string[];
};
