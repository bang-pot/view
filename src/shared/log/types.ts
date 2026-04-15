export type LogPhotoInput = {
  url: string;
  sizeBytes: number;
};

export type UploadLogPhotoResponse = LogPhotoInput;

export type CreateMeetingLogInput = {
  body: string;
  photos: LogPhotoInput[];
};

export type UpdateMeetingLogInput = CreateMeetingLogInput;

export type MeetingLogSummary = {
  logId: number;
  meetingId: number;
};

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
