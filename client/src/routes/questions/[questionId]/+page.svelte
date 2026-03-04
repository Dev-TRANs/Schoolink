<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import type { QuestionType } from "../../../lib/types";
    import SubscribeButton from "../../../lib/components/SubscribeButton.svelte";
    import CommentSection from "../../../lib/components/CommentSection.svelte";
    import ConfirmDialog from "../../../lib/components/ConfirmDialog.svelte";
    import SkeletonDetail from "../../../lib/components/SkeletonDetail.svelte";

    const questionId = $page.params.questionId;

    let question = $state<QuestionType>();
    let userId = $state<string | null>(null);
    let sessionUuid = $state<string | null>(null);
    let organizationId = $state<string>('');
    let bestCommentUuid = $state<string | null>(null);
    let loading = $state(true);
    let showDeleteDialog = $state(false);

    onMount(async () => {
        userId = localStorage.getItem("userId");
        sessionUuid = localStorage.getItem("sessionUuid");

        const response = await fetch(`${PUBLIC_API_URL}/questions/${questionId}`);
        const data = await response.json();
        if (!data.success) { goto("/questions"); return; }
        question = data.data;
        bestCommentUuid = question.bestCommentUuid;
        loading = false;

        if (sessionUuid) {
            const userRes = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
            const userData = await userRes.json();
            organizationId = userData.data?.organizationId ?? '';
        }
    });

    async function setBestComment(commentUuid: string) {
        if (!sessionUuid || question?.userId !== userId) return;
        const res = await fetch(`${PUBLIC_API_URL}/questions/${questionId}/best_comment`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionUuid, commentUuid })
        });
        const result = await res.json();
        if (result.success) bestCommentUuid = commentUuid;
    }

    async function removeQuestion() {
        if (!sessionUuid) return;
        await fetch(`${PUBLIC_API_URL}/questions/${questionId}/is_valid`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionUuid })
        });
        goto("/questions");
    }
</script>
<svelte:head>
    <title>{question ? question.title + " | 質問 | Schoolink" : "読み込み中… | 質問 | Schoolink"}</title>
</svelte:head>

{#if loading}
    <SkeletonDetail />
{:else if question}
<div class="w-full flex items-center flex-col max-w-2xl mx-auto px-5 pb-20">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/questions">＜ 質問</a>
    <h1 class="text-3xl font-bold mt-8">{question.title}</h1>

    <div class="flex items-center gap-1 mt-2">
        <a href="/users/{question.userId}">
            <img src={question.userAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-full aspect-square" loading="lazy"/>
        </a>
        <a href="/users/{question.userId}" class="text-sm hover:underline">{question.userDisplayName}</a>
        <p class="text-gray-500 text-sm">in</p>
        <a href="/organizations/{question.organizationId}">
            <img src={question.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-md aspect-square" loading="lazy"/>
        </a>
        <a href="/organizations/{question.organizationId}" class="text-sm hover:underline truncate">{question.organizationDisplayName}</a>
    </div>

    <img src={question.thumbnail} class="rounded-2xl mt-5 w-full aspect-4/3 object-cover" alt="thumbnail" loading="lazy"/>

    {#if question.description}
    <div class="w-full bg-slate-100 mt-8 rounded-2xl p-5 whitespace-pre-line">
        {question.description}
    </div>
    {/if}

    <div class="w-full flex items-center justify-between mt-6">
        <SubscribeButton postType="question" postId={question.questionId} postUuid={question.postUuid} />
        {#if question.userId === userId}
        <div class="flex items-center gap-3">
            <a class="button-violet" href="/questions/{question.questionId}/edit">編集</a>
            <button class="button-red" onclick={() => showDeleteDialog = true}>削除</button>
        </div>
        {/if}
    </div>

    <CommentSection
        postUuid={question.postUuid}
        {organizationId}
        enableBestAnswer={question.userId === userId}
        {bestCommentUuid}
        onBestCommentSet={setBestComment}
    />
</div>
{/if}

<ConfirmDialog
    open={showDeleteDialog}
    title="質問を削除"
    message="「{question?.title}」を削除しますか？この操作は取り消せません。"
    onConfirm={removeQuestion}
    onCancel={() => showDeleteDialog = false}
/>