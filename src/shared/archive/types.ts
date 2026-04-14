export type ArchiveMeetingResult = "SUCCESS" | "FAILURE";

export type ArchiveMeetingCard = {
  meetingId: number;
  crewId: number;
  crewName: string;
  themeName: string;
  place: string;
  date: string;
  result: ArchiveMeetingResult;
  posterImageUrl: string | null;
};

export type ArchiveMeetingsResponse = {
  items: ArchiveMeetingCard[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};

export type ArchiveMeetingsQuery = {
  page: number;
  size: number;
};
