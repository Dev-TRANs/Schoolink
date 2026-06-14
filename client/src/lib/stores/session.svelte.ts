import { PUBLIC_API_URL } from '$env/static/public';
import type { UserType } from '$lib/types';

const isBrowser = typeof window !== 'undefined';

class SessionManager {
    sessionUuid = $state<string | null>(null);
    userId = $state<string | null>(null);
    user = $state<UserType | null>(null);
    initialized = $state(false);
    apiUrl: string;

    constructor(apiUrl: string = PUBLIC_API_URL) {
        this.apiUrl = apiUrl;
        if (isBrowser) {
            this.sessionUuid = localStorage.getItem('sessionUuid');
            this.userId = localStorage.getItem('userId');
        }
    }

    // セッション情報をローカルストレージとメモリに保存
    setSession(sessionUuid: string, userId: string) {
        this.sessionUuid = sessionUuid;
        this.userId = userId;
        if (isBrowser) {
            localStorage.setItem('sessionUuid', sessionUuid);
            localStorage.setItem('userId', userId);
        }
    }

    // セッション情報をローカルストレージとメモリから消去
    clearSession() {
        this.sessionUuid = null;
        this.userId = null;
        this.user = null;
        if (isBrowser) {
            localStorage.removeItem('sessionUuid');
            localStorage.removeItem('userId');
        }
    }

    // ユーザー情報を手動で設定
    setUser(user: UserType | null) {
        this.user = user;
    }

    // APIサーバーで現在のセッションの有効性を確認
    async checkSession(): Promise<boolean> {
        if (!isBrowser) return false;

        const currentSessionUuid = this.sessionUuid;
        const currentUserId = this.userId;

        if (!currentUserId || !currentSessionUuid) {
            this.clearSession();
            this.initialized = true;
            return false;
        }

        try {
            const sessionResponse = await fetch(`${this.apiUrl}/auth/session_check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionUuid: currentSessionUuid, userId: currentUserId })
            });

            if (!sessionResponse.ok) {
                await this.handleSignOutAPI(currentSessionUuid);
                return false;
            }

            const sessionData = await sessionResponse.json();

            if (sessionData.isValid) {
                const response = await fetch(`${this.apiUrl}/users/${currentUserId}`);
                if (response.ok) {
                    const data = await response.json();
                    this.user = data.data;
                    this.initialized = true;
                    return true;
                }
            }

            // セッションが無効な場合、APIでサインアウトしローカルセッションを消去
            await this.handleSignOutAPI(currentSessionUuid);
            return false;
        } catch (e) {
            console.error('Session check failed:', e);
            this.initialized = true;
            return !!this.sessionUuid;
        }
    }

    // APIのsignOutエンドポイントを呼び出し、ローカルセッションをクリーンアップ
    async signOut() {
        const currentSessionUuid = this.sessionUuid;
        if (currentSessionUuid) {
            await this.handleSignOutAPI(currentSessionUuid);
        } else {
            this.clearSession();
        }
    }

    private async handleSignOutAPI(sessionUuid: string) {
        try {
            await fetch(`${this.apiUrl}/auth/sign_out`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionUuid })
            });
        } catch (e) {
            console.error('Sign out API request failed:', e);
        }
        this.clearSession();
        this.initialized = true;
    }
}

export const sessionManager = new SessionManager();
