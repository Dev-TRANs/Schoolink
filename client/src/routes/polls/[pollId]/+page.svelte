<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import { get } from "svelte/store";
    import type { PollType } from "../../../lib/types";
    import SubscribeButton from "../../../lib/components/SubscribeButton.svelte";
    import CommentSection from "../../../lib/components/CommentSection.svelte";
    import ConfirmDialog from "../../../lib/components/ConfirmDialog.svelte";
    import SkeletonDetail from "../../../lib/components/SkeletonDetail.svelte";

    const pollId = get(page).params.pollId;

    let poll = $state<PollType | null>(null);
    let userIds: { sessionUuid: string | null; clientUuid: string | null };
    let selectedChoice = $state<string | null>(null);
    let userId = $state<string | null>(null);
    let organizationId = $state<string>('');
    let loading = $state(true);
    let showDeleteDialog = $state(false);

    onMount(async () => {
        userId = localStorage.getItem("userId");
        const sessionUuid = localStorage.getItem("sessionUuid");
        userIds = {
            sessionUuid,
            clientUuid: localStorage.getItem("clientUuid")
        };
        await loadPollData();
        await loadUserVote();
        loading = false;

        if (sessionUuid) {
            const userRes = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
            const userData = await userRes.json();
            organizationId = userData.data?.organizationId ?? '';
        }
    });

    async function loadPollData() {
        const res = await fetch(`${PUBLIC_API_URL}/polls/${pollId}`);
        const data = await res.json();
        if (!data.success) { goto("/"); return; }
        poll = data.data;
    }

    async function loadUserVote() {
        const res = await fetch(`${PUBLIC_API_URL}/polls/${pollId}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userIds)
        });
        const data = await res.json();
        if (data.success && data.data?.choiceName) {
            selectedChoice = data.data.choiceName;
        }
    }

    async function vote(choiceName: string) {
        if (!userIds) return;
        const res = await fetch(`${PUBLIC_API_URL}/polls/${pollId}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ choiceName, ...userIds })
        });
        const result = await res.json();
        if (result.success) {
            selectedChoice = choiceName;
            await loadPollData();
        }
    }

    async function removePoll() {
        const sessionUuid = localStorage.getItem("sessionUuid");
        await fetch(`${PUBLIC_API_URL}/polls/${pollId}/is_valid`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionUuid })
        });
        goto("/polls");
    }

    function totalVotes(choices: Array<{ name: string; count: number }>) {
        return choices.reduce((sum, c) => sum + c.count, 0);
    }
</script>
<svelte:head>
    <title>{poll ? poll.title + " | 投票 | Schoolink" : "読み込み中… | 投票 | Schoolink"}</title>
</svelte:head>

{#if loading}
    <SkeletonDetail />
{:else if poll}
<div class="w-full flex items-center flex-col max-w-2xl mx-auto px-5 pb-20">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/polls">＜ 投票</a>
    <h1 class="text-3xl font-bold text-center mt-8">{poll.title}</h1>

    <div class="flex items-center gap-1 mt-2">
        <a href="/users/{poll.userId}">
            <img src={poll.userAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-full" loading="lazy"/>
        </a>
        <a href="/users/{poll.userId}" class="text-sm hover:underline">{poll.userDisplayName}</a>
        <p class="text-gray-500 text-sm">in</p>
        <a href="/organizations/{poll.organizationId}">
            <img src={poll.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-md" loading="lazy"/>
        </a>
        <a href="/organizations/{poll.organizationId}" class="text-sm hover:underline">{poll.organizationDisplayName}</a>
    </div>

    {#if poll.thumbnail}
        <img src={poll.thumbnail} class="rounded-2xl mt-5 w-full aspect-[4/3]" alt="thumbnail" loading="lazy"/>
    {/if}

    {#if poll.description}
        <div class="w-full bg-slate-100 mt-8 rounded-2xl p-5 whitespace-pre-line">
            {poll.description}
        </div>
    {/if}

    <div class="mt-5 w-full">
        {#each poll.pollChoices as choice}
        {@const total = totalVotes(poll.pollChoices)}
        {@const pct = total > 0 ? Math.round((choice.count / total) * 100) : 0}
        <button
            onclick={() => vote(choice.name)}
            class="w-full border rounded-lg p-3 my-2 text-left transition relative overflow-hidden
                {selectedChoice === choice.name ? 'border-sky-500 font-bold' : 'hover:bg-sky-50 border-gray-300'}"
        >
            {#if selectedChoice}
            <span
                class="absolute inset-0 {selectedChoice === choice.name ? 'bg-sky-100' : 'bg-gray-100'} transition-all"
                style="width: {pct}%"
            ></span>
            {/if}
            <span class="relative flex justify-between items-center">
                <span>{choice.name}</span>
                <span class="text-sm text-gray-500">{choice.count}票 {selectedChoice ? `(${pct}%)` : ''}</span>
            </span>
        </button>
        {/each}
        {#if selectedChoice}
        <p class="text-xs text-gray-400 text-right mt-1">合計 {totalVotes(poll.pollChoices)} 票</p>
        {/if}
    </div>

    <div class="w-full flex items-center justify-between mt-6">
        <SubscribeButton postType="poll" postId={poll.pollId} postUuid={poll.postUuid} />
        {#if poll.userId === userId}
        <div class="flex items-center gap-3">
            <a class="button-violet" href="/polls/{poll.pollId}/edit">編集</a>
            <button class="button-red" onclick={() => showDeleteDialog = true}>削除</button>
        </div>
        {/if}
    </div>

    <CommentSection postUuid={poll.postUuid} {organizationId} />
</div>
{/if}

<ConfirmDialog
    open={showDeleteDialog}
    title="投票を削除"
    message="「{poll?.title}」を削除しますか？この操作は取り消せません。"
    onConfirm={removePoll}
    onCancel={() => showDeleteDialog = false}
/>