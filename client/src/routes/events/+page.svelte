<script lang="ts">
  import { PUBLIC_API_URL } from "$env/static/public";
  import { onMount } from "svelte";
  import Fuse from "fuse.js";
  import type { EventType } from "../../lib/types";

  let events = $state<EventType[]>([]);
  let filteredEvents = $state<EventType[]>([]);
  let searchQuery = $state<string>("");
  let fuse: Fuse<EventType>;

  onMount(async () => {
    const response = await fetch(`${PUBLIC_API_URL}/events`);
    const data = await response.json();
    events = data.data;
    filteredEvents = events;

    // Fuse.jsの設定
    fuse = new Fuse(events, {
      keys: [
        "title",
        "description",
        "userDisplayName",
        "organizationDisplayName",
      ],
      threshold: 0.4,
      ignoreLocation: true,
    });
  });

  // 検索処理
  function handleSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;

    if (searchQuery.trim() === "") {
      filteredEvents = events;
    } else {
      const results = fuse.search(searchQuery);
      filteredEvents = results.map((result) => result.item);
    }
  }
</script>

<div class="mx-5">
  <p class="text-normal">
      <a href="/about" class="underline text-sky-600">つながる学生のためのプラットフォーム、Schoolinkを知る→</a>
     </p>
  <h1 class="mt-3 text-4xl font-bold">イベント</h1>
  <input
    class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
    placeholder="イベントを検索…"
    type="search"
    value={searchQuery}
    oninput={handleSearch}
  />
  {#if searchQuery && filteredEvents.length === 0}
    <p class="text-center text-2xl w-full mt-5">
      「{searchQuery}」の検索結果はありません
    </p>
  {/if}
  <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
    {#if !searchQuery}
      <a href={`/events/create`}>
        <div
          class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200"
        >
          ＋
        </div>
        <p class="text-xl w-full text-center mt-2">新規作成</p>
      </a>
    {/if}

    {#each filteredEvents as event}
      <a href={`/events/${event.eventId}`}>
        <div>
          <img
            class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3 border border-gray-500 border-1"
            src={event.thumbnail}
            alt="thumbnail"
            loading="lazy"
          />
          <p class="text-xl w-full text-left mt-2 truncate">{event.title}</p>
          <div class="flex items-center gap-1 mt-2">
            <img
              src={event.userAvatar}
              alt="avatar"
              class="size-7 border border-gray-500 border-1 rounded-full aspect-square"
              loading="lazy"
            />
            <p class="text-sm">{event.userDisplayName}</p>
            <p class="text-gray-500 text-sm">in</p>
            <img
              src={event.organizationAvatar}
              alt="avatar"
              class="size-7 border border-gray-500 border-1 rounded-md aspect-square"
              loading="lazy"
            />
            <p class="text-sm truncate">{event.organizationDisplayName}</p>
          </div>
        </div>
      </a>
    {/each}
  </div>
</div>
