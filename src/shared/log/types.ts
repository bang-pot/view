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
