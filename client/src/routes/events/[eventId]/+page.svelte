<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import type { EventType } from "../../../lib/types";
    import SubscribeButton from "../../../lib/components/SubscribeButton.svelte";
    import CommentSection from "../../../lib/components/CommentSection.svelte";

    const eventId = $page.params.eventId;

    let event = $state<EventType>();
    let userId = $state<string | null>(null);
    let organizationId = $state<string>('');

    onMount(async () => {
        userId = localStorage.getItem("userId");
        const sessionUuid = localStorage.getItem("sessionUuid");
        const response = await fetch(`${PUBLIC_API_URL}/events/${eventId}`);
        const data = await response.json();
        if (!data.success) { goto("/"); return; }
        event = data.data;

        if (sessionUuid) {
            const userRes = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
            const userData = await userRes.json();
            organizationId = userData.data?.organizationId ?? '';
        }
    });

    const removeEvent = async () => {
        const sessionUuid = localStorage.getItem("sessionUuid");
        await fetch(`${PUBLIC_API_URL}/events/${eventId}/is_valid`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionUuid })
        });
        goto("/events");
    };
</script>

{#if event}
<div class="w-full flex items-center flex-col max-w-2xl mx-auto px-5 pb-20">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/events">＜ イベント</a>
    <h1 class="text-3xl font-bold text-center mt-8">{event.title}</h1>

    <div class="flex items-center gap-1 mt-2">
        <a href="/users/{event.userId}">
            <img src={event.userAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-full aspect-square" loading="lazy"/>
        </a>
        <a href="/users/{event.userId}" class="text-sm hover:underline">{event.userDisplayName}</a>
        <p class="text-gray-500 text-sm">in</p>
        <a href="/organizations/{event.organizationId}">
            <img src={event.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-md aspect-square" loading="lazy"/>
        </a>
        <a href="/organizations/{event.organizationId}" class="text-sm truncate hover:underline">{event.organizationDisplayName}</a>
    </div>

    <img src={event.thumbnail} class="rounded-2xl mt-5 w-full aspect-4/3" alt="thumbnail" loading="lazy"/>

    {#if event.description}
    <div class="w-full bg-slate-300 mt-8 rounded-2xl p-5 whitespace-pre-line">
        {event.description}
    </div>
    {/if}

    <div class="w-full border border-2 border-slate-300 mt-5 rounded-2xl p-5">
        <p><span class="font-bold">開始日時</span>: {new Date(event.startAt * 1000).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
        <p class="mt-2"><span class="font-bold">終了日時</span>: {new Date(event.endAt * 1000).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
        <p class="mt-2"><span class="font-bold">場所</span>: {event.place}</p>
    </div>

    <div class="mt-5 w-full">
        {#each event.buttons as button}
            <a class="button-violet w-full mb-3" href={button.url} target="_blank" rel="noopener noreferrer">{button.content}</a>
        {/each}
    </div>

    <div class="w-full flex items-center justify-between mt-6">
        <SubscribeButton postType="event" postId={event.eventId} postUuid={event.postUuid} />
        {#if event.userId === userId}
        <div class="flex items-center gap-3">
            <a class="button-violet" href="/events/{event.eventId}/edit">編集</a>
            <button class="button-red" onclick={removeEvent}>削除</button>
        </div>
        {/if}
    </div>

    <CommentSection postUuid={event.postUuid} {organizationId} />
</div>
{/if}