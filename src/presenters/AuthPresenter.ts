import { AuthService } from "../services/AuthService";

export class AuthPresenter {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async login(email: string, password: string) {
    return await this.authService.login(email, password);
  }

  async logout() {
    await this.authService.logout();
  }
}
