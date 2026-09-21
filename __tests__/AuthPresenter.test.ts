import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { AuthPresenter } from "../src/presenters/AuthPresenter";

const mockLogin = jest.fn();
const mockLogout = jest.fn();

jest.mock("../src/services/AuthService", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    login: mockLogin,
    logout: mockLogout,
  })),
}));

describe("AuthPresenter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("passes login credentials to AuthService", async () => {
    mockLogin.mockResolvedValue({
      id: "elderly123",
      name: "Test Elderly User",
      email: "elderly@test.com",
      role: "elderly",
    });

    const presenter = new AuthPresenter();

    await presenter.login("elderly@test.com", "Password123!");

    expect(mockLogin).toHaveBeenCalledWith("elderly@test.com", "Password123!");
  });

  test("returns authenticated user from AuthService", async () => {
    const expectedUser = {
      id: "elderly123",
      name: "Test Elderly User",
      email: "elderly@test.com",
      role: "elderly",
    };

    mockLogin.mockResolvedValue(expectedUser);

    const presenter = new AuthPresenter();

    const result = await presenter.login("elderly@test.com", "Password123!");

    expect(result).toEqual(expectedUser);
  });

  test("calls AuthService logout", async () => {
    mockLogout.mockResolvedValue(undefined);

    const presenter = new AuthPresenter();

    await presenter.logout();

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
