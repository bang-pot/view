import type { MeetingDetail, MeetingParticipationStatus } from "@/shared/meeting/types";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
const PARTICIPANT_PREVIEW_LABELS = [
  "방장",
  "방탈오빠",
  "크루원의실수",
  "이탈출",
  "힌트장인",
  "퍼즐메이트",
] as const;

export function toMeetingDisplay(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "미입력";
  }

  return String(value);
}

export function getParticipationLabel(status: MeetingParticipationStatus): string {
  if (status === "JOINED") {
    return "참여 중";
  }

  return "지금 바로 참여할 수 있어요.";
}

export function formatMeetingCost(totalCost: number | null): string {
  if (totalCost === null) {
    return "미입력";
  }

  return `${totalCost.toLocaleString("ko-KR")}원`;
}

export function getPerPersonCost(totalCost: number | null, capacity: number): string | null {
  if (totalCost === null || capacity <= 0) {
    return null;
  }

  return `${Math.floor(totalCost / capacity).toLocaleString("ko-KR")}원`;
}

export function buildParticipantPreviewLabels(participantCount: number, capacity: number): string[] {
  const visibleCount = Math.max(1, Math.min(participantCount, capacity));

  return Array.from({ length: visibleCount }, (_, index) => {
    return PARTICIPANT_PREVIEW_LABELS[index] ?? `참여자 ${index}`;
  });
}

export function formatMeetingDate(date: string, time: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return `${date} ${time}`;
  }

  const [, year, month, day] = match;
  const weekdayIndex = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();

  return `${year}. ${month}. ${day} (${WEEKDAY_LABELS[weekdayIndex]}) ${time}`;
}

export function getDetailStatusLabel(status: MeetingDetail["status"]): string {
  switch (status) {
    case "RECRUITING":
      return "진행 중";
    case "RECRUITMENT_CLOSED":
      return "마감";
    case "COMPLETED":
      return "완료";
    case "CANCELED":
      return "취소";
    default:
      return status;
  }
}

export function isEditableMeetingStatus(status: MeetingDetail["status"]): boolean {
  return status === "RECRUITING" || status === "RECRUITMENT_CLOSED";
}

export function canWriteMeetingLog(meeting: MeetingDetail, currentUserId: number | null): boolean {
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

export function isHostEditableMeeting(meeting: MeetingDetail, currentUserId: number | null): boolean {
  return currentUserId !== null && meeting.hostUserId === currentUserId && isEditableMeetingStatus(meeting.status);
}
