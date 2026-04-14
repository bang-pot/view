import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  ExploreFiltersResponse,
  ExploreThemesQuery,
  ExploreThemesResponse,
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
