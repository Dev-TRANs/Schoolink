<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";

    export let postType: "project" | "event" | "poll" | "question";
    export let postId: string;
    // postUuid が分かれば subscription の照合に使う（subscriptions/query の postUuid と比較）
    export let postUuid: string = "";

    let subscribed = false;
    let loading = false;
    let sessionUuid: string | null = null;

    onMount(async () => {
        sessionUuid = localStorage.getItem("sessionUuid");
        if (!sessionUuid || !postUuid) return;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/notifications/subscriptions/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionUuid })
            });
            const data = await res.json();
            if (data.success) {
                subscribed = data.data.some(
                    (s: { postUuid: string; isValid: number }) =>
                        s.postUuid === postUuid && s.isValid === 1
                );
            }
        } catch (e) {}
    });

    async function toggle() {
        if (!sessionUuid) return;
        loading = true;
        try {
            if (!subscribed) {
                // 新規サブスクリプション登録
                const res = await fetch(`${PUBLIC_API_URL}/notifications/subscriptions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionUuid, postType, postId })
                });
                const data = await res.json();
                if (data.success) subscribed = true;
            } else {
                // サブスクリプション切り替え（有効↔無効）
                const res = await fetch(
                    `${PUBLIC_API_URL}/notifications/subscriptions/${postType}/${postId}/is_valid`,
                    {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sessionUuid })
                    }
                );
                const data = await res.json();
                if (data.success) subscribed = false;
            }
        } catch (e) {
        } finally {
            loading = false;
        }
    }
</script>

{#if sessionUuid}
<button
    onclick={toggle}
    disabled={loading}
    title={subscribed ? '通知をオフにする' : '通知をオンにする'}
    class="flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm transition
        {subscribed
            ? 'border-sky-400 bg-sky-50 text-sky-700 hover:bg-sky-100'
            : 'border-gray-300 text-gray-500 hover:bg-gray-50'}
        disabled:opacity-50"
>
    <span class="material-symbols-outlined text-base leading-none">
        {subscribed ? 'notifications_active' : 'notifications'}
    </span>
    {subscribed ? '通知オン' : '通知オフ'}
</button>
{/if}
