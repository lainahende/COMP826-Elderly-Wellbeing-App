import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

const mockGetCheckIns = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: mockBack,
  },
}));

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

const ElderlyHistory = require("../src/app/elderly/history").default;

describe("ElderlyHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders the check-in history title", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("Check-in History")).toBeTruthy();
    });
  });

  test("loads check-ins for the logged-in elderly user", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(mockGetCheckIns).toHaveBeenCalledWith("elderly123");
    });
  });

  test("back button returns to previous screen", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("‹ Back")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("‹ Back"));

    expect(mockBack).toHaveBeenCalledTimes(1);
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

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("✓ Checked in")).toBeTruthy();
    });

    expect(screen.getByText(/1 October 2026/)).toBeTruthy();
  });

  test("displays missed check-ins", async () => {
    mockGetCheckIns.mockResolvedValue([
      {
        id: "missed1",
        elderlyUserId: "elderly123",
        status: "missed",
        scheduledDate: "2026-10-01",
        scheduledTime: "10:00",
        timestamp: {
          toDate: () => new Date("2026-10-01T11:00:00"),
        },
      },
    ]);

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("Missed")).toBeTruthy();
    });

    expect(screen.getByText(/1 October 2026/)).toBeTruthy();

    expect(screen.getByText("10:00 AM")).toBeTruthy();

    expect(
      screen.getByText(
        "No check-in was recorded during the scheduled check-in period.",
      ),
    ).toBeTruthy();
  });

  test("uses scheduled date and time for missed check-ins", async () => {
    mockGetCheckIns.mockResolvedValue([
      {
        id: "missed1",
        elderlyUserId: "elderly123",
        status: "missed",
        scheduledDate: "2026-09-30",
        scheduledTime: "08:30",
        timestamp: {
          toDate: () => new Date("2026-10-01T12:00:00"),
        },
      },
    ]);

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("30 September 2026")).toBeTruthy();
    });

    expect(screen.getByText("8:30 AM")).toBeTruthy();
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

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getAllByText("✓ Checked in")).toHaveLength(2);
    });

    const dates = screen.getAllByTestId("check-in-date");

    expect(dates[0].props.children).toContain("1 October 2026");

    expect(dates[1].props.children).toContain("30 September 2026");
  });

  test("shows an empty message when no check-ins exist", async () => {
    mockGetCheckIns.mockResolvedValue([]);

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("No check-ins yet")).toBeTruthy();
    });

    expect(
      screen.getByText("Your completed check-ins will appear here."),
    ).toBeTruthy();
  });

  test("shows today for check-ins completed today", async () => {
    const today = new Date();

    mockGetCheckIns.mockResolvedValue([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",
        timestamp: {
          toDate: () => today,
        },
      },
    ]);

    render(<ElderlyHistory />);

    await waitFor(() => {
      expect(screen.getByText("Today")).toBeTruthy();
    });
  });
});
