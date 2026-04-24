import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  ExploreFiltersResponse,
  ExploreMeetingCreateCrewsResponse,
  ExploreThemeDetail,
  ExploreThemesQuery,
  ExploreThemesResponse,
  ThemeFavoriteResponse,
} from "@/shared/explore/types";

function buildThemesQuery(query: ExploreThemesQuery): string {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  for (const genre of query.genres) {
    params.append("genres", genre);
  }

  if (query.region) {
    params.set("region", query.region);
  }

  if (query.district) {
    params.set("district", query.district);
  }

  params.set("page", String(query.page));
  params.set("size", String(query.size));

  return params.toString();
}

export async function getExploreFilters(): Promise<ExploreFiltersResponse> {
  const { apiBaseUrl } = getPublicRuntimeConfig();

  return requestJson<ExploreFiltersResponse>(
    apiBaseUrl,
    "/api/explore/filters",
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "EXPLORE_FILTERS_LOAD_FAILED",
      userMessage: "탐색 필터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getExploreThemes(
  query: ExploreThemesQuery,
): Promise<ExploreThemesResponse> {
  const { apiBaseUrl } = getPublicRuntimeConfig();
  const queryString = buildThemesQuery(query);
  const path = queryString ? `/api/explore/themes?${queryString}` : "/api/explore/themes";

  return requestJson<ExploreThemesResponse>(
    apiBaseUrl,
    path,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "EXPLORE_THEMES_LOAD_FAILED",
      userMessage: "탐색 결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getExploreThemeDetail(themeId: number): Promise<ExploreThemeDetail> {
  const { apiBaseUrl } = getPublicRuntimeConfig();

  return requestJson<ExploreThemeDetail>(
    apiBaseUrl,
    `/api/explore/themes/${themeId}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "EXPLORE_THEME_DETAIL_LOAD_FAILED",
      userMessage: "테마 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getExploreMeetingCreateCrews(): Promise<ExploreMeetingCreateCrewsResponse> {
  const { apiBaseUrl } = getPublicRuntimeConfig();

  return requestJson<ExploreMeetingCreateCrewsResponse>(
    apiBaseUrl,
    "/api/crews/me/meeting-create",
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "EXPLORE_MEETING_CREATE_CREWS_LOAD_FAILED",
      userMessage: "크루 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function addThemeFavorite(themeId: number): Promise<ThemeFavoriteResponse> {
  const { apiBaseUrl } = getPublicRuntimeConfig();

  return requestJson<ThemeFavoriteResponse>(
    apiBaseUrl,
    `/api/themes/${themeId}/favorite`,
    {
      method: "POST",
      credentials: "include",
    },
    {
      code: "EXPLORE_THEME_FAVORITE_ADD_FAILED",
      userMessage: "찜 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function removeThemeFavorite(themeId: number): Promise<ThemeFavoriteResponse> {
  const { apiBaseUrl } = getPublicRuntimeConfig();

  return requestJson<ThemeFavoriteResponse>(
    apiBaseUrl,
    `/api/themes/${themeId}/favorite`,
    {
      method: "DELETE",
      credentials: "include",
    },
    {
      code: "EXPLORE_THEME_FAVORITE_REMOVE_FAILED",
      userMessage: "찜 상태를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}
