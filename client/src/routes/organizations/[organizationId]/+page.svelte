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
<div class="w-full flex flex-col mx-auto max-w-lg">
    <div class="grid grid-cols-3 gap-10 max-w-lg">
        <img class="rounded-full w-full m-3 border border-gray-500 border-1 rounded-full aspect-square" src={organization.avatar} alt="avatar" />
        <div class="col-span-2 flex flex-col justify-center">
            <p class="text-3xl font-bold">{organization.displayName}</p>
            <p class="ml-1 text-xl text-gray-500">ID: {organization.organizationId}</p>
            <div class="flex items-center gap-1">
                {#if organization.twitterId || organization.instagramId || organization.threadsId}
                <p class="text-gray-500">SNS:</p>
                {/if}
                {#if organization.twitterId}
                <a class="hover:underline" href="https://x.com/{organization.twitterId}">Twitter</a>
                {/if}
                {#if organization.instagramId}
                <a class="hover:underline" href="https://www.instagram.com/{organization.instagramId}">Instagram</a>
                {/if}
                {#if organization.threadsId}
                <a class="hover:underline" href="https://www.threads.net/@{organization.threadsId}">Threads</a>
                {/if}
            </div>
        </div>
        {#if organization.bio}
        <div class="col-span-3 whitespace-pre-line pt-2">{organization.bio}</div>
        {/if}
    </div>
    <p class="w-full text-center text-2xl font-bold mt-5">ユーザー</p>
    {#each organization.users as user}
    <a href="/users/{user.userId}">
        <div class="grid grid-cols-5 gap-10 mt-5">
            <img class="rounded-full w-full m-3 border border-gray-500 border-1 rounded-full aspect-square my-auto" src={user.avatar} alt="avatar" />
            <div class="col-span-4 text-2xl font-bold flex items-center gap-1">
                {#if user.role === "admin"}
                <p class="material-symbols-outlined">
                    crown
                </p>
                {/if}
                <p class="hover:underline">{user.displayName}</p>
                <p class="text-gray-500 hover:underline">@{user.userId}</p>
            </div>
        </div>
    </a>
    {/each}
</div>
{/if}