"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { resolveProtectedDestination } from "@/shared/auth/guards";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { getMeetingDetail } from "@/shared/meeting/client";
import type { MeetingDetail } from "@/shared/meeting/types";
import { reportOperationalError } from "@/shared/monitoring/operations";
import {
  createMeetingLog,
  getMyMeetingLog,
  uploadLogPhoto,
  updateMeetingLog,
} from "@/shared/log/client";
import type { LogPhotoInput, MeetingLogMeResponse } from "@/shared/log/types";

type MeetingLogEditorPageClientProps = {
  crewId: string;
  meetingId: string;
};

type ExistingPhotoField = {
  kind: "existing";
  id: string;
  fileName: string;
  uploadStatus: "uploaded";
  url: string;
  sizeBytes: null;
  errorMessage: null;
};

type UploadedPhotoField = {
  kind: "uploaded";
  id: string;
  fileName: string;
  uploadStatus: "idle" | "uploading" | "uploaded" | "failed";
  uploadId: number | null;
  url: string | null;
  sizeBytes: number | null;
  errorMessage: string | null;
};

type PhotoField = ExistingPhotoField | UploadedPhotoField;

const BODY_MAX_LENGTH = 1000;
const MAX_PHOTO_COUNT = 5;
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024;
const INVALID_PHOTO_TYPE_MESSAGE = "사진은 jpg, jpeg, png 형식만 첨부할 수 있어요.";
const INVALID_PHOTO_SIZE_MESSAGE = "사진은 한 장당 5MB 이하만 첨부할 수 있어요.";
const PHOTO_UPLOAD_FAILED_MESSAGE =
  "사진을 업로드하지 못했어요. 잠시 후 다시 시도해 주세요.";

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function buildPhotoFields(photos: string[]): PhotoField[] {
  if (photos.length === 0) {
    return [];
  }

  return photos.map((photo, index) => ({
    kind: "existing",
    id: `photo-${index + 1}`,
    fileName: photo.split("/").pop() ?? `photo-${index + 1}`,
    uploadStatus: "uploaded",
    url: photo,
    sizeBytes: null,
    errorMessage: null,
  }));
}

function isCreateAllowed(
  meeting: MeetingDetail,
  currentUserId: number | null,
): boolean {
  if (meeting.status !== "COMPLETED") {
    return false;
  }

  if (currentUserId !== null && meeting.hostUserId === currentUserId) {
    return true;
  }

  return (
    meeting.myParticipationStatus === "JOINED" ||
    meeting.myParticipationStatus === "PENDING" ||
    meeting.myParticipationStatus === "APPROVED"
  );
}

function validatePhotos(photoFields: PhotoField[]): {
  errorMessage: string | null;
  photos: LogPhotoInput[];
} {
  if (photoFields.length > MAX_PHOTO_COUNT) {
    return {
      errorMessage: "사진은 최대 5장까지 첨부할 수 있어요.",
      photos: [],
    };
  }

  const photos: LogPhotoInput[] = [];

  for (const photoField of photoFields) {
    if (photoField.kind === "existing") {
      continue;
    }

    if (photoField.uploadStatus === "uploading") {
      return {
        errorMessage: "사진 업로드가 끝난 뒤 저장해 주세요.",
        photos: [],
      };
    }

    if (photoField.uploadStatus === "failed" || photoField.uploadStatus === "idle") {
      return {
        errorMessage: "업로드가 완료된 사진만 저장할 수 있어요.",
        photos: [],
      };
    }

    if (!photoField.uploadId || !photoField.url || !photoField.sizeBytes) {
      return {
        errorMessage: "업로드가 완료된 사진 정보가 올바르지 않아요.",
        photos: [],
      };
    }

    photos.push({
      uploadId: photoField.uploadId,
    });
  }

  return {
    errorMessage: null,
    photos,
  };
}

function formatDateLabel(value: string): string {
  return value;
}

function isSupportedPhotoFile(file: File): boolean {
  return /\.(jpg|jpeg|png)$/i.test(file.name);
}

function formatPhotoSize(sizeBytes: number | null): string {
  if (!sizeBytes) {
    return "용량 정보 없음";
  }

  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  return `${Math.ceil(sizeBytes / 1024)}KB`;
}

function getSubmittedPhotoUrls(photoFields: PhotoField[]): string[] {
  return photoFields.flatMap((photoField) => {
    if (photoField.kind === "existing") {
      return [];
    }

    if (photoField.uploadStatus !== "uploaded" || !photoField.url) {
      return [];
    }

    return [photoField.url];
  });
}

export function MeetingLogEditorPageClient({
  crewId,
  meetingId,
}: MeetingLogEditorPageClientProps) {
  const router = useRouter();
  const { replace, push } = router;
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [myMeetingLog, setMyMeetingLog] = useState<MeetingLogMeResponse | null>(null);
  const [body, setBody] = useState("");
  const [photoFields, setPhotoFields] = useState<PhotoField[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoErrorMessage, setPhotoErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const crewIdNumber = Number(crewId);
  const meetingIdNumber = Number(meetingId);
  const hasValidIds = Number.isFinite(crewIdNumber) && Number.isFinite(meetingIdNumber);
  const routePath = useMemo(
    () => `/crews/${crewId}/meetings/${meetingId}/log`,
    [crewId, meetingId],
  );
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);
  const meetingPath = useMemo(() => `/crews/${crewId}/meetings/${meetingId}`, [crewId, meetingId]);

  const isEditMode = myMeetingLog?.status === "EXISTS";
  const canCreate = meeting ? isCreateAllowed(meeting, currentUserId) : false;
  const isRecreateBlocked = myMeetingLog?.status === "DELETED_BLOCKED";
  const canStartCreateMode = myMeetingLog?.status === "NOT_WRITTEN" && canCreate;

  useEffect(() => {
    if (!hasValidIds) {
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const me = await getMe();

        if (!isMounted) {
          return;
        }

        const protectedDestination = resolveProtectedDestination(me, routePath);

        if (protectedDestination) {
          replace(protectedDestination);
          return;
        }

        const detail = await getMeetingDetail(crewIdNumber, meetingIdNumber);

        if (!isMounted) {
          return;
        }

        setCurrentUserId(me.user?.id ?? null);
        setMeeting(detail);

        const nextMyMeetingLog = await getMyMeetingLog(meetingIdNumber);

        if (!isMounted) {
          return;
        }

        setMyMeetingLog(nextMyMeetingLog);

        if (nextMyMeetingLog.status === "EXISTS") {
          setBody(nextMyMeetingLog.body);
          setPhotoFields(buildPhotoFields(nextMyMeetingLog.photos));
        } else {
          setBody("");
          setPhotoFields([]);
        }

        setErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("log.editor.bootstrap_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: routePath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(error, "방탈로그 화면을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidIds, meetingIdNumber, publicCrewPath, replace, routePath]);

  function handleAddPhoto() {
    setPhotoFields((currentFields) => {
      if (currentFields.length >= MAX_PHOTO_COUNT) {
        return currentFields;
      }

      return [
        ...currentFields,
        {
          kind: "uploaded",
          id: `photo-${Date.now()}-${currentFields.length + 1}`,
          fileName: "",
          uploadStatus: "idle",
          uploadId: null,
          url: null,
          sizeBytes: null,
          errorMessage: null,
        },
      ];
    });
    setPhotoErrorMessage(null);
  }

  async function handlePhotoSelect(id: string, file: File | null) {
    if (!file) {
      return;
    }

    if (!isSupportedPhotoFile(file)) {
      setPhotoFields((currentFields) =>
        currentFields.map((photoField) =>
          photoField.kind === "uploaded" && photoField.id === id
            ? {
                ...photoField,
                fileName: file.name,
                uploadStatus: "failed",
                uploadId: null,
                url: null,
                sizeBytes: null,
                errorMessage: INVALID_PHOTO_TYPE_MESSAGE,
              }
            : photoField,
        ),
      );
      setPhotoErrorMessage(null);
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setPhotoFields((currentFields) =>
        currentFields.map((photoField) =>
          photoField.kind === "uploaded" && photoField.id === id
            ? {
                ...photoField,
                fileName: file.name,
                uploadStatus: "failed",
                uploadId: null,
                url: null,
                sizeBytes: null,
                errorMessage: INVALID_PHOTO_SIZE_MESSAGE,
              }
            : photoField,
        ),
      );
      setPhotoErrorMessage(null);
      return;
    }

    setPhotoFields((currentFields) =>
      currentFields.map((photoField) =>
        photoField.kind === "uploaded" && photoField.id === id
          ? {
              ...photoField,
              fileName: file.name,
              uploadStatus: "uploading",
              uploadId: null,
              url: null,
              sizeBytes: null,
              errorMessage: null,
            }
          : photoField,
      ),
    );
    setPhotoErrorMessage(null);

    try {
      const uploadedPhoto = await uploadLogPhoto(file);

      setPhotoFields((currentFields) =>
        currentFields.map((photoField) =>
          photoField.kind === "uploaded" && photoField.id === id
            ? {
                ...photoField,
                fileName: file.name,
                uploadStatus: "uploaded",
                uploadId: uploadedPhoto.uploadId,
                url: uploadedPhoto.url,
                sizeBytes: uploadedPhoto.sizeBytes,
                errorMessage: null,
              }
            : photoField,
        ),
      );
    } catch (error) {
      reportOperationalError("log.editor.upload_failed", error, {
        level: "warn",
        route: routePath,
      });
      setPhotoFields((currentFields) =>
        currentFields.map((photoField) =>
          photoField.kind === "uploaded" && photoField.id === id
            ? {
                ...photoField,
                fileName: file.name,
                uploadStatus: "failed",
                uploadId: null,
                url: null,
                sizeBytes: null,
                errorMessage: PHOTO_UPLOAD_FAILED_MESSAGE,
              }
            : photoField,
        ),
      );
      setPhotoErrorMessage(null);
    }
  }

  function handleRemovePhoto(id: string) {
    setPhotoFields((currentFields) => currentFields.filter((photoField) => photoField.id !== id));
    setPhotoErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setPhotoErrorMessage(null);
    setNoticeMessage(null);

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setErrorMessage("후기 본문을 입력해 주세요.");
      return;
    }

    if (trimmedBody.length > BODY_MAX_LENGTH) {
      setErrorMessage("후기 본문은 1000자 이하로 입력해 주세요.");
      return;
    }

    const validation = validatePhotos(photoFields);

    if (validation.errorMessage) {
      setPhotoErrorMessage(validation.errorMessage);
      return;
    }

    if (!meeting) {
      setErrorMessage("모임 정보를 다시 불러와 주세요.");
      return;
    }

    const currentMeeting = meeting;

    setIsSubmitting(true);

    try {
      const submittedPhotoUrls = getSubmittedPhotoUrls(photoFields);
      const response =
        isEditMode && myMeetingLog?.status === "EXISTS"
          ? await updateMeetingLog(myMeetingLog.logId, {
            body: trimmedBody,
            photos: validation.photos,
          })
          : await createMeetingLog(meetingIdNumber, {
              body: trimmedBody,
              photos: validation.photos,
            });

      setMyMeetingLog((currentLog) =>
        currentLog && currentLog.status === "EXISTS"
          ? {
              ...currentLog,
              logId: response.logId,
              meetingId: response.meetingId,
              body: trimmedBody,
              photos: submittedPhotoUrls,
            }
          : {
              status: "EXISTS",
              logId: response.logId,
              meetingId: response.meetingId,
              meetingTitle: currentMeeting.title,
              themeName: currentMeeting.themeName,
              place: currentMeeting.place,
              date: currentMeeting.date,
              authorNickname: null,
              createdAt: null,
              updatedAt: null,
              body: trimmedBody,
              photos: submittedPhotoUrls,
            },
      );
      push(`/crews/${crewId}/logs/${response.logId}`);
    } catch (error) {
      reportOperationalError("log.editor.submit_failed", error, {
        level: "warn",
        route: routePath,
      });
      setErrorMessage(
        getUserMessage(error, "방탈로그를 저장하지 못했어요. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!hasValidIds) {
    return (
      <main>
        <h1>방탈로그 작성하기</h1>
        <p>올바르지 않은 방탈로그 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>방탈로그 화면을 준비하고 있습니다.</p>
      </main>
    );
  }

  if (!meeting) {
    return (
      <main>
        <h1>방탈로그 작성하기</h1>
        <p>{errorMessage ?? "방탈로그 화면을 불러오지 못했어요."}</p>
      </main>
    );
  }

  if (!isEditMode && (isRecreateBlocked || !canStartCreateMode)) {
    return (
      <main>
        <h1>방탈로그 작성하기</h1>
        <p>
          {isRecreateBlocked
            ? "이 모임은 삭제된 방탈로그가 있어 다시 작성할 수 없어요."
            : "이 모임은 지금 방탈로그를 작성할 수 없어요."}
        </p>
        <Link href={meetingPath}>모임 상세로 돌아가기</Link>
      </main>
    );
  }

  return (
    <main>
      <h1>{isEditMode ? "방탈로그 수정하기" : "방탈로그 작성하기"}</h1>
      <p>{meeting.title}</p>
      <p>
        {meeting.themeName} · {meeting.place} · {formatDateLabel(meeting.date)}
      </p>
      <Link href={meetingPath}>모임 상세로 돌아가기</Link>

      {noticeMessage ? <p>{noticeMessage}</p> : null}
      {errorMessage ? <p>{errorMessage}</p> : null}

      <form onSubmit={(event) => void handleSubmit(event)}>
        <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
          <label htmlFor="log-body">후기 본문</label>
          <textarea
            id="log-body"
            value={body}
            maxLength={BODY_MAX_LENGTH}
            onChange={(event) => setBody(event.target.value)}
            rows={8}
          />
          <p>{body.length}/{BODY_MAX_LENGTH}</p>
        </div>

        <section aria-label="사진 입력" style={{ display: "grid", gap: 12, marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <strong>사진</strong>
            <button
              type="button"
              onClick={handleAddPhoto}
              disabled={photoFields.length >= MAX_PHOTO_COUNT}
            >
              사진 추가
            </button>
          </div>
          <p>최대 5장, jpg/jpeg/png, 한 장당 5MB 이하 파일만 업로드할 수 있어요.</p>
          {photoFields.map((photoField, index) => (
            <div
              key={photoField.id}
              style={{
                display: "grid",
                gap: 8,
                border: "1px solid #d9d9d9",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <p>
                {photoField.fileName
                  ? `${photoField.fileName} · ${formatPhotoSize(photoField.sizeBytes)}`
                  : "아직 선택한 사진이 없어요."}
              </p>
              {photoField.kind === "existing" ? (
                <p>기존 사진</p>
              ) : (
                <>
                  <label htmlFor={`log-photo-file-${photoField.id}`}>{`사진 파일 ${index + 1}`}</label>
                  <input
                    id={`log-photo-file-${photoField.id}`}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={(event) =>
                      void handlePhotoSelect(photoField.id, event.currentTarget.files?.[0] ?? null)
                    }
                  />
                  <p>
                    {photoField.uploadStatus === "uploading"
                      ? "업로드 중..."
                      : photoField.uploadStatus === "uploaded"
                        ? "업로드 완료"
                        : photoField.uploadStatus === "failed"
                          ? "업로드 실패"
                          : "업로드 대기 중"}
                  </p>
                </>
              )}
              {photoField.errorMessage ? <p>{photoField.errorMessage}</p> : null}
              <button type="button" onClick={() => handleRemovePhoto(photoField.id)}>
                {`사진 제거 ${index + 1}`}
              </button>
            </div>
          ))}
          {photoErrorMessage ? <p>{photoErrorMessage}</p> : null}
        </section>

        <div style={{ display: "flex", gap: 8, marginTop: 24, flexWrap: "wrap" }}>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "저장 중..."
              : isEditMode
                ? "방탈로그 수정"
                : "방탈로그 저장"}
          </button>
        </div>
      </form>
    </main>
  );
}
