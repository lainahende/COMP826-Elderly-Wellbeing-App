import { beforeEach, describe, expect, jest, test } from "@jest/globals";

import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { DatabaseService } from "../src/services/DatabaseService";

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

const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;

const mockCollection = collection as jest.MockedFunction<typeof collection>;

const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

const mockQuery = query as jest.MockedFunction<typeof query>;

const mockServerTimestamp = serverTimestamp as jest.MockedFunction<
  typeof serverTimestamp
>;

const mockWhere = where as jest.MockedFunction<typeof where>;

describe("DatabaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockCollection.mockReturnValue("mockCollection" as any);

    mockQuery.mockReturnValue("mockQuery" as any);

    mockWhere.mockReturnValue("mockWhere" as any);

    mockServerTimestamp.mockReturnValue("mockTimestamp" as any);
  });

  test("creates a check-in for an elderly user", async () => {
    mockAddDoc.mockResolvedValue({
      id: "checkin123",
    } as any);

    const databaseService = new DatabaseService();

    const result = await databaseService.createCheckIn("elderly123");

    expect(result).toBe("checkin123");
  });

  test("queries check-ins belonging to elderly user", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "checkin123",
          data: () => ({
            elderlyUserId: "elderly123",
            status: "completed",
          }),
        },
      ],
    } as any);

    const databaseService = new DatabaseService();

    const result = await databaseService.getCheckIns("elderly123");

    expect(mockWhere).toHaveBeenCalledWith("elderlyUserId", "==", "elderly123");

    expect(mockQuery).toHaveBeenCalledWith("mockCollection", "mockWhere");

    expect(mockGetDocs).toHaveBeenCalledWith("mockQuery");

    expect(result).toEqual([
      {
        id: "checkin123",
        elderlyUserId: "elderly123",
        status: "completed",
      },
    ]);
  });

  test("retrieves reminder schedule for elderly user", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "reminder1",
          data: () => ({
            elderlyUserId: "elderly123",
            times: ["08:00", "10:00", "18:00"],
          }),
        },
      ],
    } as any);

    const databaseService = new DatabaseService();

    const result = await databaseService.getReminderSchedule("elderly123");

    expect(mockWhere).toHaveBeenCalledWith("elderlyUserId", "==", "elderly123");

    expect(result).toEqual([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "10:00", "18:00"],
      },
    ]);
  });
});
