"use client";

import Link from "next/link";

import type { MeetingDetail } from "@/shared/meeting/types";
import { getMeetingStatusLabel } from "@/shared/meeting/presentation";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";

import {
  buildParticipantPreviewLabels,
  canWriteMeetingLog,
  formatMeetingCost,
  formatMeetingDate,
  getDetailStatusLabel,
  getParticipationLabel,
  getPerPersonCost,
  isHostEditableMeeting,
  toMeetingDisplay,
} from "./MeetingDetailFormat";
import styles from "./MeetingDetailPageClient.module.css";

export type MeetingOperationAction = "close-recruitment";
type MeetingLogStatus = "EXISTS" | "NOT_WRITTEN" | "DELETED_BLOCKED" | null;

type MeetingDetailContentProps = {
  crewId: string;
  meetingId: string;
  listPath: string;
  editPath: string;
  meeting: MeetingDetail;
  currentUserId: number | null;
  myLogStatus: MeetingLogStatus;
  joinErrorMessage: string | null;
  cancelErrorMessage: string | null;
  operationErrorMessage: string | null;
  isJoining: boolean;
  isCancelingJoin: boolean;
  activeOperation: MeetingOperationAction | null;
  onJoin: () => void;
  onCancelJoin: () => void;
  onCloseRecruitment: () => void;
};

export function MeetingDetailContent({
  crewId,
  meetingId,
  listPath,
  editPath,
  meeting,
  currentUserId,
  myLogStatus,
  joinErrorMessage,
  cancelErrorMessage,
  operationErrorMessage,
  isJoining,
  isCancelingJoin,
  activeOperation,
  onJoin,
  onCancelJoin,
  onCloseRecruitment,
}: MeetingDetailContentProps) {
  const isMeetingHost = currentUserId !== null && meeting.hostUserId === currentUserId;
  const canJoinMeeting = meeting.status === "RECRUITING" && meeting.myParticipationStatus === "NOT_JOINED";
  const canCancelJoin =
    meeting.myParticipationStatus === "JOINED" &&
    !isMeetingHost &&
    meeting.status !== "COMPLETED" &&
    meeting.status !== "CANCELED";
  const canEditMeeting = isHostEditableMeeting(meeting, currentUserId);
  const canCloseRecruitment = isMeetingHost && meeting.status === "RECRUITING";
  const hasExistingLog = myLogStatus === "EXISTS";
  const canWriteNewLog = myLogStatus === "NOT_WRITTEN" && canWriteMeetingLog(meeting, currentUserId);
  const isDeletedLogWriteBlocked = myLogStatus === "DELETED_BLOCKED";
  const perPersonCost = getPerPersonCost(meeting.totalCost, meeting.capacity);
  const participantCountText = `${meeting.participantCount} / ${meeting.capacity}명`;
  const participantPreviewLabels = buildParticipantPreviewLabels(meeting.participantCount, meeting.capacity);

  return (
    <section className={styles.page}>
      <Link className={styles.backLink} href={listPath}>
        <span aria-hidden="true" />
        목록으로
      </Link>

      <header className={styles.header}>
        <h1>{meeting.title}</h1>
        <Chip className={styles.statusChip} size="sm" variant="solid">
          {getDetailStatusLabel(meeting.status)}
        </Chip>
      </header>

      <section aria-label="모임 상세 카드" className={styles.detailCard}>
        <section aria-label="모임 상세 정보" className={styles.summaryColumn}>
          <span className={styles.visuallyHidden}>{meeting.title}</span>
          <div className={styles.posterPlaceholder} aria-hidden="true" />
          <dl className={styles.metaList}>
            <div>
              <dt>테마</dt>
              <dd>{meeting.themeName}</dd>
            </div>
            <div>
              <dt>장소</dt>
              <dd>{meeting.place}</dd>
            </div>
            <div>
              <dt>일시</dt>
              <dd>{formatMeetingDate(meeting.date, meeting.time)}</dd>
            </div>
            <div>
              <dt>인원</dt>
              <dd>{participantCountText}</dd>
            </div>
            <div>
              <dt>비용</dt>
              <dd>{perPersonCost ? `1인당 ${perPersonCost}` : formatMeetingCost(meeting.totalCost)}</dd>
            </div>
          </dl>

          <div className={styles.logActions}>
            {hasExistingLog ? (
              <Link href={`/crews/${crewId}/meetings/${meetingId}/log`}>방탈로그 수정하기</Link>
            ) : null}
            {canWriteNewLog ? (
              <Link href={`/crews/${crewId}/meetings/${meetingId}/log`}>방탈로그 작성하기</Link>
            ) : null}
            {isDeletedLogWriteBlocked ? <p>삭제된 방탈로그가 있어 다시 작성할 수 없어요.</p> : null}
          </div>

          <div className={styles.visuallyHidden}>
            <p>테마명: {meeting.themeName}</p>
            <p>모임 ID: {meeting.meetingId}</p>
            <p>모집 상태: {getMeetingStatusLabel(meeting.status)}</p>
            <p>날짜: {meeting.date}</p>
            <p>시간: {meeting.time}</p>
            <p>장소: {meeting.place}</p>
            <p>정원: {meeting.capacity}명</p>
            <p>총 비용 안내: {formatMeetingCost(meeting.totalCost)}</p>
            {perPersonCost ? <p>1인당 예상 비용: {perPersonCost}</p> : null}
            <p>연락 링크: {toMeetingDisplay(meeting.contactLink)}</p>
            <p>설명: {toMeetingDisplay(meeting.description)}</p>
          </div>
        </section>

        <div className={styles.contentColumn}>
          <section aria-label="모집 설명" className={styles.infoPanel}>
            <h2>모집 설명</h2>
            <p>{toMeetingDisplay(meeting.description)}</p>
          </section>

          <section aria-label="모임 참가 상태" className={styles.participantPanel}>
            <header>
              <div className={styles.participantHeading}>
                <h2>참여자</h2>
                <span>{participantCountText}</span>
              </div>
              {canCloseRecruitment ? (
                <button
                  className={styles.hostActionButton}
                  type="button"
                  onClick={onCloseRecruitment}
                  disabled={activeOperation !== null}
                >
                  {activeOperation === "close-recruitment" ? "처리 중..." : "모집 마감"}
                </button>
              ) : null}
            </header>
            <p className={styles.visuallyHidden}>내 참가 상태: {meeting.myParticipationStatus}</p>
            <p className={styles.visuallyHidden}>{getParticipationLabel(meeting.myParticipationStatus)}</p>
            <ul className={styles.participantList}>
              {participantPreviewLabels.map((label) => (
                <li key={label}>
                  <span aria-hidden="true" />
                  <strong>{label}</strong>
                </li>
              ))}
            </ul>
            {canJoinMeeting ? (
              <Button className={styles.joinButton} disabled={isJoining} onClick={onJoin} type="button">
                {isJoining ? "참여 처리 중..." : "참여하기"}
              </Button>
            ) : null}
            {canCancelJoin ? (
              <Button
                className={styles.joinButton}
                disabled={isCancelingJoin}
                onClick={onCancelJoin}
                type="button"
              >
                {isCancelingJoin ? "참여취소 처리 중..." : "참여취소"}
              </Button>
            ) : null}
            {joinErrorMessage ? <p className={styles.actionError}>{joinErrorMessage}</p> : null}
            {cancelErrorMessage ? <p className={styles.actionError}>{cancelErrorMessage}</p> : null}
            {operationErrorMessage ? <p className={styles.actionError}>{operationErrorMessage}</p> : null}
          </section>
        </div>

        {canEditMeeting ? (
          <Link className={styles.editButton} href={editPath}>
            수정하기
          </Link>
        ) : null}
      </section>
    </section>
  );
}
