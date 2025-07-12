<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import type { OrganizationType } from "../../../lib/types";

    let organization = $state<OrganizationType>();

    const organizationId = $page.params.organizationId;

    onMount(async() => {
        const response = await fetch(`${PUBLIC_API_URL}/organizations/${organizationId}`);
        const data = await response.json();
        organization = data.data;
    })
</script>

{#if organization}
<div class="w-full flex flex-col items-center px-5 sm:px-10 py-8 space-y-10">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl items-center">
        <img class="rounded-full border border-gray-500 aspect-square w-32 h-32 mx-auto sm:mx-0" src={organization.avatar} alt="avatar" />
        <div class="sm:col-span-2 flex flex-col justify-center space-y-2 text-center sm:text-left">
            <p class="text-3xl font-bold">{organization.displayName}</p>
            <p class="text-gray-500 text-md">ID: <span class="bg-gray-100 px-2 py-0.5 rounded">{organization.organizationId}</span></p>
            {#if organization.twitterId || organization.instagramId || organization.threadsId}
            <div class="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-500">
                <span>SNS:</span>
                {#if organization.twitterId}
                <a class="hover:underline text-blue-500" href="https://x.com/{organization.twitterId}">Twitter</a>
                {/if}
                {#if organization.instagramId}
                <a class="hover:underline text-pink-500" href="https://www.instagram.com/{organization.instagramId}">Instagram</a>
                {/if}
                {#if organization.threadsId}
                <a class="hover:underline text-purple-500" href="https://www.threads.net/@{organization.threadsId}">Threads</a>
                {/if}
            </div>
            {/if}
        </div>
        {#if organization.bio}
        <div class="col-span-full whitespace-pre-line text-gray-700 text-center sm:text-left">{organization.bio}</div>
        {/if}
    </div>
    <div class="w-full max-w-3xl">
        <h2 class="text-2xl font-bold text-center mb-4">ユーザー</h2>
        <div class="space-y-4">
            {#each organization.users as user}
            <a href="/users/{user.userId}" class="block hover:bg-gray-50 transition rounded-lg border border-gray-200 p-4">
                <div class="flex items-center gap-4">
                    <img src={user.avatar} alt="avatar" class="size-12 sm:size-14 rounded-full border border-gray-400" />
                    <div class="flex flex-wrap items-center gap-2 text-lg sm:text-xl font-semibold">
                        {#if user.role === "admin"}
                        <span class="material-symbols-outlined text-yellow-500 text-2xl">crown</span>
                        {/if}
                        <p class="hover:underline">{user.displayName}</p>
                        <p class="text-gray-500 hover:underline">@{user.userId}</p>
                    </div>
                </div>
            </a>
            {/each}
        </div>
    </div>
</div>
{/if}
