import type { User } from '../entities';
import type { IAuthRepository, LoginRequest, RegisterRequest } from '../interfaces';

export class AuthUseCases {
    private authRepo: IAuthRepository;

    constructor(authRepo: IAuthRepository) {
        this.authRepo = authRepo;
    }

    async login(credentials: LoginRequest): Promise<User> {
        if (!credentials.email.trim()) {
            throw new Error('Email is required');
        }
        if (!credentials.password) {
            throw new Error('Password is required');
        }

        const response = await this.authRepo.login(credentials);
        return response.user;
    }

    async register(userData: RegisterRequest): Promise<User> {
        this.validateRegistrationData(userData);
        const response = await this.authRepo.register(userData);
        return response.user;
    }

    async getCurrentUser(): Promise<User | null> {
        return this.authRepo.getCurrentUser();
    }

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        if (!currentPassword) {
            throw new Error('Current password is required');
        }
        if (!newPassword) {
            throw new Error('New password is required');
        }
        if (newPassword.length < 6) {
            throw new Error('New password must be at least 6 characters');
        }

        await this.authRepo.changePassword(currentPassword, newPassword);
    }

    logout(): void {
        this.authRepo.logout();
    }

    private validateRegistrationData(userData: RegisterRequest): void {
        if (!userData.username.trim()) {
            throw new Error('Username is required');
        }
        if (userData.username.length < 3) {
            throw new Error('Username must be at least 3 characters');
        }
        if (!userData.email.trim()) {
            throw new Error('Email is required');
        }
        if (!this.isValidEmail(userData.email)) {
            throw new Error('Please enter a valid email address');
        }
        if (!userData.password) {
            throw new Error('Password is required');
        }
        if (userData.password.length < 6) {
            throw new Error('Password must be at least 6 characters');
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
