export type ExploreThemeCard = {
  themeId: number;
  themeName: string;
  storeId: number;
  storeName: string;
  regionLabel: string;
  genres: string[];
  posterImageUrl: string | null;
  difficulty: number | null;
  activityLabel: string | null;
  recommendedPlayers: string | null;
  runningTimeMinutes: number | null;
  favoriteCount: number;
  isFavorite: boolean;
};

export type ExploreRelatedThemeCard = {
  themeId: number;
  themeName: string;
  storeId: number;
  storeName: string;
  regionLabel: string;
  genres: string[];
  posterImageUrl: string | null;
  difficulty: number | null;
  runningTimeMinutes: number | null;
  favoriteCount: number;
  isFavorite: boolean;
};

export type ThemeFavoriteResponse = {
  themeId: number;
  isFavorite: boolean;
  favoriteCount: number;
};

export type ExplorePageInfo = {
  page: number;
  size: number;
  hasNext: boolean;
  totalElements: number;
  totalPages: number;
};

export type ExploreThemesResponse = {
  items: ExploreThemeCard[];
  pageInfo: ExplorePageInfo;
};

export type ExploreRegionFilter = {
  name: string;
  districts: string[];
};

export type ExploreFiltersResponse = {
  genres: string[];
  regions: ExploreRegionFilter[];
};

export type ExploreThemesQuery = {
  q: string;
  genres: string[];
  region: string;
  district: string;
  page: number;
  size: number;
};

export type ExploreThemeDetail = {
  themeId: number;
  themeName: string;
  storeId: number;
  storeName: string;
  regionLabel: string;
  genres: string[];
  posterImageUrl: string | null;
  difficulty: number | null;
  runningTimeMinutes: number | null;
  description: string | null;
  externalLink: string | null;
  isFavorite: boolean;
  relatedThemes: ExploreRelatedThemeCard[];
};

export type ExploreMeetingCreateCrew = {
  crewId: number;
  crewName: string;
};

export type ExploreMeetingCreateCrewsResponse = {
  crews: ExploreMeetingCreateCrew[];
};
