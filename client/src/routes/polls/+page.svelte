<svelte:head>
	<title>投票 | Schoolink</title>
</svelte:head>

<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import Fuse from 'fuse.js';
    import type { PollType } from "../../lib/types";
   
    let items = $state<PollType[]>([]);
    let filtered = $state<PollType[]>([]);
    let searchQuery = $state<string>('');
    let fuse: Fuse<PollType>;
    let loading = $state(true);
   
    onMount(async () => {
        const response = await fetch(`${PUBLIC_API_URL}/polls`);
        const data = await response.json();
        items = data.data;
        filtered = items;
        fuse = new Fuse(items, {
            keys: ['title', 'description', 'userDisplayName', 'organizationDisplayName'],
            threshold: 0.4,
            ignoreLocation: true
        });
        loading = false;
    });
   
    function handleSearch(event: Event) {
        const target = event.target as HTMLInputElement;
        searchQuery = target.value;
        if (searchQuery.trim() === '') {
            filtered = items;
        } else {
            filtered = fuse.search(searchQuery).map(r => r.item);
        }
    }
</script>
   
<div class="mx-5">
    <p class="text-normal">
        <a href="/about" class="underline text-sky-600">つながる学生のためのプラットフォーム、Schoolinkを知る→</a>
    </p>
    <h1 class="mt-3 text-4xl font-bold">投票</h1>
    <input
        class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
        placeholder="投票を検索…"
        type="search"
        value={searchQuery}
        oninput={handleSearch}
    />
    {#if searchQuery && filtered.length === 0}
    <p class="text-center text-2xl w-full mt-5">「{searchQuery}」の検索結果はありません</p>
    {/if}

    {#if loading}
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6 animate-pulse">
        {#each [1,2,3,4,5,6] as _}
        <div>
            <div class="aspect-[4/3] rounded-xl bg-gray-200"></div>
            <div class="h-5 bg-gray-200 rounded mt-2 w-3/4"></div>
            <div class="h-4 bg-gray-200 rounded mt-2 w-1/2"></div>
        </div>
        {/each}
    </div>
    {:else}
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
        {#if !searchQuery}
        <a href="/polls/create">
            <div class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200">＋</div>
            <p class="text-xl w-full text-center mt-2">新規作成</p>
        </a>
        {/if}

        {#each filtered as item}
        <a href="/polls/{item.pollId}">
            <div>
                <img
                    class="aspect-4/3 rounded-xl bg-gray-200 border border-gray-500 object-cover w-full"
                    src={item.thumbnail}
                    alt="thumbnail"
                    loading="lazy"
                />
                <p class="text-xl w-full text-left mt-2 truncate">{item.title}</p>
                <div class="flex items-center gap-1 mt-2">
                    <img src={item.userAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-full aspect-square" loading="lazy"/>
                    <p class="text-sm">{item.userDisplayName}</p>
                    <p class="text-gray-500 text-sm">in</p>
                    <img src={item.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-md aspect-square" loading="lazy"/>
                    <p class="text-sm truncate">{item.organizationDisplayName}</p>
                </div>
            </div>
        </a>
        {/each}
    </div>
    {/if}
</div>