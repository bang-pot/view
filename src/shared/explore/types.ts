export type ExploreThemeCard = {
  themeId: number;
  themeName: string;
  storeId: number;
  storeName: string;
  regionLabel: string;
  genre: string | null;
  posterImageUrl: string | null;
  difficulty: string | null;
  activityLabel: string | null;
  recommendedPlayers: string | null;
  runningTimeMinutes: number | null;
  favoriteCount: number;
  isFavorited: boolean;
};

export type ExplorePageInfo = {
  page: number;
  size: number;
  hasNext: boolean;
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
