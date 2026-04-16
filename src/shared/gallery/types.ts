export type CrewGalleryItem = {
  meetingId: number;
  meetingDate: string;
  meetingTitle: string;
  coverPhotoUrl: string | null;
  extraPhotoCount: number;
};

export type CrewGalleryQuery = {
  page: number;
  size: number;
};

export type CrewGalleryResponse = {
  items: CrewGalleryItem[];
  pageInfo: {
    page: number;
    size: number;
    hasNext: boolean;
  };
};
