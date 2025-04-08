<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";

    type userType = {
        userId: string;
        displayName: string;
        bio: string | null;
        avatar: string;
        instagramId: string | null;
        threadsId: string | null;
        twitterId: string | null;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
        role: "admin" | "member";
    };

    type projectType = {
        projectId: string;
        title: string
        description: string;
        buttons: Array<{ content: string, url: string }>;
        thumbnail: string;
        userId: string;
        userDisplayName: string;
        userAvatar: string;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
    };

    type eventType = {
        eventId: string;
        title: string
        description: string;
        buttons: Array<{ content: string, url: string }>;
        thumbnail: string;
        place: string;
        startAt: number;
        endAt: number;
        userId: string;
        userDisplayName: string;
        userAvatar: string;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
    };

    type matchingType = {
        matchingId: string;
        title: string
        description: string;
        buttons: Array<{ content: string, url: string }>;
        thumbnail: string;
        userId: string;
        userDisplayName: string;
        userAvatar: string;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
    };

    let user = $state<userType>();

    const userId = $page.params.userId;

    let projects = $state<projectType[]>([])

    let events = $state<eventType[]>([])

    let matchings = $state<matchingType[]>([])

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
        const matchingResponce = await fetch(`${PUBLIC_API_URL}/matchings?userId=${userId}`);
        const matchingData = await matchingResponce.json();
        matchings = matchingData.data;
    })
</script>

{#if user}
<div class="w-full flex flex-col mx-auto px-5 sm:px-10 items-center">
    <div class="grid grid-cols-3 gap-10 max-w-lg">
        <img class="rounded-full w-full m-3 border border-gray-500 border-1 rounded-full aspect-square" src={user.avatar} alt="avatar" />
        <div class="col-span-2 flex flex-col justify-center">
            <p class="text-3xl font-bold">{user.displayName}<span class="ml-1 text-3xl text-gray-500">@{user.userId}</span></p>
            <p class="text-md text-gray-500 truncate">in <a class="hover:underline text-black" href="/organizations/{user.organizationId}">{user.organizationDisplayName}</a></p>
            <div class="flex items-center gap-1">
                {#if user.twitterId || user.instagramId || user.threadsId}
                <p class="text-gray-500">SNS:</p>
                {/if}
                {#if user.twitterId}
                <a class="hover:underline" href="https://x.com/{user.twitterId}">Twitter</a>
                {/if}
                {#if user.instagramId}
                <a class="hover:underline" href="https://www.instagram.com/{user.instagramId}">Instagram</a>
                {/if}
                {#if user.threadsId}
                <a class="hover:underline" href="https://www.threads.net/@{user.threadsId}">Threads</a>
                {/if}
            </div>
        </div>
        {#if user.bio}
        <div class="col-span-3 whitespace-pre-line pt-2">{user.bio}</div>
        {/if}
    </div>
    <div class="w-full mt-5">
        <p class="w-full text-center text-2xl font-bold">プロジェクト</p>
        <div class="flex mt-3 overflow-x-scroll gap-6 justify-center w-full">
        {#each projects as project}
         <a href={`/projects/${project.projectId}`}>
           <div>
             <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3 w-sm min-w-sm" src={project.thumbnail} alt="thumbnail" />
             <p class="text-xl w-full text-left mt-2 truncate">{project.title}</p>
             <div class="flex items-center gap-1 mt-2">
               <img src={project.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
               <p class="text-sm">{project.userDisplayName}</p>
               <p class="text-gray-500 text-sm">in</p>
               <img src={project.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
               <p class="text-sm truncate">{project.organizationDisplayName}</p>
             </div>
           </div>
         </a>
        {/each}
        {#if projects.length === 0}
        <p class="text-gray-500 text-lg">プロジェクトがありません</p>
        {/if}
        </div>
    </div>
    <div class="w-full mt-5">
        <p class="w-full text-center text-2xl font-bold">イベント</p>
        <div class="flex mt-3 overflow-x-scroll gap-6 justify-center w-full">
        {#each events as event}
         <a href={`/projects/${event.eventId}`}>
           <div>
             <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3 w-sm" src={event.thumbnail} alt="thumbnail" />
             <p class="text-xl w-full text-left mt-2 truncate">{event.title}</p>
             <div class="flex items-center gap-1 mt-2">
               <img src={event.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
               <p class="text-sm">{event.userDisplayName}</p>
               <p class="text-gray-500 text-sm">in</p>
               <img src={event.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
               <p class="text-sm truncate">{event.organizationDisplayName}</p>
             </div>
           </div>
         </a>
        {/each}
        {#if events.length === 0}
        <p class="text-gray-500 text-lg">イベントがありません</p>
        {/if}
        </div>
    </div>
    <div class="w-full mt-5">
        <p class="w-full text-center text-2xl font-bold">マッチング</p>
        <div class="flex mt-3 overflow-x-scroll gap-6 justify-center w-full">
        {#each matchings as matching}
         <a href={`/projects/${matching.matchingId}`}>
           <div>
             <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3 w-sm" src={matching.thumbnail} alt="thumbnail" />
             <p class="text-xl w-full text-left mt-2 truncate">{matching.title}</p>
             <div class="flex items-center gap-1 mt-2">
               <img src={matching.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
               <p class="text-sm">{matching.userDisplayName}</p>
               <p class="text-gray-500 text-sm">in</p>
               <img src={matching.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
               <p class="text-sm truncate">{matching.organizationDisplayName}</p>
             </div>
           </div>
         </a>
        {/each}
        {#if matchings.length === 0}
        <p class="text-gray-500 text-lg">マッチングがありません</p>
        {/if}
        </div>
    </div>
</div>
{/if}