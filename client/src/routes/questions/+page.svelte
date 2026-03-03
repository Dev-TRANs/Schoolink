<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import Fuse from 'fuse.js';
    import type { QuestionType } from "../../lib/types";

    let questions = $state<QuestionType[]>([]);
    let filteredQuestions = $state<QuestionType[]>([]);
    let searchQuery = $state<string>('');
    let fuse: Fuse<QuestionType>;

    onMount(async () => {
        const response = await fetch(`${PUBLIC_API_URL}/questions`);
        const data = await response.json();
        questions = data.data;
        filteredQuestions = questions;

        fuse = new Fuse(questions, {
            keys: ['title', 'description', 'userDisplayName', 'organizationDisplayName'],
            threshold: 0.4,
            ignoreLocation: true
        });
    });

    function handleSearch(event: Event) {
        const target = event.target as HTMLInputElement;
        searchQuery = target.value;

        if (searchQuery.trim() === '') {
            filteredQuestions = questions;
        } else {
            const results = fuse.search(searchQuery);
            filteredQuestions = results.map(result => result.item);
        }
    }
</script>

<div class="mx-5">
    <p class="text-normal">
        <a href="/about" class="underline text-sky-600">つながる学生のためのプラットフォーム、Schoolinkを知る→</a>
    </p>
    <h1 class="mt-3 text-4xl font-bold">質問</h1>
    <input
        class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
        placeholder="質問を検索…"
        type="search"
        value={searchQuery}
        oninput={handleSearch}
    />
    {#if searchQuery && filteredQuestions.length === 0}
        <p class="text-center text-2xl w-full mt-5">「{searchQuery}」の検索結果はありません</p>
    {/if}
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
        {#if !searchQuery}
        <a href="/questions/create">
            <div class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200">
                ＋
            </div>
            <p class="text-xl w-full text-center mt-2">新規作成</p>
        </a>
        {/if}

        {#each filteredQuestions as question}
        <a href="/questions/{question.questionId}">
            <div>
                <img
                    class="aspect-4/3 rounded-xl bg-gray-200 border border-gray-500 object-cover w-full"
                    src={question.thumbnail}
                    alt="thumbnail"
                    loading="lazy"
                />
                <p class="text-xl w-full text-left mt-2 truncate">{question.title}</p>
                {#if question.bestCommentUuid}
                    <span class="inline-block text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 mt-1">ベストアンサーあり</span>
                {/if}
                <div class="flex items-center gap-1 mt-2">
                    <img src={question.userAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-full aspect-square" loading="lazy"/>
                    <p class="text-sm">{question.userDisplayName}</p>
                    <p class="text-gray-500 text-sm">in</p>
                    <img src={question.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-md aspect-square" loading="lazy"/>
                    <p class="text-sm truncate">{question.organizationDisplayName}</p>
                </div>
            </div>
        </a>
        {/each}
    </div>
</div>
