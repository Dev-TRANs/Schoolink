<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import type { CommentType, ReplyType } from "../types";

    // props
    export let postUuid: string;
    export let organizationId: string;
    // 質問ページ専用：ベストアンサー機能
    export let enableBestAnswer: boolean = false;
    export let bestCommentUuid: string | null = null;
    export let onBestCommentSet: ((commentUuid: string) => void) | null = null;

    let sessionUuid: string | null = null;
    let userId: string | null = null;

    let comments: CommentType[] = [];
    let commentContent = '';
    let commentLoading = false;

    let replyContents: Record<string, string> = {};
    let replyLoading: Record<string, boolean> = {};
    let openReplies: Record<string, boolean> = {};
    let repliesMap: Record<string, ReplyType[]> = {};

    onMount(async () => {
        sessionUuid = localStorage.getItem("sessionUuid");
        userId = localStorage.getItem("userId");
        await loadComments();
    });

    async function loadComments() {
        if (!postUuid) return;
        const res = await fetch(`${PUBLIC_API_URL}/comments?postUuid=${postUuid}`);
        const data = await res.json();
        if (data.success) comments = data.data;
    }

    async function postComment() {
        if (!commentContent.trim() || !sessionUuid) return;
        commentLoading = true;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionUuid, organizationId, postUuid, content: commentContent.trim() })
            });
            const result = await res.json();
            if (result.success) {
                commentContent = '';
                await loadComments();
            }
        } finally {
            commentLoading = false;
        }
    }

    async function toggleReplies(commentUuid: string) {
        openReplies[commentUuid] = !openReplies[commentUuid];
        if (openReplies[commentUuid] && !repliesMap[commentUuid]) {
            await loadReplies(commentUuid);
        }
    }

    async function loadReplies(commentUuid: string) {
        const res = await fetch(`${PUBLIC_API_URL}/replies?commentUuid=${commentUuid}`);
        const data = await res.json();
        if (data.success) repliesMap[commentUuid] = data.data;
    }

    async function postReply(commentUuid: string) {
        const content = replyContents[commentUuid]?.trim();
        if (!content || !sessionUuid) return;
        replyLoading[commentUuid] = true;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionUuid, organizationId, commentUuid, content })
            });
            const result = await res.json();
            if (result.success) {
                replyContents[commentUuid] = '';
                await loadReplies(commentUuid);
            }
        } finally {
            replyLoading[commentUuid] = false;
        }
    }

    async function setBestComment(commentUuid: string) {
        if (onBestCommentSet) onBestCommentSet(commentUuid);
    }

    function formatDate(ts: number) {
        return new Date(ts * 1000).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
    }

    // ベストアンサーを先頭に固定したコメント一覧
    $: sortedComments = bestCommentUuid
        ? [...comments].sort((a, b) => {
            if (a.commentUuid === bestCommentUuid) return -1;
            if (b.commentUuid === bestCommentUuid) return 1;
            return 0;
          })
        : comments;
</script>

<div class="w-full mt-10">
    <h2 class="text-2xl font-bold mb-4">コメント ({comments.length})</h2>

    <!-- 投稿フォーム -->
    {#if sessionUuid}
    <div class="w-full mb-6">
        <textarea
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
            rows={3}
            placeholder="コメントを入力してください"
            bind:value={commentContent}
            disabled={commentLoading}
        ></textarea>
        <button
            class="mt-2 px-4 py-2 bg-sky-500 text-white rounded-lg text-sm hover:bg-sky-600 disabled:opacity-50"
            onclick={postComment}
            disabled={commentLoading || !commentContent.trim()}
        >
            {commentLoading ? '送信中...' : 'コメントする'}
        </button>
    </div>
    {:else}
    <p class="text-gray-500 mb-4 text-sm">
        <a class="underline text-sky-600" href="/signin">ログイン</a>するとコメントできます
    </p>
    {/if}

    <!-- コメント一覧 -->
    {#each sortedComments as comment (comment.commentUuid)}
    <div class="border rounded-xl p-4 mb-4
        {comment.commentUuid === bestCommentUuid
            ? 'border-green-400 bg-green-50'
            : 'border-gray-200'}">

        {#if comment.commentUuid === bestCommentUuid}
        <div class="flex items-center gap-1 text-green-700 text-sm font-bold mb-2">
            <span class="material-symbols-outlined text-base">verified</span>
            ベストアンサー
        </div>
        {/if}

        <div class="flex items-center gap-2 mb-2">
            <a href="/users/{comment.userId}">
                <img src={comment.userAvatar} alt="avatar" class="size-7 border border-gray-400 rounded-full" loading="lazy"/>
            </a>
            <a href="/users/{comment.userId}" class="text-sm font-medium hover:underline">{comment.userDisplayName}</a>
            <span class="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
        </div>

        <p class="whitespace-pre-line text-gray-800">{comment.content}</p>

        <div class="flex items-center gap-3 mt-3 text-sm text-gray-500">
            {#if enableBestAnswer && userId && comment.userId !== userId && comment.commentUuid !== bestCommentUuid}
            <button
                class="flex items-center gap-1 hover:text-green-600"
                onclick={() => setBestComment(comment.commentUuid)}
            >
                <span class="material-symbols-outlined text-base">verified</span>
                ベストアンサーに選ぶ
            </button>
            {/if}

            <button
                class="flex items-center gap-1 hover:text-sky-600"
                onclick={() => toggleReplies(comment.commentUuid)}
            >
                <span class="material-symbols-outlined text-base">reply</span>
                返信 {#if repliesMap[comment.commentUuid]}{repliesMap[comment.commentUuid].length}{/if}
            </button>
        </div>

        <!-- リプライ -->
        {#if openReplies[comment.commentUuid]}
        <div class="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
            {#each (repliesMap[comment.commentUuid] ?? []) as reply (reply.replyUuid)}
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <a href="/users/{reply.userId}">
                        <img src={reply.userAvatar} alt="avatar" class="size-6 border border-gray-400 rounded-full" loading="lazy"/>
                    </a>
                    <a href="/users/{reply.userId}" class="text-sm font-medium hover:underline">{reply.userDisplayName}</a>
                    <span class="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                </div>
                <p class="text-sm whitespace-pre-line text-gray-700">{reply.content}</p>
            </div>
            {/each}

            {#if sessionUuid}
            <div>
                <textarea
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-sky-500 focus:ring-2 focus:ring-sky-200 focus:outline-none"
                    rows={2}
                    placeholder="返信を入力"
                    bind:value={replyContents[comment.commentUuid]}
                    disabled={replyLoading[comment.commentUuid]}
                ></textarea>
                <button
                    class="mt-1 px-3 py-1 bg-sky-500 text-white rounded-lg text-xs hover:bg-sky-600 disabled:opacity-50"
                    onclick={() => postReply(comment.commentUuid)}
                    disabled={replyLoading[comment.commentUuid] || !replyContents[comment.commentUuid]?.trim()}
                >
                    {replyLoading[comment.commentUuid] ? '送信中...' : '返信する'}
                </button>
            </div>
            {/if}
        </div>
        {/if}
    </div>
    {/each}

    {#if comments.length === 0}
    <p class="text-gray-500 text-center mt-4">まだコメントがありません</p>
    {/if}
</div>