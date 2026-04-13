import type { MeetingStatus } from "@/shared/meeting/types";

export function getMeetingStatusLabel(status: MeetingStatus): string {
  switch (status) {
    case "RECRUITING":
      return "모집 중";
    case "RECRUITMENT_CLOSED":
      return "모집 마감";
    case "COMPLETED":
      return "모임 종료";
    case "CANCELED":
      return "모임 취소";
    default:
      return status;
  }
}

export function getMeetingStatusDescription(status: MeetingStatus): string {
  switch (status) {
    case "RECRUITING":
      return "참여를 받고 있는 모임 상태예요.";
    case "RECRUITMENT_CLOSED":
      return "정원 도달 또는 시작 시간이 지나 자동으로 모집이 마감될 수 있어요.";
    case "COMPLETED":
      return "시작 후 시간이 지나 자동으로 종료된 모임을 포함해요.";
    case "CANCELED":
      return "취소되어 더 이상 진행되지 않는 모임이에요.";
    default:
      return "";
  }
}
