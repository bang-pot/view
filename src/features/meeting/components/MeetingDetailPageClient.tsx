"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getMe } from "@/shared/auth/client";
import { getCrewHub } from "@/shared/crew/client";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import {
  cancelMeeting,
  cancelMeetingJoin,
  closeMeetingRecruitment,
  completeMeeting,
  getMeetingDetail,
  joinMeeting,
  recordMeetingResult,
  reopenMeetingRecruitment,
} from "@/shared/meeting/client";
import type {
  MeetingDetail,
  MeetingParticipationStatus,
  MeetingResult,
} from "@/shared/meeting/types";
import {
  getMeetingStatusDescription,
  getMeetingStatusLabel,
} from "@/shared/meeting/presentation";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { getMyMeetingLog } from "@/shared/log/client";
import type { MeetingLogSummary } from "@/shared/log/types";

type MeetingDetailPageClientProps = {
  crewId: string;
  meetingId: string;
};

type MeetingOperationAction =
  | "close-recruitment"
  | "reopen-recruitment"
  | "cancel-meeting"
  | "complete-meeting";

function buildPublicCrewPath(crewId: string): string {
  return `/crews/public/${crewId}`;
}

function toDisplay(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "미입력";
  }

  return String(value);
}

function getParticipationLabel(status: MeetingParticipationStatus): string {
  if (status === "JOINED") {
    return "참여 중";
  }

  return "지금 바로 참여할 수 있어요.";
}

function getResultLabel(result: MeetingResult): string {
  switch (result) {
    case "SUCCESS":
      return "모임이 성공적으로 진행되었습니다.";
    case "FAILURE":
      return "이번 모임은 아쉽게 마무리되었습니다.";
    case "NOT_RECORDED":
    default:
      return "아직 결과를 기록하지 않았습니다.";
  }
}

function formatCost(totalCost: number | null): string {
  if (totalCost === null) {
    return "미입력";
  }

  return `${totalCost}원`;
}

function getPerPersonCost(totalCost: number | null, capacity: number): string | null {
  if (totalCost === null || capacity <= 0) {
    return null;
  }

  return `${Math.floor(totalCost / capacity)}원`;
}

function isEditableMeetingStatus(status: MeetingDetail["status"]): boolean {
  return status === "RECRUITING" || status === "RECRUITMENT_CLOSED";
}

function canWriteMeetingLog(
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

export function MeetingDetailPageClient({
  crewId,
  meetingId,
}: MeetingDetailPageClientProps) {
  const router = useRouter();
  const [crewName, setCrewName] = useState<string | null>(null);
  const [crewRole, setCrewRole] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [myLogSummary, setMyLogSummary] = useState<MeetingLogSummary | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null);
  const [cancelErrorMessage, setCancelErrorMessage] = useState<string | null>(null);
  const [operationErrorMessage, setOperationErrorMessage] = useState<string | null>(null);
  const [resultErrorMessage, setResultErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isCancelingJoin, setIsCancelingJoin] = useState(false);
  const [isRecordingResult, setIsRecordingResult] = useState(false);
  const [activeOperation, setActiveOperation] = useState<MeetingOperationAction | null>(null);

  const crewIdNumber = Number(crewId);
  const meetingIdNumber = Number(meetingId);
  const hasValidIds = Number.isFinite(crewIdNumber) && Number.isFinite(meetingIdNumber);
  const routePath = useMemo(
    () => `/crews/${crewId}/meetings/${meetingId}`,
    [crewId, meetingId],
  );
  const listPath = useMemo(() => `/crews/${crewId}/meetings`, [crewId]);
  const editPath = useMemo(() => `/crews/${crewId}/meetings/${meetingId}/edit`, [crewId, meetingId]);
  const publicCrewPath = useMemo(() => buildPublicCrewPath(crewId), [crewId]);

  useEffect(() => {
    if (!hasValidIds) {
      return;
    }

    let isMounted = true;

    async function bootstrap() {
      try {
        const [me, crew, detail] = await Promise.all([
          getMe(),
          getCrewHub(crewIdNumber),
          getMeetingDetail(crewIdNumber, meetingIdNumber),
        ]);

        if (!isMounted) {
          return;
        }

        let nextLogSummary: MeetingLogSummary | null = null;

        if (detail.status === "COMPLETED") {
          try {
            nextLogSummary = await getMyMeetingLog(meetingIdNumber);
          } catch (error) {
            reportOperationalError("meeting.detail_log_lookup_failed", error, {
              level: "warn",
              route: routePath,
            });
          }
        }

        if (!isMounted) {
          return;
        }

        setCurrentUserId(me.user?.id ?? null);
        setCrewName(crew.name);
        setCrewRole(crew.myRole ?? null);
        setMeeting(detail);
        setMyLogSummary(nextLogSummary);
        setErrorMessage(null);
        setIsLoading(false);
      } catch (error) {
        const shouldRedirect =
          isOperationalError(error) &&
          (error.code === "AUTH_ACCESS_DENIED" || error.code === "AUTH_UNAUTHENTICATED");

        reportOperationalError("meeting.detail_load_failed", error, {
          level: shouldRedirect ? "warn" : "error",
          route: routePath,
        });

        if (!isMounted) {
          return;
        }

        if (shouldRedirect) {
          router.replace(publicCrewPath);
          return;
        }

        setErrorMessage(
          getUserMessage(
            error,
            "모임 상세를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
          ),
        );
        setIsLoading(false);
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [crewIdNumber, hasValidIds, meetingIdNumber, publicCrewPath, routePath, router]);

  async function refreshMeetingDetail(): Promise<void> {
    const nextDetail = await getMeetingDetail(crewIdNumber, meetingIdNumber);
    setMeeting(nextDetail);
  }

  async function handleJoin(): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsJoining(true);
    setJoinErrorMessage(null);
    setCancelErrorMessage(null);
    setOperationErrorMessage(null);
    setResultErrorMessage(null);

    try {
      const response = await joinMeeting(crewIdNumber, meetingIdNumber);

      setMeeting({
        ...meeting,
        myParticipationStatus: response.myParticipationStatus,
      });
    } catch (error) {
      reportOperationalError("meeting.join_failed", error, {
        level: "warn",
        route: routePath,
      });

      if (isOperationalError(error) && error.code === "MEETING_PARTICIPATION_ALREADY_JOINED") {
        setMeeting({
          ...meeting,
          myParticipationStatus: "JOINED",
        });
        return;
      }

      setJoinErrorMessage(
        getUserMessage(error, "즉시 참여를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCancelJoin(): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsCancelingJoin(true);
    setCancelErrorMessage(null);
    setJoinErrorMessage(null);
    setOperationErrorMessage(null);
    setResultErrorMessage(null);

    try {
      const response = await cancelMeetingJoin(crewIdNumber, meetingIdNumber);

      setMeeting({
        ...meeting,
        myParticipationStatus: response.myParticipationStatus,
      });
    } catch (error) {
      reportOperationalError("meeting.cancel_join_failed", error, {
        level: "warn",
        route: routePath,
      });

      setCancelErrorMessage(
        getUserMessage(error, "참여취소를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsCancelingJoin(false);
    }
  }

  async function handleMeetingOperation(action: MeetingOperationAction): Promise<void> {
    if (!meeting) {
      return;
    }

    setActiveOperation(action);
    setOperationErrorMessage(null);
    setJoinErrorMessage(null);
    setCancelErrorMessage(null);
    setResultErrorMessage(null);

    try {
      const response =
        action === "close-recruitment"
          ? await closeMeetingRecruitment(crewIdNumber, meetingIdNumber)
          : action === "reopen-recruitment"
            ? await reopenMeetingRecruitment(crewIdNumber, meetingIdNumber)
            : action === "cancel-meeting"
              ? await cancelMeeting(crewIdNumber, meetingIdNumber)
              : await completeMeeting(crewIdNumber, meetingIdNumber);

      setMeeting({
        ...meeting,
        status: response.status,
      });
    } catch (error) {
      reportOperationalError("meeting.operation_failed", error, {
        level: "warn",
        route: routePath,
      });

      setOperationErrorMessage(
        getUserMessage(error, "모임 운영 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setActiveOperation(null);
    }
  }

  async function handleRecordResult(
    nextResult: Exclude<MeetingResult, "NOT_RECORDED">,
  ): Promise<void> {
    if (!meeting) {
      return;
    }

    setIsRecordingResult(true);
    setResultErrorMessage(null);
    setJoinErrorMessage(null);
    setCancelErrorMessage(null);
    setOperationErrorMessage(null);

    try {
      const response = await recordMeetingResult(crewIdNumber, meetingIdNumber, nextResult);

      setMeeting({
        ...meeting,
        result: response.result,
      });
    } catch (error) {
      reportOperationalError("meeting.result_record_failed", error, {
        level: "warn",
        route: routePath,
      });

      if (
        isOperationalError(error) &&
        (error.code === "MEETING_RESULT_ALREADY_RECORDED" ||
          error.code === "MEETING_RESULT_RECORD_NOT_ALLOWED")
      ) {
        try {
          await refreshMeetingDetail();
        } catch {
          // Keep the original user-facing error below if refresh also fails.
        }
      }

      setResultErrorMessage(
        getUserMessage(error, "모임 결과를 기록하지 못했습니다. 잠시 후 다시 시도해 주세요."),
      );
    } finally {
      setIsRecordingResult(false);
    }
  }

  if (!hasValidIds) {
    return (
      <main>
        <h1>모임 상세</h1>
        <p>올바르지 않은 모임 경로입니다.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main>
        <p>모임 상세를 불러오고 있습니다.</p>
      </main>
    );
  }

  if (!meeting) {
    return (
      <main>
        <h1>모임 상세</h1>
        <p>{errorMessage ?? "모임 상세를 불러오지 못했습니다."}</p>
        <Link href={listPath}>모임 목록으로 돌아가기</Link>
      </main>
    );
  }

  const isMeetingHost = currentUserId !== null && meeting.hostUserId === currentUserId;
  const isCrewLeader = crewRole === "LEADER";
  const canJoinMeeting =
    meeting.status === "RECRUITING" && meeting.myParticipationStatus === "NOT_JOINED";
  const canCancelJoin =
    meeting.myParticipationStatus === "JOINED" &&
    !isMeetingHost &&
    meeting.status !== "COMPLETED" &&
    meeting.status !== "CANCELED";
  const canEditMeeting = isMeetingHost && isEditableMeetingStatus(meeting.status);
  const canCloseRecruitment = isMeetingHost && meeting.status === "RECRUITING";
  const canReopenRecruitment = isMeetingHost && meeting.status === "RECRUITMENT_CLOSED";
  const canCompleteMeeting = isMeetingHost && meeting.status === "RECRUITMENT_CLOSED";
  const canCancelMeeting =
    (isMeetingHost || isCrewLeader) &&
    (meeting.status === "RECRUITING" || meeting.status === "RECRUITMENT_CLOSED");
  const canRecordResult =
    isMeetingHost &&
    meeting.status === "COMPLETED" &&
    meeting.result === "NOT_RECORDED";
  const canOpenLogEntry = canWriteMeetingLog(meeting, currentUserId) || myLogSummary !== null;
  const perPersonCost = getPerPersonCost(meeting.totalCost, meeting.capacity);

  return (
    <main>
      <h1>모임 상세</h1>
      {crewName ? <p>{crewName} 크루의 모임 상세입니다.</p> : null}
      <Link href={listPath}>모임 목록으로 돌아가기</Link>

      <section aria-label="모임 참가 상태">
        <h2>내 참가 상태</h2>
        <p>내 참가 상태: {meeting.myParticipationStatus}</p>
        {canJoinMeeting ? (
          <button type="button" onClick={handleJoin} disabled={isJoining}>
            {isJoining ? "참여 처리 중..." : "참여하기"}
          </button>
        ) : null}
        {canCancelJoin ? (
          <button type="button" onClick={handleCancelJoin} disabled={isCancelingJoin}>
            {isCancelingJoin ? "참여취소 처리 중..." : "참여취소"}
          </button>
        ) : null}
        <p>{getParticipationLabel(meeting.myParticipationStatus)}</p>
        {joinErrorMessage ? <p>{joinErrorMessage}</p> : null}
        {cancelErrorMessage ? <p>{cancelErrorMessage}</p> : null}
      </section>

      <section aria-label="모임 운영">
        <h2>모임 운영</h2>
        <p>모집 상태: {getMeetingStatusLabel(meeting.status)}</p>
        <p>{getMeetingStatusDescription(meeting.status)}</p>
        {canEditMeeting ? <Link href={editPath}>모임 수정</Link> : null}
        {canCloseRecruitment ? (
          <button
            type="button"
            onClick={() => void handleMeetingOperation("close-recruitment")}
            disabled={activeOperation !== null}
          >
            {activeOperation === "close-recruitment" ? "처리 중..." : "모집마감"}
          </button>
        ) : null}
        {canReopenRecruitment ? (
          <button
            type="button"
            onClick={() => void handleMeetingOperation("reopen-recruitment")}
            disabled={activeOperation !== null}
          >
            {activeOperation === "reopen-recruitment" ? "처리 중..." : "수동 오픈"}
          </button>
        ) : null}
        {canCancelMeeting ? (
          <button
            type="button"
            onClick={() => void handleMeetingOperation("cancel-meeting")}
            disabled={activeOperation !== null}
          >
            {activeOperation === "cancel-meeting" ? "처리 중..." : "모임 취소"}
          </button>
        ) : null}
        {canCompleteMeeting ? (
          <button
            type="button"
            onClick={() => void handleMeetingOperation("complete-meeting")}
            disabled={activeOperation !== null}
          >
            {activeOperation === "complete-meeting" ? "처리 중..." : "모임 종료"}
          </button>
        ) : null}
        {operationErrorMessage ? <p>{operationErrorMessage}</p> : null}
      </section>

      <section aria-label="모임 결과">
        <h2>모임 결과</h2>
        <p>결과 상태: {meeting.result}</p>
        <p>{getResultLabel(meeting.result)}</p>
        {canRecordResult ? (
          <div>
            <button
              type="button"
              onClick={() => void handleRecordResult("SUCCESS")}
              disabled={isRecordingResult}
            >
              {isRecordingResult ? "기록 중..." : "성공"}
            </button>
            <button
              type="button"
              onClick={() => void handleRecordResult("FAILURE")}
              disabled={isRecordingResult}
            >
              {isRecordingResult ? "기록 중..." : "실패"}
            </button>
          </div>
        ) : null}
        {resultErrorMessage ? <p>{resultErrorMessage}</p> : null}
      </section>

      <section aria-label="모임 상세 정보">
        <h2>{meeting.title}</h2>
        {canOpenLogEntry ? (
          <Link href={`/crews/${crewId}/meetings/${meetingId}/log`}>
            {myLogSummary ? "방탈로그 수정하기" : "방탈로그 작성하기"}
          </Link>
        ) : null}
        <p>테마명: {meeting.themeName}</p>
        <p>모임 ID: {meeting.meetingId}</p>
        <p>모집 상태: {getMeetingStatusLabel(meeting.status)}</p>
        <p>결과 상태: {meeting.result}</p>
        <p>날짜: {meeting.date}</p>
        <p>시간: {meeting.time}</p>
        <p>장소: {meeting.place}</p>
        <p>정원: {meeting.capacity}명</p>
        <p>총 비용 안내: {formatCost(meeting.totalCost)}</p>
        {perPersonCost ? <p>1인당 예상 비용: {perPersonCost}</p> : null}
        <p>연락 링크: {toDisplay(meeting.contactLink)}</p>
        <p>설명: {toDisplay(meeting.description)}</p>
      </section>
    </main>
  );
}
