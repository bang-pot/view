"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import {
  approveCrewJoinRequest,
  deleteCrew,
  getCrewDeletionAvailability,
  getCrewJoinRequests,
  getCrewMembers,
  getCrewPolicies,
  rejectCrewJoinRequest,
  removeCrewMember,
  transferCrewLeadership,
} from "@/shared/crew/client";
import type { CrewHubResponse, CrewJoinRequestRecord, CrewMember, CrewPolicy } from "@/shared/crew/types";
import { getUserMessage, isOperationalError } from "@/shared/errors/operational";
import { reportOperationalError } from "@/shared/monitoring/operations";
import { Button } from "@/shared/ui/Button";
import { SwitchBox } from "@/shared/ui/SwitchBox";
import { Textarea } from "@/shared/ui/Textarea";
import { TextField } from "@/shared/ui/TextField";

import styles from "./CrewManagementSettingsModal.module.css";

type CrewManagementSettingsModalProps = {
  readonly crew: CrewHubResponse;
  readonly onClose: () => void;
};

type ManagementSectionKey =
  | "basic"
  | "notice"
  | "policy"
  | "joinRequests"
  | "members"
  | "delete";

type ManagementSection = {
  readonly key: ManagementSectionKey;
  readonly label: string;
  readonly tone?: "danger";
};

type DeletionAvailability = {
  readonly canDelete: boolean;
  readonly hasOnlyLeader: boolean;
  readonly hasNoUnfinishedMeetings: boolean;
};

type NoticeManagementItem = {
  readonly id: number;
  readonly body: string;
  readonly date: string;
};

type NoticeFormMode =
  | {
      readonly kind: "create";
    }
  | {
      readonly kind: "edit";
      readonly noticeId: number;
    };

type PolicyFormMode =
  | {
      readonly kind: "create";
    }
  | {
      readonly kind: "edit";
      readonly policyId: number;
    };

const MANAGEMENT_SECTIONS: readonly ManagementSection[] = [
  { key: "basic", label: "기본 정보" },
  { key: "notice", label: "공지 사항 관리" },
  { key: "policy", label: "크루 정책 관리" },
  { key: "joinRequests", label: "가입 신청 관리" },
  { key: "members", label: "멤버 관리" },
  { key: "delete", label: "크루 삭제", tone: "danger" },
] as const;

function createNextNoticeId(notices: readonly NoticeManagementItem[]): number {
  return notices.reduce((maxId, notice) => Math.max(maxId, notice.id), 0) + 1;
}

function createNextPolicyId(policies: readonly CrewPolicy[]): number {
  return policies.reduce((maxId, policy) => Math.max(maxId, policy.policyId), 0) + 1;
}

function formatNoticeDate(date: Date): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}.${month}.${day}`;
}

function buildFallbackDescription(description: string | null): string {
  return description ?? "";
}

function getDeleteErrorMessage(error: unknown): string {
  if (isOperationalError(error)) {
    if (error.code === "CREW_DELETE_NOT_ALLOWED_WITH_ACTIVE_MEMBERS") {
      return "다른 크루원이 남아 있어 삭제할 수 없어요";
    }

    if (error.code === "CREW_DELETE_NOT_ALLOWED_WITH_ACTIVE_MEETINGS") {
      return "진행 중이거나 모집 중인 모임이 남아 있어 삭제할 수 없어요";
    }

    if (error.code === "CREW_DELETE_NAME_MISMATCH") {
      return "크루명이 일치하지 않아요";
    }

    if (error.code === "AUTH_ACCESS_DENIED") {
      return "현재 크루장만 삭제할 수 있어요.";
    }
  }

  return getUserMessage(error, "크루를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.");
}

function ConditionStatusIcon({ satisfied }: { readonly satisfied: boolean }) {
  return (
    <span className={satisfied ? styles.conditionCheckIcon : styles.conditionBlockIcon} aria-hidden="true">
      {satisfied ? "✓" : "×"}
    </span>
  );
}

export function CrewManagementSettingsModal({ crew, onClose }: CrewManagementSettingsModalProps) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<ManagementSectionKey>("basic");
  const [crewName, setCrewName] = useState(crew.name);
  const [description, setDescription] = useState(buildFallbackDescription(crew.description));
  const [isPublic, setIsPublic] = useState(crew.visibility === "PUBLIC");
  const [deletionAvailability, setDeletionAvailability] = useState<DeletionAvailability | null>(null);
  const [isDeletionAvailabilityLoading, setIsDeletionAvailabilityLoading] = useState(false);
  const [deletionAvailabilityErrorMessage, setDeletionAvailabilityErrorMessage] = useState<string | null>(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [noticeItems, setNoticeItems] = useState<readonly NoticeManagementItem[]>([]);
  const [noticeDraft, setNoticeDraft] = useState("");
  const [noticeEditorErrorMessage, setNoticeEditorErrorMessage] = useState<string | null>(null);
  const [noticeFormMode, setNoticeFormMode] = useState<NoticeFormMode | null>(null);
  const [noticeDeleteTargetId, setNoticeDeleteTargetId] = useState<number | null>(null);
  const [policyItems, setPolicyItems] = useState<readonly CrewPolicy[]>([]);
  const [isPolicyLoading, setIsPolicyLoading] = useState(false);
  const [policyErrorMessage, setPolicyErrorMessage] = useState<string | null>(null);
  const [hasLoadedPolicies, setHasLoadedPolicies] = useState(false);
  const [policyTitleDraft, setPolicyTitleDraft] = useState("");
  const [policyBodyDraft, setPolicyBodyDraft] = useState("");
  const [policyEditorErrorMessage, setPolicyEditorErrorMessage] = useState<string | null>(null);
  const [policyFormMode, setPolicyFormMode] = useState<PolicyFormMode | null>(null);
  const [policyDeleteTargetId, setPolicyDeleteTargetId] = useState<number | null>(null);
  const [joinRequestItems, setJoinRequestItems] = useState<readonly CrewJoinRequestRecord[]>([]);
  const [isJoinRequestLoading, setIsJoinRequestLoading] = useState(false);
  const [joinRequestErrorMessage, setJoinRequestErrorMessage] = useState<string | null>(null);
  const [hasLoadedJoinRequests, setHasLoadedJoinRequests] = useState(false);
  const [processingJoinRequestId, setProcessingJoinRequestId] = useState<number | null>(null);
  const [memberItems, setMemberItems] = useState<readonly CrewMember[]>([]);
  const [isMemberLoading, setIsMemberLoading] = useState(false);
  const [memberErrorMessage, setMemberErrorMessage] = useState<string | null>(null);
  const [hasLoadedMembers, setHasLoadedMembers] = useState(false);
  const [processingMemberId, setProcessingMemberId] = useState<number | null>(null);

  useEffect(() => {
    if (activeSection !== "delete") {
      return;
    }

    let isCurrentRequest = true;

    async function loadDeletionAvailability(): Promise<void> {
      setIsDeletionAvailabilityLoading(true);
      setDeletionAvailabilityErrorMessage(null);

      try {
        const result = await getCrewDeletionAvailability(crew.crewId);
        if (!isCurrentRequest) {
          return;
        }

        setDeletionAvailability({
          canDelete: result.canDelete,
          hasOnlyLeader: result.hasOnlyLeader,
          hasNoUnfinishedMeetings: result.hasNoUnfinishedMeetings,
        });
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }

        setDeletionAvailability(null);
        setDeletionAvailabilityErrorMessage(
          getUserMessage(error, "크루 삭제 가능 여부를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
      } finally {
        if (isCurrentRequest) {
          setIsDeletionAvailabilityLoading(false);
        }
      }
    }

    void loadDeletionAvailability();

    return () => {
      isCurrentRequest = false;
    };
  }, [activeSection, crew.crewId]);

  useEffect(() => {
    if (activeSection !== "policy" || hasLoadedPolicies) {
      return;
    }

    let isCurrentRequest = true;

    async function loadPolicies(): Promise<void> {
      setIsPolicyLoading(true);
      setPolicyErrorMessage(null);

      try {
        const result = await getCrewPolicies(crew.crewId);
        if (!isCurrentRequest) {
          return;
        }

        setPolicyItems(result);
        setHasLoadedPolicies(true);
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }

        setPolicyItems([]);
        setPolicyErrorMessage(getUserMessage(error, "크루 정책을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
      } finally {
        if (isCurrentRequest) {
          setIsPolicyLoading(false);
        }
      }
    }

    void loadPolicies();

    return () => {
      isCurrentRequest = false;
    };
  }, [activeSection, crew.crewId, hasLoadedPolicies]);

  useEffect(() => {
    if (activeSection !== "joinRequests" || hasLoadedJoinRequests) {
      return;
    }

    let isCurrentRequest = true;

    async function loadJoinRequests(): Promise<void> {
      setIsJoinRequestLoading(true);
      setJoinRequestErrorMessage(null);

      try {
        const result = await getCrewJoinRequests(crew.crewId);
        if (!isCurrentRequest) {
          return;
        }

        setJoinRequestItems(result.items);
        setHasLoadedJoinRequests(true);
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }

        setJoinRequestItems([]);
        setJoinRequestErrorMessage(
          getUserMessage(error, "가입 신청 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."),
        );
      } finally {
        if (isCurrentRequest) {
          setIsJoinRequestLoading(false);
        }
      }
    }

    void loadJoinRequests();

    return () => {
      isCurrentRequest = false;
    };
  }, [activeSection, crew.crewId, hasLoadedJoinRequests]);

  useEffect(() => {
    if (activeSection !== "members" || hasLoadedMembers) {
      return;
    }

    let isCurrentRequest = true;

    async function loadMembers(): Promise<void> {
      setIsMemberLoading(true);
      setMemberErrorMessage(null);

      try {
        const result = await getCrewMembers(crew.crewId);
        if (!isCurrentRequest) {
          return;
        }

        setMemberItems(result.items);
        setHasLoadedMembers(true);
      } catch (error) {
        if (!isCurrentRequest) {
          return;
        }

        setMemberItems([]);
        setMemberErrorMessage(getUserMessage(error, "크루원 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."));
      } finally {
        if (isCurrentRequest) {
          setIsMemberLoading(false);
        }
      }
    }

    void loadMembers();

    return () => {
      isCurrentRequest = false;
    };
  }, [activeSection, crew.crewId, hasLoadedMembers]);

  const pendingJoinRequestItems = joinRequestItems.filter((item) => item.status === "PENDING");
  const isDeleteButtonDisabled = !deletionAvailability?.canDelete || isDeletionAvailabilityLoading || isDeleting;

  function openDeleteConfirmation(): void {
    if (isDeleteButtonDisabled) {
      return;
    }

    setDeleteErrorMessage(null);
    setIsDeleteConfirmationOpen(true);
  }

  function closeDeleteConfirmation(): void {
    if (isDeleting) {
      return;
    }

    setIsDeleteConfirmationOpen(false);
  }

  async function handleDeleteConfirm(): Promise<void> {
    if (!deletionAvailability?.canDelete || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteErrorMessage(null);

    try {
      await deleteCrew(crew.crewId, crew.name);
      onClose();
      router.replace("/?notice=crew-deleted");
    } catch (error) {
      reportOperationalError("crew.delete_failed", error, {
        route: `/crews/${crew.crewId}`,
      });
      setDeleteErrorMessage(getDeleteErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }

  function resetNoticeForm(): void {
    setNoticeDraft("");
    setNoticeEditorErrorMessage(null);
    setNoticeFormMode(null);
  }

  function openNoticeCreateForm(): void {
    setNoticeDraft("");
    setNoticeEditorErrorMessage(null);
    setNoticeFormMode({ kind: "create" });
  }

  function startNoticeEdit(notice: NoticeManagementItem): void {
    setNoticeDraft(notice.body);
    setNoticeEditorErrorMessage(null);
    setNoticeFormMode({ kind: "edit", noticeId: notice.id });
  }

  function openNoticeDeleteConfirmation(noticeId: number): void {
    setNoticeDeleteTargetId(noticeId);
  }

  function closeNoticeDeleteConfirmation(): void {
    setNoticeDeleteTargetId(null);
  }

  function handleNoticeDeleteConfirm(): void {
    if (noticeDeleteTargetId === null) {
      return;
    }

    setNoticeItems((currentItems) => currentItems.filter((notice) => notice.id !== noticeDeleteTargetId));
    closeNoticeDeleteConfirmation();
  }

  function handleNoticeSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (noticeFormMode === null) {
      return;
    }

    const trimmedDraft = noticeDraft.trim();
    if (!trimmedDraft) {
      setNoticeEditorErrorMessage("공지 내용을 입력해 주세요.");
      return;
    }

    if (noticeFormMode.kind === "edit") {
      setNoticeItems((currentItems) =>
        currentItems.map((notice) =>
          notice.id === noticeFormMode.noticeId
            ? {
                ...notice,
                body: trimmedDraft,
              }
            : notice,
        ),
      );
      resetNoticeForm();
      return;
    }

    setNoticeItems([
      {
        id: createNextNoticeId(noticeItems),
        body: trimmedDraft,
        date: formatNoticeDate(new Date()),
      },
    ]);
    resetNoticeForm();
  }

  function resetPolicyForm(): void {
    setPolicyTitleDraft("");
    setPolicyBodyDraft("");
    setPolicyEditorErrorMessage(null);
    setPolicyFormMode(null);
  }

  function openPolicyCreateForm(): void {
    setPolicyTitleDraft("");
    setPolicyBodyDraft("");
    setPolicyEditorErrorMessage(null);
    setPolicyFormMode({ kind: "create" });
  }

  function startPolicyEdit(policy: CrewPolicy): void {
    setPolicyTitleDraft(policy.title);
    setPolicyBodyDraft(policy.content);
    setPolicyEditorErrorMessage(null);
    setPolicyFormMode({ kind: "edit", policyId: policy.policyId });
  }

  function openPolicyDeleteConfirmation(policyId: number): void {
    setPolicyDeleteTargetId(policyId);
  }

  function closePolicyDeleteConfirmation(): void {
    setPolicyDeleteTargetId(null);
  }

  function handlePolicyDeleteConfirm(): void {
    if (policyDeleteTargetId === null) {
      return;
    }

    setPolicyItems((currentItems) => currentItems.filter((policy) => policy.policyId !== policyDeleteTargetId));
    closePolicyDeleteConfirmation();
  }

  function handlePolicySubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (policyFormMode === null) {
      return;
    }

    const trimmedTitle = policyTitleDraft.trim();
    const trimmedBody = policyBodyDraft.trim();
    if (!trimmedTitle || !trimmedBody) {
      setPolicyEditorErrorMessage("정책 제목과 내용을 입력해 주세요.");
      return;
    }

    if (policyFormMode.kind === "edit") {
      setPolicyItems((currentItems) =>
        currentItems.map((policy) =>
          policy.policyId === policyFormMode.policyId
            ? {
                ...policy,
                title: trimmedTitle,
                content: trimmedBody,
              }
            : policy,
        ),
      );
      resetPolicyForm();
      return;
    }

    setPolicyItems((currentItems) => [
      ...currentItems,
      {
        policyId: createNextPolicyId(currentItems),
        title: trimmedTitle,
        content: trimmedBody,
      },
    ]);
    resetPolicyForm();
  }

  async function resolveJoinRequest(requestId: number, action: "approve" | "reject"): Promise<void> {
    if (processingJoinRequestId !== null) {
      return;
    }

    setProcessingJoinRequestId(requestId);
    setJoinRequestErrorMessage(null);

    try {
      if (action === "approve") {
        await approveCrewJoinRequest(crew.crewId, requestId);
      } else {
        await rejectCrewJoinRequest(crew.crewId, requestId);
      }

      setJoinRequestItems((currentItems) => currentItems.filter((item) => item.requestId !== requestId));
    } catch (error) {
      reportOperationalError(`crew.management_join_request_${action}_failed`, error, {
        route: `/crews/${crew.crewId}`,
      });
      setJoinRequestErrorMessage(
        getUserMessage(
          error,
          action === "approve"
            ? "가입 신청 승인에 실패했습니다. 잠시 후 다시 시도해 주세요."
            : "가입 신청 거절에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        ),
      );
    } finally {
      setProcessingJoinRequestId(null);
    }
  }

  async function transferMemberLeadership(userId: number): Promise<void> {
    if (processingMemberId !== null) {
      return;
    }

    setProcessingMemberId(userId);
    setMemberErrorMessage(null);

    try {
      await transferCrewLeadership(crew.crewId, userId);
      setMemberItems((currentItems) =>
        currentItems.map((member) => ({
          ...member,
          role: member.userId === userId ? "LEADER" : member.role === "LEADER" ? "MEMBER" : member.role,
        })),
      );
    } catch (error) {
      reportOperationalError("crew.management_transfer_leadership_failed", error, {
        route: `/crews/${crew.crewId}`,
      });
      setMemberErrorMessage(getUserMessage(error, "크루장 위임에 실패했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setProcessingMemberId(null);
    }
  }

  async function removeManagedMember(userId: number): Promise<void> {
    if (processingMemberId !== null) {
      return;
    }

    setProcessingMemberId(userId);
    setMemberErrorMessage(null);

    try {
      await removeCrewMember(crew.crewId, userId);
      setMemberItems((currentItems) => currentItems.filter((member) => member.userId !== userId));
    } catch (error) {
      reportOperationalError("crew.management_remove_member_failed", error, {
        route: `/crews/${crew.crewId}`,
      });
      setMemberErrorMessage(getUserMessage(error, "크루원을 퇴출하지 못했습니다. 잠시 후 다시 시도해 주세요."));
    } finally {
      setProcessingMemberId(null);
    }
  }

  return (
    <div className={styles.backdrop}>
      <section
        aria-labelledby="crew-management-settings-title"
        aria-modal="true"
        className={styles.dialog}
        role="dialog"
      >
        <header className={styles.header}>
          <h2 id="crew-management-settings-title">크루 관리 설정</h2>
          <button className={styles.closeButton} type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </header>

        <div className={styles.body}>
          <nav className={styles.sideNav} aria-label="크루 관리 설정 메뉴">
            <div className={styles.primaryMenu}>
              {MANAGEMENT_SECTIONS.filter((section) => section.tone !== "danger").map((section) => (
                <button
                  key={section.key}
                  type="button"
                  aria-current={section.key === activeSection ? "page" : undefined}
                  className={section.key === activeSection ? styles.activeNavItem : styles.navItem}
                  onClick={() => setActiveSection(section.key)}
                >
                  {section.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              aria-current={activeSection === "delete" ? "page" : undefined}
              className={activeSection === "delete" ? styles.activeDangerNavItem : styles.dangerNavItem}
              onClick={() => setActiveSection("delete")}
            >
              크루 삭제
            </button>
          </nav>

          <div className={styles.content}>
            {activeSection === "basic" ? (
              <form className={styles.basicForm}>
                <div className={styles.sectionHeader}>
                  <h3>기본 정보</h3>
                  <p>크루의 기본 정보를 수정합니다.</p>
                </div>

                <div className={styles.formGrid}>
                  <button className={styles.photoUpload} type="button" aria-label="사진 추가">
                    <span>+ 사진</span>
                    <small>
                      권장: 800 x 800px 이상, JPG 또는 PNG 계열로 선택해 주세요.
                      5mb 이하의 사진은 업로드 되지 않습니다.
                    </small>
                  </button>

                  <div className={styles.fieldStack}>
                    <TextField
                      className={styles.scaledField}
                      id="crew-management-name"
                      label="크루 이름"
                      placeholder="크루 이름을 입력하세요"
                      value={crewName}
                      onChange={(event) => setCrewName(event.target.value)}
                    />
                    <Textarea
                      className={`${styles.scaledField} ${styles.scaledDescription}`}
                      id="crew-management-description"
                      label="크루 소개"
                      maxLength={500}
                      placeholder="크루를 소개해 주세요"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                    <SwitchBox
                      className={styles.publicSwitch}
                      id="crew-management-public"
                      label="공개 설정"
                      checked={isPublic}
                      onChange={(event) => setIsPublic(event.target.checked)}
                    />
                  </div>
                </div>

                <div className={styles.formFooter}>
                  <Button type="button" className={styles.saveButton}>
                    변경사항 저장
                  </Button>
                </div>
              </form>
            ) : activeSection === "notice" ? (
              <section className={styles.noticePanel} aria-labelledby="crew-management-notice-title">
                <div className={styles.noticeHeader}>
                  <h3 id="crew-management-notice-title">공지 사항 관리</h3>
                  <p>공지는 항상 1개만 표시됩니다. 공지를 추가하면 기존 공지는 비공개 처리됩니다.</p>
                </div>

                <p className={styles.noticeGuide}>공지 작성시 전화번호, 계좌번호 등 개인정보가 포함되지 않도록 주의해 주세요.</p>

                {noticeFormMode === null ? (
                  <>
                    <div className={styles.noticeToolbar}>
                      <Button type="button" className={styles.noticeAddButton} onClick={openNoticeCreateForm}>
                        + 새 공지 추가
                      </Button>
                    </div>

                    {noticeItems.length > 0 ? (
                      <ul className={styles.noticeList} aria-label="공지 목록">
                        {noticeItems.map((notice) => (
                          <li key={notice.id} className={styles.noticeItem}>
                            <div className={styles.noticeItemText}>
                              <p>{notice.body}</p>
                              <time dateTime={notice.date.replaceAll(".", "-")}>{notice.date}</time>
                            </div>
                            <div className={styles.noticeItemActions}>
                              <button type="button" onClick={() => startNoticeEdit(notice)}>
                                수정
                              </button>
                              <button type="button" onClick={() => openNoticeDeleteConfirmation(notice.id)}>
                                삭제
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={styles.noticeEmpty}>등록된 공지가 없습니다.</p>
                    )}

                    <p className={styles.noticeHint}>+ 공지를 추가하려면 위의 버튼을 누르세요</p>
                  </>
                ) : (
                  <form
                    className={styles.noticeFormCard}
                    aria-labelledby="crew-notice-form-title"
                    onSubmit={handleNoticeSubmit}
                  >
                    <h4 id="crew-notice-form-title">
                      {noticeFormMode.kind === "create" ? "새 공지 추가" : "공지 수정"}
                    </h4>
                    <Textarea
                      className={styles.noticeFormTextarea}
                      id="crew-notice-inline-body"
                      label="내용"
                      maxLength={500}
                      placeholder="정책 내용을 입력해 주세요 (최대 500자)"
                      value={noticeDraft}
                      onChange={(event) => {
                        setNoticeDraft(event.target.value);
                        setNoticeEditorErrorMessage(null);
                      }}
                    />
                    {noticeEditorErrorMessage ? (
                      <p className={styles.noticeFormError}>{noticeEditorErrorMessage}</p>
                    ) : null}
                    <div className={styles.noticeFormActions}>
                      <Button type="button" className={styles.noticeFormCancelButton} onClick={resetNoticeForm}>
                        취소
                      </Button>
                      <Button type="submit" className={styles.noticeFormSubmitButton}>
                        {noticeFormMode.kind === "create" ? "저장" : "수정하기"}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            ) : activeSection === "policy" ? (
              <section className={styles.noticePanel} aria-labelledby="crew-management-policy-title">
                <div className={styles.noticeHeader}>
                  <h3 id="crew-management-policy-title">크루 정책 관리</h3>
                  <p>정책을 추가하고 최대 500자까지 작성할 수 있습니다.</p>
                </div>

                <p className={styles.noticeGuide}>정책 작성 시 전화번호, 계좌번호 등 개인정보가 포함되지 않도록 주의해 주세요.</p>

                {policyFormMode === null ? (
                  <>
                    <div className={styles.noticeToolbar}>
                      <Button type="button" className={styles.noticeAddButton} onClick={openPolicyCreateForm}>
                        + 정책 추가
                      </Button>
                    </div>

                    {isPolicyLoading ? <p className={styles.noticeEmpty}>정책을 불러오고 있습니다.</p> : null}
                    {policyErrorMessage ? <p className={styles.deleteErrorMessage}>{policyErrorMessage}</p> : null}

                    {!isPolicyLoading && policyItems.length > 0 ? (
                      <ul className={styles.noticeList} aria-label="정책 목록">
                        {policyItems.map((policy) => (
                          <li key={policy.policyId} className={styles.noticeItem}>
                            <div className={styles.noticeItemText}>
                              <strong className={styles.policyItemTitle}>{policy.title}</strong>
                              <p>{policy.content}</p>
                            </div>
                            <div className={styles.noticeItemActions}>
                              <button type="button" onClick={() => startPolicyEdit(policy)}>
                                수정
                              </button>
                              <button type="button" onClick={() => openPolicyDeleteConfirmation(policy.policyId)}>
                                삭제
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {!isPolicyLoading && policyItems.length === 0 && !policyErrorMessage ? (
                      <p className={styles.noticeEmpty}>등록된 정책이 없습니다.</p>
                    ) : null}
                  </>
                ) : (
                  <form
                    className={styles.noticeFormCard}
                    aria-labelledby="crew-policy-form-title"
                    onSubmit={handlePolicySubmit}
                  >
                    <h4 id="crew-policy-form-title">
                      {policyFormMode.kind === "create" ? "새 정책 추가" : "정책 수정"}
                    </h4>
                    <TextField
                      className={styles.policyFormTitleField}
                      id="crew-policy-inline-title"
                      label="제목"
                      maxLength={30}
                      placeholder="정책 제목을 입력해 주세요"
                      value={policyTitleDraft}
                      onChange={(event) => {
                        setPolicyTitleDraft(event.target.value);
                        setPolicyEditorErrorMessage(null);
                      }}
                    />
                    <Textarea
                      className={styles.noticeFormTextarea}
                      id="crew-policy-inline-body"
                      label="내용"
                      maxLength={500}
                      placeholder="정책 내용을 입력해 주세요 (최대 500자)"
                      value={policyBodyDraft}
                      onChange={(event) => {
                        setPolicyBodyDraft(event.target.value);
                        setPolicyEditorErrorMessage(null);
                      }}
                    />
                    {policyEditorErrorMessage ? (
                      <p className={styles.noticeFormError}>{policyEditorErrorMessage}</p>
                    ) : null}
                    <div className={styles.noticeFormActions}>
                      <Button type="button" className={styles.noticeFormCancelButton} onClick={resetPolicyForm}>
                        취소
                      </Button>
                      <Button type="submit" className={styles.noticeFormSubmitButton}>
                        {policyFormMode.kind === "create" ? "저장" : "수정하기"}
                      </Button>
                    </div>
                  </form>
                )}
              </section>
            ) : activeSection === "joinRequests" ? (
              <section className={styles.joinRequestPanel} aria-labelledby="crew-management-join-requests-title">
                <div className={styles.joinRequestHeader}>
                  <h3 id="crew-management-join-requests-title">
                    가입 신청 관리
                    <span aria-hidden="true">{pendingJoinRequestItems.length}건</span>
                  </h3>
                  <p>대기 중인 가입 신청을 검토하고 승인하거나 거절하세요.</p>
                </div>

                {isJoinRequestLoading ? <p className={styles.joinRequestEmpty}>가입 신청 목록을 불러오고 있습니다.</p> : null}
                {joinRequestErrorMessage ? <p className={styles.deleteErrorMessage}>{joinRequestErrorMessage}</p> : null}

                {!isJoinRequestLoading && pendingJoinRequestItems.length > 0 ? (
                  <ul className={styles.joinRequestList} aria-label="가입 신청 목록">
                    {pendingJoinRequestItems.map((item) => (
                      <li key={item.requestId} className={styles.joinRequestItem}>
                        <div className={styles.joinRequestProfile}>
                          <span className={styles.joinRequestAvatar} aria-hidden="true" />
                          <div className={styles.joinRequestApplicant}>
                            <strong>{item.nickname}</strong>
                            <span>가입 대기</span>
                          </div>
                        </div>
                        <div className={styles.joinRequestActions}>
                          <button
                            type="button"
                            disabled={processingJoinRequestId === item.requestId}
                            onClick={() => void resolveJoinRequest(item.requestId, "reject")}
                          >
                            거절
                          </button>
                          <button
                            type="button"
                            disabled={processingJoinRequestId === item.requestId}
                            onClick={() => void resolveJoinRequest(item.requestId, "approve")}
                          >
                            승인
                          </button>
                        </div>
                        <p className={styles.joinRequestMessage}>{item.message ?? "가입 신청 메시지가 없습니다."}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {!isJoinRequestLoading && pendingJoinRequestItems.length === 0 && !joinRequestErrorMessage ? (
                  <p className={styles.joinRequestEmpty}>대기 중인 가입 신청이 없습니다.</p>
                ) : null}
              </section>
            ) : activeSection === "members" ? (
              <section className={styles.memberPanel} aria-labelledby="crew-management-members-title">
                <div className={styles.memberHeader}>
                  <h3 id="crew-management-members-title">
                    멤버 관리
                    <span aria-hidden="true">총 {memberItems.length}명</span>
                  </h3>
                  <p>크루원 목록을 관리하고 권한을 위임하거나 크루원을 퇴출하세요.</p>
                </div>

                {isMemberLoading ? <p className={styles.memberEmpty}>크루원 목록을 불러오고 있습니다.</p> : null}
                {memberErrorMessage ? <p className={styles.deleteErrorMessage}>{memberErrorMessage}</p> : null}

                {!isMemberLoading && memberItems.length > 0 ? (
                  <ul className={styles.memberList} aria-label="멤버 목록">
                    {memberItems.map((member) => (
                      <li key={member.userId} className={styles.memberItem}>
                        <div className={styles.memberProfile}>
                          <span className={styles.memberAvatar} aria-hidden="true" />
                          <div className={styles.memberText}>
                            <div className={styles.memberNameRow}>
                              <strong>{member.nickname}</strong>
                              <span
                                className={member.role === "LEADER" ? styles.memberLeaderBadge : styles.memberRoleBadge}
                              >
                                {member.role === "LEADER" ? "크루장" : "크루원"}
                              </span>
                            </div>
                            <time dateTime={member.joinedAt}>{member.joinedAt} 가입</time>
                          </div>
                        </div>
                        {member.role === "MEMBER" ? (
                          <div className={styles.memberActions}>
                            <button
                              type="button"
                              disabled={processingMemberId === member.userId}
                              onClick={() => void transferMemberLeadership(member.userId)}
                            >
                              위임
                            </button>
                            <button
                              type="button"
                              disabled={processingMemberId === member.userId}
                              onClick={() => void removeManagedMember(member.userId)}
                            >
                              퇴출
                            </button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {!isMemberLoading && memberItems.length === 0 && !memberErrorMessage ? (
                  <p className={styles.memberEmpty}>등록된 크루원이 없습니다.</p>
                ) : null}
              </section>
            ) : activeSection === "delete" ? (
              <section className={styles.deletePanel} aria-live="polite">
                <div className={styles.deleteHeader}>
                  <h3>크루 삭제는 아래 조건을 만족시켜야 합니다.</h3>
                </div>

                <div className={styles.deleteConditionList}>
                  <div
                    className={
                      deletionAvailability?.hasOnlyLeader
                        ? styles.deleteConditionSatisfied
                        : styles.deleteConditionBlocked
                    }
                  >
                    <span>크루장 외의 남아 있는 크루원이 없어야 합니다.</span>
                    <ConditionStatusIcon satisfied={deletionAvailability?.hasOnlyLeader === true} />
                  </div>
                  <div
                    className={
                      deletionAvailability?.hasNoUnfinishedMeetings
                        ? styles.deleteConditionSatisfied
                        : styles.deleteConditionBlocked
                    }
                  >
                    <span>해당 크루 안에 완료되지 않은 모임이 있으면 크루 삭제를 할 수 없습니다.</span>
                    <ConditionStatusIcon satisfied={deletionAvailability?.hasNoUnfinishedMeetings === true} />
                  </div>
                </div>

                {isDeletionAvailabilityLoading ? (
                  <p className={styles.deleteStatusMessage}>삭제 가능 여부를 확인하고 있습니다.</p>
                ) : null}
                {deletionAvailabilityErrorMessage ? (
                  <p className={styles.deleteErrorMessage}>{deletionAvailabilityErrorMessage}</p>
                ) : null}

                <div className={styles.deleteActionRow}>
                  <Button
                    type="button"
                    className={styles.deleteButton}
                    disabled={isDeleteButtonDisabled}
                    onClick={openDeleteConfirmation}
                  >
                    크루삭제
                  </Button>
                </div>
              </section>
            ) : (
              <section className={styles.placeholderPanel} aria-live="polite">
                <h3>{MANAGEMENT_SECTIONS.find((section) => section.key === activeSection)?.label}</h3>
                <p>이 설정은 다음 단계에서 연결합니다.</p>
              </section>
            )}
          </div>
        </div>

        {isDeleteConfirmationOpen ? (
          <div className={styles.confirmationLayer}>
            <section
              aria-labelledby="crew-delete-confirmation-title"
              aria-modal="true"
              className={styles.confirmationDialog}
              role="alertdialog"
            >
              <header className={styles.confirmationHeader}>
                <h3 id="crew-delete-confirmation-title">크루 삭제</h3>
                <button
                  className={styles.confirmationCloseButton}
                  type="button"
                  aria-label="삭제 확인 닫기"
                  onClick={closeDeleteConfirmation}
                >
                  ×
                </button>
              </header>

              <div className={styles.confirmationBody}>
                <span className={styles.confirmationWarningIcon} aria-hidden="true">
                  !
                </span>
                <div className={styles.confirmationText}>
                  <strong>크루를 삭제하시겠습니까?</strong>
                  <p>삭제된 크루의 방탈로그, 모임 일정, 사진 등 모든 정보는 제거되며, 복구할 수 없습니다.</p>
                </div>
                {deleteErrorMessage ? <p className={styles.confirmationError}>{deleteErrorMessage}</p> : null}
              </div>

              <footer className={styles.confirmationFooter}>
                <Button
                  type="button"
                  className={styles.confirmationCancelButton}
                  disabled={isDeleting}
                  onClick={closeDeleteConfirmation}
                >
                  취소
                </Button>
                <Button
                  type="button"
                  className={styles.confirmationDeleteButton}
                  disabled={isDeleting}
                  onClick={() => void handleDeleteConfirm()}
                >
                  {isDeleting ? "삭제 중" : "삭제하기"}
                </Button>
              </footer>
            </section>
          </div>
        ) : null}

        {noticeDeleteTargetId !== null ? (
          <div className={styles.confirmationLayer}>
            <section
              aria-labelledby="crew-notice-delete-confirmation-title"
              aria-modal="true"
              className={styles.confirmationDialog}
              role="alertdialog"
            >
              <header className={styles.confirmationHeader}>
                <h3 id="crew-notice-delete-confirmation-title">공지 삭제</h3>
                <button
                  className={styles.confirmationCloseButton}
                  type="button"
                  aria-label="공지 삭제 닫기"
                  onClick={closeNoticeDeleteConfirmation}
                >
                  ×
                </button>
              </header>

              <div className={styles.confirmationBody}>
                <span className={styles.confirmationWarningIcon} aria-hidden="true">
                  !
                </span>
                <div className={styles.confirmationText}>
                  <strong>공지를 삭제하시겠습니까?</strong>
                  <p>삭제한 공지는 목록에서 제거되며, 다시 표시하려면 새 공지를 추가해야 합니다.</p>
                </div>
              </div>

              <footer className={styles.confirmationFooter}>
                <Button type="button" className={styles.confirmationCancelButton} onClick={closeNoticeDeleteConfirmation}>
                  취소
                </Button>
                <Button type="button" className={styles.confirmationDeleteButton} onClick={handleNoticeDeleteConfirm}>
                  삭제하기
                </Button>
              </footer>
            </section>
          </div>
        ) : null}

        {policyDeleteTargetId !== null ? (
          <div className={styles.confirmationLayer}>
            <section
              aria-labelledby="crew-policy-delete-confirmation-title"
              aria-modal="true"
              className={styles.confirmationDialog}
              role="alertdialog"
            >
              <header className={styles.confirmationHeader}>
                <h3 id="crew-policy-delete-confirmation-title">정책 삭제</h3>
                <button
                  className={styles.confirmationCloseButton}
                  type="button"
                  aria-label="정책 삭제 닫기"
                  onClick={closePolicyDeleteConfirmation}
                >
                  ×
                </button>
              </header>

              <div className={styles.confirmationBody}>
                <span className={styles.confirmationWarningIcon} aria-hidden="true">
                  !
                </span>
                <div className={styles.confirmationText}>
                  <strong>정책을 삭제하시겠습니까?</strong>
                  <p>삭제한 정책은 목록에서 제거되며, 다시 표시하려면 새 정책을 추가해야 합니다.</p>
                </div>
              </div>

              <footer className={styles.confirmationFooter}>
                <Button type="button" className={styles.confirmationCancelButton} onClick={closePolicyDeleteConfirmation}>
                  취소
                </Button>
                <Button type="button" className={styles.confirmationDeleteButton} onClick={handlePolicyDeleteConfirm}>
                  삭제하기
                </Button>
              </footer>
            </section>
          </div>
        ) : null}
      </section>
    </div>
  );
}
