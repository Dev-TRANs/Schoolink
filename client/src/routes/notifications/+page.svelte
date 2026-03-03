<svelte:head>
	<title>通知 | Schoolink</title>
</svelte:head>

<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { goto } from "$app/navigation";
    import { onMount } from "svelte";
    import {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsOpened,
        markAllAsOpened
    } from "../../lib/stores/notifications";

    onMount(async () => {
        if (!localStorage.getItem("sessionUuid")) {
            goto("/signin");
            return;
        }
        await fetchNotifications(PUBLIC_API_URL);
    });

    function formatDate(ts: number) {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - ts;
        if (diff < 60) return `${diff}秒前`;
        if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
        if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}日前`;
        return new Date(ts * 1000).toLocaleDateString("ja-JP");
    }

    async function handleClick(n: { notificationUuid: string; isOpened: number; href: string | null }) {
        if (n.isOpened === 0) {
            await markAsOpened(PUBLIC_API_URL, n.notificationUuid);
        }
        if (n.href) goto(n.href);
    }

    async function handleMarkAll() {
        await markAllAsOpened(PUBLIC_API_URL);
    }
</script>

<div class="w-full max-w-2xl mx-auto px-5 pb-20">
    <div class="flex items-center justify-between mt-8 mb-6">
        <h1 class="text-3xl font-bold">通知</h1>
        {#if $unreadCount > 0}
        <button
            onclick={handleMarkAll}
            class="text-sm text-sky-600 hover:underline"
        >
            すべて既読にする
        </button>
        {/if}
    </div>

    {#if $notifications.length === 0}
        <div class="flex flex-col items-center justify-center mt-20 text-gray-400 gap-3">
            <span class="material-symbols-outlined text-6xl">notifications_off</span>
            <p class="text-lg">通知はありません</p>
        </div>
    {:else}
        <ul class="space-y-2">
            {#each $notifications as n (n.notificationUuid)}
            <li>
                <button
                    onclick={() => handleClick(n)}
                    class="w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl border transition
                        {n.isOpened === 0
                            ? 'bg-sky-50 border-sky-200 hover:bg-sky-100'
                            : 'bg-white border-gray-100 hover:bg-gray-50'}"
                >
                    <!-- 未読ドット -->
                    <span class="mt-1.5 shrink-0 size-2 rounded-full {n.isOpened === 0 ? 'bg-sky-500' : 'bg-transparent'}"></span>

                    <div class="flex-1 min-w-0">
                        <p class="text-sm text-gray-800 {n.isOpened === 0 ? 'font-semibold' : ''}">
                            {n.content}
                        </p>
                        <p class="text-xs text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                    </div>

                    {#if n.href}
                    <span class="material-symbols-outlined text-gray-400 text-base shrink-0 mt-0.5">arrow_forward_ios</span>
                    {/if}
                </button>
            </li>
            {/each}
        </ul>
    {/if}
</div>
