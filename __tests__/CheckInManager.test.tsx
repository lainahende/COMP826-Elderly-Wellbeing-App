import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import { CheckInManager } from "../src/managers/CheckInManager";

const mockCreateCheckIn = jest.fn();

jest.mock("../src/services/DatabaseService", () => ({
  DatabaseService: jest.fn().mockImplementation(() => ({
    createCheckIn: mockCreateCheckIn,
  })),
}));

describe("CheckInManager", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates a check-in for the elderly user", async () => {
    mockCreateCheckIn.mockResolvedValue("checkin123");

    const manager = new CheckInManager();

    const result = await manager.completeCheckIn("elderly123");

    expect(mockCreateCheckIn).toHaveBeenCalledWith("elderly123");

    expect(result).toBe("checkin123");
  });
});
