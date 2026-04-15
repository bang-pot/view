const DELETED_LOG_MEETING_KEY = "bangpot.deleted-log-meetings";

function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function readDeletedMeetingIds(): number[] {
  const storage = getStorage();

  if (!storage) {
    return [];
  }

  const rawValue = storage.getItem(DELETED_LOG_MEETING_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((value): value is number => Number.isFinite(value));
  } catch {
    return [];
  }
}

function writeDeletedMeetingIds(meetingIds: number[]): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  storage.setItem(DELETED_LOG_MEETING_KEY, JSON.stringify(meetingIds));
}

export function markMeetingLogDeleted(meetingId: number): void {
  const currentIds = readDeletedMeetingIds();

  if (currentIds.includes(meetingId)) {
    return;
  }

  writeDeletedMeetingIds([...currentIds, meetingId]);
}

export function hasDeletedMeetingLog(meetingId: number): boolean {
  return readDeletedMeetingIds().includes(meetingId);
}
