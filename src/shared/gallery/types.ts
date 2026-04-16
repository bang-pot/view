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

export type CrewGalleryDetailPhoto = {
  photoId: number;
  url: string;
  order: number;
};

export type CrewGalleryDetail = {
  meetingId: number;
  meetingDate: string;
  meetingTitle: string;
  photos: CrewGalleryDetailPhoto[];
  totalPhotoCount: number;
};
