import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../src/config/firebase", () => ({
  db: {},
}));

jest.mock("firebase/firestore", () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  serverTimestamp: jest.fn(),
  where: jest.fn(),
}));

import { DatabaseService } from "../src/services/DatabaseService";

const firestore = jest.requireMock("firebase/firestore") as {
  addDoc: jest.Mock;
  collection: jest.Mock;
  getDocs: jest.Mock;
  query: jest.Mock;
  serverTimestamp: jest.Mock;
  where: jest.Mock;
};

describe("DatabaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    firestore.collection.mockReturnValue("mockCollection");

    firestore.query.mockReturnValue("mockQuery");

    firestore.where.mockReturnValue("mockWhere");

    firestore.serverTimestamp.mockReturnValue("mockTimestamp");
  });

  test("creates a completed check-in with timestamp", async () => {
    firestore.addDoc.mockResolvedValue({
      id: "checkin123",
    });

    const databaseService = new DatabaseService();

    const result = await databaseService.createCheckIn("elderly123");

    expect(firestore.collection).toHaveBeenCalledWith(
      expect.anything(),
      "checkIns",
    );

    expect(firestore.serverTimestamp).toHaveBeenCalledTimes(1);

    expect(firestore.addDoc).toHaveBeenCalledWith("mockCollection", {
      elderlyUserId: "elderly123",
      status: "completed",
      timestamp: "mockTimestamp",
    });

    expect(result).toBe("checkin123");
  });

  test("associates created check-in with the correct elderly user", async () => {
    firestore.addDoc.mockResolvedValue({
      id: "checkin456",
    });

    const databaseService = new DatabaseService();

    await databaseService.createCheckIn("elderly456");

    expect(firestore.addDoc).toHaveBeenCalledWith(
      "mockCollection",
      expect.objectContaining({
        elderlyUserId: "elderly456",
      }),
    );
  });

  test("stores completed status when creating a check-in", async () => {
    firestore.addDoc.mockResolvedValue({
      id: "checkin789",
    });

    const databaseService = new DatabaseService();

    await databaseService.createCheckIn("elderly789");

    expect(firestore.addDoc).toHaveBeenCalledWith(
      "mockCollection",
      expect.objectContaining({
        status: "completed",
      }),
    );
  });

  test("returns the created Firestore document id", async () => {
    firestore.addDoc.mockResolvedValue({
      id: "newCheckInId",
    });

    const databaseService = new DatabaseService();

    const result = await databaseService.createCheckIn("elderly123");

    expect(result).toBe("newCheckInId");
  });

  test("queries check-ins belonging to the elderly user", async () => {
    firestore.getDocs.mockResolvedValue({
      docs: [
        {
          id: "checkin123",
          data: () => ({
            elderlyUserId: "elderly123",
            status: "completed",
            timestamp: "mockTimestamp",
          }),
        },
      ],
    });

    const databaseService = new DatabaseService();

    const result = await databaseService.getCheckIns("elderly123");

    expect(firestore.collection).toHaveBeenCalledWith(
      expect.anything(),
      "checkIns",
    );

    expect(firestore.where).toHaveBeenCalledWith(
      "elderlyUserId",
      "==",
      "elderly123",
    );

    expect(firestore.query).toHaveBeenCalledWith("mockCollection", "mockWhere");

    expect(firestore.getDocs).toHaveBeenCalledWith("mockQuery");

    expect(result).toEqual([
      {
        id: "checkin123",
        elderlyUserId: "elderly123",
        status: "completed",
        timestamp: "mockTimestamp",
      },
    ]);
  });

  test("returns multiple check-ins for the elderly user", async () => {
    firestore.getDocs.mockResolvedValue({
      docs: [
        {
          id: "checkin1",
          data: () => ({
            elderlyUserId: "elderly123",
            status: "completed",
            timestamp: "time1",
          }),
        },
        {
          id: "checkin2",
          data: () => ({
            elderlyUserId: "elderly123",
            status: "completed",
            timestamp: "time2",
          }),
        },
      ],
    });

    const databaseService = new DatabaseService();

    const result = await databaseService.getCheckIns("elderly123");

    expect(result).toHaveLength(2);

    expect(result[0]).toEqual({
      id: "checkin1",
      elderlyUserId: "elderly123",
      status: "completed",
      timestamp: "time1",
    });

    expect(result[1]).toEqual({
      id: "checkin2",
      elderlyUserId: "elderly123",
      status: "completed",
      timestamp: "time2",
    });
  });

  test("returns an empty array when no check-ins exist", async () => {
    firestore.getDocs.mockResolvedValue({
      docs: [],
    });

    const databaseService = new DatabaseService();

    const result = await databaseService.getCheckIns("elderly123");

    expect(result).toEqual([]);
  });

  test("propagates Firestore errors when creating a check-in fails", async () => {
    firestore.addDoc.mockRejectedValue(new Error("Firestore write failed"));

    const databaseService = new DatabaseService();

    await expect(databaseService.createCheckIn("elderly123")).rejects.toThrow(
      "Firestore write failed",
    );
  });

  test("propagates Firestore errors when reading check-ins fails", async () => {
    firestore.getDocs.mockRejectedValue(new Error("Firestore read failed"));

    const databaseService = new DatabaseService();

    await expect(databaseService.getCheckIns("elderly123")).rejects.toThrow(
      "Firestore read failed",
    );
  });
});
