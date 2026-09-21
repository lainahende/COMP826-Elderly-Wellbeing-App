import {
    fireEvent,
    render,
    screen,
    waitFor,
} from "@testing-library/react-native";

import {
    afterAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";

import { router } from "expo-router";

import LoginScreen from "../src/app/index";

const mockLogin = jest.fn();

const consoleErrorSpy = jest
  .spyOn(console, "error")
  .mockImplementation(() => {});

jest.mock("../src/presenters/AuthPresenter", () => ({
  AuthPresenter: jest.fn().mockImplementation(() => ({
    login: mockLogin,
    logout: jest.fn(),
  })),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

describe("LoginScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  test("renders login fields and login button", async () => {
    await render(<LoginScreen />);

    expect(screen.getByPlaceholderText("Enter your email")).toBeTruthy();

    expect(screen.getByPlaceholderText("Enter your password")).toBeTruthy();

    expect(screen.getByText("Log In")).toBeTruthy();
  });

  test("does not authenticate when fields are empty", async () => {
    await render(<LoginScreen />);

    await fireEvent.press(screen.getByText("Log In"));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("does not authenticate when email format is invalid", async () => {
    await render(<LoginScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your email"),
      "invalid-email",
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your password"),
      "Password123!",
    );

    await fireEvent.press(screen.getByText("Log In"));

    expect(mockLogin).not.toHaveBeenCalled();
  });

  test("elderly user is redirected to elderly dashboard", async () => {
    mockLogin.mockResolvedValue({
      id: "elderly123",
      name: "Test Elderly User",
      email: "elderly@test.com",
      role: "elderly",
    });

    await render(<LoginScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your email"),
      "elderly@test.com",
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your password"),
      "Password123!",
    );

    await fireEvent.press(screen.getByText("Log In"));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/elderly/dashboard");
    });
  });

  test("caregiver user is redirected to caregiver dashboard", async () => {
    mockLogin.mockResolvedValue({
      id: "caregiver123",
      name: "Test Caregiver",
      email: "caregiver@test.com",
      role: "caregiver",
    });

    await render(<LoginScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your email"),
      "caregiver@test.com",
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your password"),
      "Password123!",
    );

    await fireEvent.press(screen.getByText("Log In"));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith("/caregiver/dashboard");
    });
  });

  test("invalid credentials do not redirect user", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid credentials"));

    await render(<LoginScreen />);

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your email"),
      "test@example.com",
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Enter your password"),
      "wrongpassword",
    );

    await fireEvent.press(screen.getByText("Log In"));

    await waitFor(() => {
      expect(router.replace).not.toHaveBeenCalled();
    });
  });
});
