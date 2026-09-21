
import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react-native";

import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { router } from "expo-router";

import ElderlyDashboard from "../src/app/elderly/dashboard";

const mockLogout = jest.fn();

jest.mock("../src/presenters/AuthPresenter", () => ({
  AuthPresenter: jest.fn().mockImplementation(() => ({
    logout: mockLogout,
  })),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

describe("ElderlyDashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders elderly dashboard content", async () => {
    await render(<ElderlyDashboard />);

    expect(screen.getByText("Good Morning")).toBeTruthy();

    expect(screen.getByText("Next Check-in")).toBeTruthy();

    expect(screen.getByText("How are you?")).toBeTruthy();

    expect(screen.getByText("I'M OK ✓")).toBeTruthy();

    expect(screen.getByText("View Check-in History")).toBeTruthy();

    expect(screen.getByText("Log Out")).toBeTruthy();
  });

  test("history button navigates to elderly history", async () => {
    await render(<ElderlyDashboard />);

    await fireEvent.press(screen.getByText("View Check-in History"));

    expect(router.push).toHaveBeenCalledWith("/elderly/history");
  });

  test("logout signs user out and returns to login", async () => {
    mockLogout.mockResolvedValue(undefined);

    await render(<ElderlyDashboard />);

    await fireEvent.press(screen.getByText("Log Out"));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(router.replace).toHaveBeenCalledWith("/");
  });
});
