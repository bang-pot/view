import type {
  MeetingEditorFormValues,
  MeetingProgressStatusDraft,
  MeetingRecruitmentStatusDraft,
} from "./MeetingEditorForm";
import styles from "./MeetingCreatePreviewPanel.module.css";

type MeetingCreatePreviewPanelProps = {
  values: MeetingEditorFormValues;
};

const recruitmentLabels: Record<MeetingRecruitmentStatusDraft, string> = {
  recruiting: "진행 중",
  closed: "마감",
};

const meetingLabels: Record<MeetingProgressStatusDraft, string> = {
  scheduled: "예정",
  completed: "완료",
  cancelled: "취소",
};

function getFilled(value: string, fallback: string): string {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : fallback;
}

function buildDateTime(values: MeetingEditorFormValues): string {
  const date = formatDisplayDate(values.date.trim());
  const time = values.time.trim();

  if (date.length > 0 && time.length > 0) {
    return `${date} ${time}`;
  }

  if (date.length > 0) {
    return date;
  }

  if (time.length > 0) {
    return time;
  }

  return "-";
}

function formatDisplayDate(date: string): string {
  return date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, "$1.$2.$3");
}

function buildCapacity(value: string): string {
  const parsed = Number(value);
  const capacity = Number.isFinite(parsed) && parsed > 0 ? parsed : 4;

  return `${capacity}명`;
}

function buildCost(values: MeetingEditorFormValues): string {
  const parsed = Number(values.totalCost);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return "-";
  }

  const formattedCost = `${parsed.toLocaleString("ko-KR")}원`;

  return values.costMode === "PER_PERSON" ? `1인당 ${formattedCost}` : formattedCost;
}

export function MeetingCreatePreviewPanel({ values }: MeetingCreatePreviewPanelProps) {
  const recruitmentStatus = values.recruitmentStatus ?? "recruiting";
  const meetingStatus = values.meetingStatus ?? "scheduled";

  return (
    <aside
      aria-labelledby="meeting-create-preview-title"
      className={styles.preview}
    >
      <h2 id="meeting-create-preview-title">모집 미리보기</h2>
      <div className={styles.badges}>
        <span className={styles.recruitingBadge}>{recruitmentLabels[recruitmentStatus]}</span>
        <span className={styles.meetingBadge}>{meetingLabels[meetingStatus]}</span>
      </div>

      <dl className={styles.metaList}>
        <div>
          <dt>제목</dt>
          <dd>{getFilled(values.title, "-")}</dd>
        </div>
        <div>
          <dt>테마</dt>
          <dd>{getFilled(values.themeName, "-")}</dd>
        </div>
        <div>
          <dt>일시</dt>
          <dd>{buildDateTime(values)}</dd>
        </div>
        <div>
          <dt>정원</dt>
          <dd>{buildCapacity(values.capacity)}</dd>
        </div>
        <div>
          <dt>비용</dt>
          <dd>{buildCost(values)}</dd>
        </div>
      </dl>
    </aside>
  );
}
