import { beforeEach, describe, expect, jest, test } from "@jest/globals";

/* --------------------------------------------------
   Mock functions
-------------------------------------------------- */

const mockAddDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockServerTimestamp = jest.fn();
const mockWhere = jest.fn();
const mockUpdateDoc = jest.fn();

/* --------------------------------------------------
   Mock Firestore
-------------------------------------------------- */

jest.mock("firebase/firestore", () => ({
  addDoc: mockAddDoc,
  collection: mockCollection,
  doc: mockDoc,
  getDoc: mockGetDoc,
  getDocs: mockGetDocs,
  query: mockQuery,
  serverTimestamp: mockServerTimestamp,
  where: mockWhere,
  updateDoc: mockUpdateDoc,
}));

/* --------------------------------------------------
   Mock Firebase config
-------------------------------------------------- */

jest.mock("../src/config/firebase", () => ({
  db: {},
}));

/* --------------------------------------------------
   Load DatabaseService after mocks
-------------------------------------------------- */

const { DatabaseService } = require("../src/services/DatabaseService");

/* --------------------------------------------------
   Tests
-------------------------------------------------- */

describe("DatabaseService", () => {
  let databaseService: InstanceType<typeof DatabaseService>;

  beforeEach(() => {
    jest.clearAllMocks();

    databaseService = new DatabaseService();

    mockCollection.mockReturnValue("collection-reference");

    mockQuery.mockReturnValue("query-reference");

    mockDoc.mockReturnValue("document-reference");

    mockServerTimestamp.mockReturnValue("server-timestamp");
  });

  /* ==================================================
     Check-ins
  ================================================== */

  test("creates a completed check-in", async () => {
    mockAddDoc.mockResolvedValue({
      id: "checkin123",
    });

    const result = await databaseService.createCheckIn("elderly123");

    expect(mockCollection).toHaveBeenCalledWith({}, "checkIns");

    expect(mockAddDoc).toHaveBeenCalledWith("collection-reference", {
      elderlyUserId: "elderly123",
      status: "completed",
      timestamp: "server-timestamp",
    });

    expect(result).toBe("checkin123");
  });

  test("retrieves check-ins for an elderly user", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "checkin1",

          data: () => ({
            elderlyUserId: "elderly123",

            status: "completed",
          }),
        },
      ],
    });

    const result = await databaseService.getCheckIns("elderly123");

    expect(mockWhere).toHaveBeenCalledWith("elderlyUserId", "==", "elderly123");

    expect(result).toEqual([
      {
        id: "checkin1",
        elderlyUserId: "elderly123",
        status: "completed",
      },
    ]);
  });

  /* ==================================================
     Reminder schedule retrieval
  ================================================== */

  test("retrieves reminder schedule for an elderly user", async () => {
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: "reminder1",

          data: () => ({
            elderlyUserId: "elderly123",

            times: ["08:00", "18:00"],
          }),
        },
      ],
    });

    const result = await databaseService.getReminderSchedule("elderly123");

    expect(mockWhere).toHaveBeenCalledWith("elderlyUserId", "==", "elderly123");

    expect(result).toEqual([
      {
        id: "reminder1",
        elderlyUserId: "elderly123",
        times: ["08:00", "18:00"],
      },
    ]);
  });

  /* ==================================================
     Caregiver linking
  ================================================== */

  test("returns linked elderly user ID for caregiver", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,

      data: () => ({
        name: "Test Caregiver",

        role: "caregiver",

        elderlyUserId: "elderly123",
      }),
    });

    const result = await databaseService.getLinkedElderlyUserId("caregiver123");

    expect(mockDoc).toHaveBeenCalledWith({}, "users", "caregiver123");

    expect(mockGetDoc).toHaveBeenCalledWith("document-reference");

    expect(result).toBe("elderly123");
  });

  test("returns null when caregiver has no linked elderly user", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,

      data: () => ({
        name: "Test Caregiver",

        role: "caregiver",
      }),
    });

    const result = await databaseService.getLinkedElderlyUserId("caregiver123");

    expect(result).toBeNull();
  });

  test("returns null when caregiver document does not exist", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result =
      await databaseService.getLinkedElderlyUserId("missing-caregiver");

    expect(result).toBeNull();
  });

  /* ==================================================
     User profile
  ================================================== */

  test("retrieves an elderly user profile", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,

      id: "elderly123",

      data: () => ({
        name: "Mary Smith",

        email: "mary@example.com",

        role: "elderly",
      }),
    });

    const result = await databaseService.getUserProfile("elderly123");

    expect(mockDoc).toHaveBeenCalledWith({}, "users", "elderly123");

    expect(result).toEqual({
      id: "elderly123",
      name: "Mary Smith",
      email: "mary@example.com",
      role: "elderly",
    });
  });

  test("returns null when user profile does not exist", async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => false,
    });

    const result = await databaseService.getUserProfile("missing-user");

    expect(result).toBeNull();
  });

  /* ==================================================
     Save reminder schedule
  ================================================== */

  test("updates existing reminder schedule", async () => {
    mockGetDocs.mockResolvedValue({
      empty: false,

      docs: [
        {
          id: "reminder1",
        },
      ],
    });

    mockUpdateDoc.mockResolvedValue(undefined);

    const result = await databaseService.saveReminderSchedule("elderly123", [
      "08:00",
      "12:00",
      "18:00",
    ]);

    expect(mockUpdateDoc).toHaveBeenCalledWith("document-reference", {
      times: ["08:00", "12:00", "18:00"],
    });

    expect(result).toBe("reminder1");
  });

  test("creates reminder schedule when none exists", async () => {
    mockGetDocs.mockResolvedValue({
      empty: true,
      docs: [],
    });

    mockAddDoc.mockResolvedValue({
      id: "reminder123",
    });

    const result = await databaseService.saveReminderSchedule("elderly123", [
      "09:00",
      "17:00",
    ]);

    expect(mockAddDoc).toHaveBeenCalledWith("collection-reference", {
      elderlyUserId: "elderly123",

      times: ["09:00", "17:00"],
    });

    expect(result).toBe("reminder123");
  });
});
