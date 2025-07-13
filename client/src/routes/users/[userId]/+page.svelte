<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import type { UserType, ProjectType, EventType, PollType } from "../../../lib/types";

    let user = $state<UserType>();

    const userId = $page.params.userId;

    let projects = $state<ProjectType[]>([])

    let events = $state<EventType[]>([])

    let polls = $state<PollType[]>([])

    onMount(async() => {
        const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
        const data = await response.json();
        user = data.data;
        const projectResponce = await fetch(`${PUBLIC_API_URL}/projects?userId=${userId}`);
        const projectData = await projectResponce.json();
        projects = projectData.data;
        const eventResponce = await fetch(`${PUBLIC_API_URL}/events?userId=${userId}`);
        const eventData = await eventResponce.json();
        events = eventData.data;
        const pollResponce = await fetch(`${PUBLIC_API_URL}/polls?userId=${userId}`);
        const pollData = await pollResponce.json();
        polls = pollData.data;
    })
</script>

{#if user}
<div class="w-full flex flex-col items-center px-5 sm:px-10 py-8 space-y-10">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl items-center">
        <img class="rounded-full border border-gray-400 aspect-square w-32 h-32 mx-auto sm:mx-0" src={user.avatar} alt="avatar" loading="lazy"/>
        <div class="sm:col-span-2 flex flex-col justify-center space-y-2 text-center sm:text-left">
            <p class="text-3xl font-bold">{user.displayName}</p>
            <p class="text-gray-500 text-md">
                ID: <span class="bg-gray-100 px-2 py-0.5 rounded">{user.userId}</span>
            </p>
            <p class="text-md text-gray-500">
                所属: 
                <a class="hover:underline text-black" href="/organizations/{user.organizationId}">
                    {user.organizationDisplayName}
                </a>
            </p>
            {#if user.twitterId || user.instagramId || user.threadsId}
            <div class="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-500">
                <span>SNS:</span>
                {#if user.twitterId}
                <a class="hover:underline text-blue-500" href="https://x.com/{user.twitterId}">Twitter</a>
                {/if}
                {#if user.instagramId}
                <a class="hover:underline text-pink-500" href="https://www.instagram.com/{user.instagramId}">Instagram</a>
                {/if}
                {#if user.threadsId}
                <a class="hover:underline text-purple-500" href="https://www.threads.net/@{user.threadsId}">Threads</a>
                {/if}
            </div>
            {/if}
        </div>
        {#if user.bio}
        <div class="col-span-full whitespace-pre-line text-gray-700 text-center sm:text-left">{user.bio}</div>
        {/if}
    </div>

    {#each [
        { label: "プロジェクト", items: projects, type: "projects", idKey: "projectId" },
        { label: "イベント", items: events, type: "projects", idKey: "eventId" },
        { label: "投票", items: polls, type: "polls", idKey: "pollId" }
    ] as section}
    <div class="w-full max-w-6xl">
        <h2 class="text-2xl font-bold text-center mb-4">{section.label}</h2>
        {#if section.items.length > 0}
        <div class="flex overflow-x-auto space-x-6 px-1 sm:px-0">
            {#each section.items as item}
            <a href={`/${section.type}/${item[section.idKey]}`}>
                <div class="min-w-[16rem] max-w-[18rem]">
                    <img
                        class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 border border-gray-500"
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
        {:else}
        <p class="text-gray-500 text-center mt-4">まだ{section.label}がありません</p>
        {/if}
    </div>
    {/each}
</div>
{/if}
