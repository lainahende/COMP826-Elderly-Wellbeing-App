import { render, screen, waitFor } from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import ElderlyHistory from "../src/app/elderly/history";

const mockGetCheckIns = jest.fn();

jest.mock("../src/services/DatabaseService", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    getCheckIns: mockGetCheckIns,
  })),
}));

jest.mock("../src/config/firebase", () => ({
  auth: {
    currentUser: {
      uid: "elderly123",
    },
  },
}));

describe("ElderlyHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the check-in history title", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    await render(<ElderlyHistory />);

    expect(screen.getByText("Check-in History")).toBeTruthy();
  });

  test("loads check-ins for the logged-in elderly user", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    await render(<ElderlyHistory />);

    await waitFor(() => {
      expect(mockGetCheckIns).toHaveBeenCalledWith("elderly123");
    });
  });

  test("displays completed check-ins", async () => {
    mockGetCheckIns.mockResolvedValue([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",
        timestamp: {
          toDate: () => new Date("2026-10-01T10:00:00"),
        },
      },
    ]);

    await render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("Checked in")).toBeTruthy();
    });

    expect(screen.getByText(/1 October 2026/)).toBeTruthy();
  });

  test("displays newest check-ins first", async () => {
    mockGetCheckIns.mockResolvedValue([
      {
        id: "older",
        elderlyUserId: "elderly123",
        status: "completed",
        timestamp: {
          toDate: () => new Date("2026-09-30T08:00:00"),
        },
      },
      {
        id: "newer",
        elderlyUserId: "elderly123",
        status: "completed",
        timestamp: {
          toDate: () => new Date("2026-10-01T10:00:00"),
        },
      },
    ]);

    await render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getAllByText("Checked in")).toHaveLength(2);
    });

    const dates = screen.getAllByTestId("check-in-date");

    expect(dates[0].props.children).toContain("1 October 2026");

    expect(dates[1].props.children).toContain("30 September 2026");
  });

  test("shows an empty message when no check-ins exist", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    await render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("No check-ins recorded yet.")).toBeTruthy();
    });
  });
});
