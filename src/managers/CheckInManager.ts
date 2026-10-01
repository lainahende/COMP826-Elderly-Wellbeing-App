import { DatabaseService } from "../services/DatabaseService";

export class CheckInManager {
  private databaseService: DatabaseService;

  constructor() {
    this.databaseService = new DatabaseService();
  }

  async completeCheckIn(elderlyUserId: string) {
    return await this.databaseService.createCheckIn(elderlyUserId);
  }
}
