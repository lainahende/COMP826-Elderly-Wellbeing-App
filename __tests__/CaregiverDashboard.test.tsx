
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { router } from "expo-router";

import CaregiverDashboard from "../src/app/caregiver/dashboard";

const mockLogout = jest.fn();

jest.mock("../src/presenters/AuthPresenter", () => ({
  AuthPresenter: jest.fn().mockImplementation(() => ({
    logout: mockLogout,
  })),
}));

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

describe("CaregiverDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders caregiver dashboard controls", async () => {
    await render(<CaregiverDashboard />);

    expect(screen.getByText("Caregiver Dashboard")).toBeTruthy();

    expect(screen.getByText("Reminder Schedule")).toBeTruthy();

    expect(screen.getByText("Check-in History")).toBeTruthy();

    expect(screen.getByText("Log Out")).toBeTruthy();
  });

  test("reminder schedule button opens reminder screen", async () => {
    await render(<CaregiverDashboard />);

    await fireEvent.press(screen.getByText("Reminder Schedule"));

    expect(router.push).toHaveBeenCalledWith("/caregiver/schedule");
  });

  test("history button opens caregiver history", async () => {
    await render(<CaregiverDashboard />);

    await fireEvent.press(screen.getByText("Check-in History"));

    expect(router.push).toHaveBeenCalledWith("/caregiver/history");
  });

  test("logout signs user out and returns to login", async () => {
    mockLogout.mockResolvedValue(undefined);

    await render(<CaregiverDashboard />);

    await fireEvent.press(screen.getByText("Log Out"));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(router.replace).toHaveBeenCalledWith("/");
  });
});
