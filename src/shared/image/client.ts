import { requestJson } from "@/shared/api/client";
import { getPublicRuntimeConfig } from "@/shared/config/public";
import type { ImageUploadResponse } from "@/shared/image/types";

function getApiBaseUrl(): string {
  return getPublicRuntimeConfig().apiBaseUrl;
}

function uploadImage(path: string, file: File, code: string, message: string): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  return requestJson<ImageUploadResponse>(
    getApiBaseUrl(),
    path,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    },
    {
      code,
      message,
    },
  );
}

export function uploadLogPhoto(file: File): Promise<ImageUploadResponse> {
  return uploadImage(
    "/api/uploads/log-photos",
    file,
    "LOG_PHOTO_UPLOAD_FAILED",
    "사진을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}

export function uploadProfileImage(file: File): Promise<ImageUploadResponse> {
  return uploadImage(
    "/api/uploads/profile-images",
    file,
    "PROFILE_IMAGE_UPLOAD_FAILED",
    "프로필 이미지를 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}

export function uploadCrewCoverImage(file: File): Promise<ImageUploadResponse> {
  return uploadImage(
    "/api/uploads/crew-cover-images",
    file,
    "CREW_COVER_IMAGE_UPLOAD_FAILED",
    "크루 대표 이미지를 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}
