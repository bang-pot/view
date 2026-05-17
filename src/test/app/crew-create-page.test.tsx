import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import CrewCreatePage from "@/app/crews/new/page";
import { createCrew } from "@/shared/crew/client";
import { getMe } from "@/shared/auth/client";
import { uploadCrewCoverImage } from "@/shared/image/client";

const replaceMock = vi.fn();
const pushMock = vi.fn();
const routerMock = {
  push: pushMock,
  replace: replaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/shared/auth/client", () => ({
  getMe: vi.fn(),
}));

vi.mock("@/shared/crew/client", () => ({
  createCrew: vi.fn(),
}));

vi.mock("@/shared/image/client", () => ({
  uploadCrewCoverImage: vi.fn(),
}));

describe("CrewCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock.mockReset();
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("redirects guests to login before rendering the crew create form", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "GUEST",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: null,
      requiredTermsAcceptedAt: null,
    });

    render(<CrewCreatePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/login?redirectTo=%2Fcrews%2Fnew");
    });
  });

  it("redirects temp users to completion before rendering the crew create form", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "TEMP",
      completionRequired: true,
      redirectTo: "/crews/new",
      requiredTermsVersion: "2026-03-25",
      user: { id: 7, nickname: null },
      requiredTermsAcceptedAt: null,
    });

    render(<CrewCreatePage />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/auth/complete?redirectTo=%2Fcrews%2Fnew");
    });
  });

  it("defaults visibility to public and routes to the new crew page after a successful create", async () => {
    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(createCrew).mockResolvedValue({
      crewId: 21,
      name: "Banglog Crew",
      myRole: "LEADER",
    });
    vi.mocked(uploadCrewCoverImage).mockResolvedValue({
      uploadId: 300,
      url: "https://cdn.example.com/temp/crew-cover.jpg",
      sizeBytes: 1024,
    });

    render(<CrewCreatePage />);

    expect(await screen.findByRole("heading", { name: "Create crew" })).toBeInTheDocument();
    expect(screen.getByLabelText("Public")).toBeChecked();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Banglog Crew" },
    });
    fireEvent.change(screen.getByLabelText("Description"), {
      target: { value: "crew intro" },
    });
    fireEvent.change(screen.getByLabelText("Cover image"), {
      target: { files: [new File(["cover"], "crew-cover.jpg", { type: "image/jpeg" })] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create crew" }));

    await waitFor(() => {
      expect(uploadCrewCoverImage).toHaveBeenCalledWith(expect.any(File));
      expect(createCrew).toHaveBeenCalledWith({
        name: "Banglog Crew",
        description: "crew intro",
        visibility: "PUBLIC",
        imageUploadId: 300,
      });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/crews/21");
    });
  });

  it("shows duplicate crew name failures on the name field", async () => {
    const { OperationalError } = await import("@/shared/errors/operational");

    vi.mocked(getMe).mockResolvedValue({
      authStatus: "FULL",
      completionRequired: false,
      redirectTo: null,
      requiredTermsVersion: "2026-03-25",
      user: { id: 1, nickname: "banglog" },
      requiredTermsAcceptedAt: "2026-04-08T00:00:00Z",
    });
    vi.mocked(createCrew).mockRejectedValue(
      new OperationalError({
        code: "CREW_DUPLICATE_NAME",
        message: "이미 사용 중인 크루명입니다.",
        requestId: "req-crew-duplicate-1",
        status: 409,
        fieldErrors: [
          {
            field: "name",
            message: "이미 사용 중인 크루명입니다.",
          },
        ],
      }),
    );

    render(<CrewCreatePage />);

    await screen.findByRole("heading", { name: "Create crew" });
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Banglog Crew" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create crew" }));

    expect(await screen.findByText("이미 사용 중인 크루명입니다.")).toBeInTheDocument();
  });
});
