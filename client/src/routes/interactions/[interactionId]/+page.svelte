<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import type { InteractionType } from "../../../lib/types";}

    const interactionId = $page.params.interactionId;

    let interaction = $state<InteractionType>();

    let userId = $state<string>();

    onMount(async () => {
        userId = localStorage.getItem("userId")
        const response = await fetch(`${PUBLIC_API_URL}/interactions/${interactionId}`);
        const data = await response.json();
        if(!data.success){
            goto("/")   
        }
        interaction = data.data
    });

    const removeInteraction = async() => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        await fetch(`${PUBLIC_API_URL}/interactions/${interactionId}/is_valid`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionUuid
          })
        });
        goto("/interactions")
    }
</script>

{#if interaction}
    <div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
        <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/interactions">＜ 交流会</a>
        <h1 class="text-3xl font-bold text-cente mt-8">{interaction.title}</h1>
        <div class="flex items-center gap-1 mt-2">
            <a href="/users/{interaction.userId}">
                <img src={interaction.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
            </a>
            <a href="/users/{interaction.userId}">
                <p class="text-sm hover:underline">{interaction.userDisplayName}</p>
            </a>
            <p class="text-gray-500 text-sm">in</p>
            <a href="/organizations/{interaction.organizationId}">
                <img src={interaction.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
            </a>
            <a href="/organizations/{interaction.organizationId}">
                <p class="text-sm truncate hover:underline">{interaction.organizationDisplayName}</p>
            </a>
        </div>
        <img src={interaction.thumbnail} class="rounded-2xl mt-5 w-full aspect-4/3" alt="thumbnail"/>
        {#if interaction.description}
        <div class="w-full bg-slate-300 mt-8 rounded-2xl p-5 whitespace-pre-line">
            {interaction.description}
        </div>
        {/if}
        <div class="mt-5 w-full mb-20">
        {#each interaction.buttons as button}
            <a class="button-violet w-full mb-3" href={button.url} target="_blank" rel="noopener noreferrer">{button.content}</a>
        {/each}
        </div>
        {#if interaction.userId === userId}
            <div class="flex items-center justify-center w-full gap-4">
                <a class="button-violet" href="/interactions/{interaction.interactionId}/edit">編集</a>
                <button class="button-red" onclick={removeInteraction}>削除</button>
            </div>
        {/if}
    </div>
{/if}