import { writable, derived } from 'svelte/store';

export type NotificationType = {
    notificationUuid: string;
    userUuid: string;
    content: string;
    href: string | null;
    isOpened: 0 | 1;
    createdAt: number;
    isValid: 0 | 1;
};

export const notifications = writable<NotificationType[]>([]);

// 未読通知数
export const unreadCount = derived(
    notifications,
    ($notifications) => $notifications.filter(n => n.isOpened === 0).length
);

// 通知を取得してストアに格納
export async function fetchNotifications(apiUrl: string) {
    const sessionUuid = localStorage.getItem('sessionUuid');
    if (!sessionUuid) {
        notifications.set([]);
        return;
    }
    try {
        const res = await fetch(`${apiUrl}/notifications/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionUuid })
        });
        const data = await res.json();
        if (data.success) {
            notifications.set(
                [...data.data].sort((a: NotificationType, b: NotificationType) => b.createdAt - a.createdAt)
            );
        }
    } catch (e) {
        // ネットワークエラー等は無視
    }
}

// 通知を既読にしてストアも更新
export async function markAsOpened(apiUrl: string, notificationUuid: string) {
    const sessionUuid = localStorage.getItem('sessionUuid');
    if (!sessionUuid) return;
    try {
        await fetch(`${apiUrl}/notifications/${notificationUuid}/is_opened`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionUuid })
        });
        notifications.update(ns =>
            ns.map(n =>
                n.notificationUuid === notificationUuid
                    ? { ...n, isOpened: 1 as const }
                    : n
            )
        );
    } catch (e) {}
}

// 全通知を既読にする
export async function markAllAsOpened(apiUrl: string) {
    const sessionUuid = localStorage.getItem('sessionUuid');
    if (!sessionUuid) return;
    let current: NotificationType[] = [];
    const unsub = notifications.subscribe(v => { current = v; });
    unsub();
    const unread = current.filter(n => n.isOpened === 0);
    await Promise.all(unread.map(n => markAsOpened(apiUrl, n.notificationUuid)));
}

// ポーリング管理
let _pollingTimer: ReturnType<typeof setInterval> | null = null;
let _pollingApiUrl = '';

export function startPolling(apiUrl: string, intervalMs = 30000) {
    _pollingApiUrl = apiUrl;
    stopPolling();
    _pollingTimer = setInterval(() => {
        if (localStorage.getItem('sessionUuid')) {
            fetchNotifications(_pollingApiUrl);
        } else {
            stopPolling();
        }
    }, intervalMs);

    // タブが非アクティブ→アクティブに戻ったときも即取得
    if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', _onVisible);
        document.addEventListener('visibilitychange', _onVisible);
    }
}

export function stopPolling() {
    if (_pollingTimer !== null) {
        clearInterval(_pollingTimer);
        _pollingTimer = null;
    }
}

function _onVisible() {
    if (document.visibilityState === 'visible' && localStorage.getItem('sessionUuid')) {
        fetchNotifications(_pollingApiUrl);
    }
}