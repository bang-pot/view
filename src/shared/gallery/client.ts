import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type {
  CrewGalleryDetail,
  CrewGalleryQuery,
  CrewGalleryResponse,
} from "@/shared/gallery/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

export async function getCrewGallery(
  crewId: number,
  query: CrewGalleryQuery,
): Promise<CrewGalleryResponse> {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("size", String(query.size));

  return requestJson<CrewGalleryResponse>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/gallery?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "CREW_GALLERY_LOAD_FAILED",
      message: "크루 사진첩을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    },
  );
}

export async function getCrewGalleryDetail(
  crewId: number,
  meetingId: number,
): Promise<CrewGalleryDetail> {
  return requestJson<CrewGalleryDetail>(
    getApiBaseUrl(),
    `/api/crews/${crewId}/gallery/${meetingId}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    },
    {
      code: "GALLERY_DETAIL_LOAD_FAILED",
      message: "?ъ쭊 ?곸꽭瑜?遺덈윭?ㅼ? 紐삵뻽?댁슂. ?좎떆 ???ㅼ떆 ?쒕룄??二쇱꽭??",
    },
  );
}
