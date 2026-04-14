import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  ArchiveMeetingsQuery,
  ArchiveMeetingsResponse,
} from "@/shared/archive/types";

export async function getArchiveMeetings(
  query: ArchiveMeetingsQuery,
): Promise<ArchiveMeetingsResponse> {
  const { apiBaseUrl } = getPublicRuntimeConfig();
  const params = new URLSearchParams();

  params.set("page", String(query.page));
  params.set("size", String(query.size));

  return requestJson<ArchiveMeetingsResponse>(
    apiBaseUrl,
    `/api/archive/meetings?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "ARCHIVE_MEETINGS_LOAD_FAILED",
      userMessage: "아카이브 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}
