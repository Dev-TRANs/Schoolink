<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    
    type matchingType = {
        matchingId: string;
        title: string
        description: string;
        buttons: string;
        thumbnail: string;
        userId: string;
        userDisplayName: string;
        userAvatar: string;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
    };

    const matchingId = $page.params.matchingId;

    let matching = $state<matchingType>();

    let userId = $state<string>();

    onMount(async () => {
        userId = localStorage.getItem("userId")
        const response = await fetch(`${PUBLIC_API_URL}/matchings/${matchingId}`);
        const data = await response.json();
        if(!data.success){
            goto("/")   
        }
        matching = data.data
    });

    const removeMatching = async() => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        await fetch(`${PUBLIC_API_URL}/matchings/${matchingId}/is_valid`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionUuid
          })
        });
        goto("/matchings")
    }
</script>

{#if matching}
    <div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
        <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/matchings">＜ マッチング</a>
        <h1 class="text-3xl font-bold text-cente mt-8">{matching.title}</h1>
        <div class="flex items-center gap-1 mt-2">
            <a href="/users/{matching.userId}">
                <img src={matching.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
            </a>
            <a href="/users/{matching.userId}">
                <p class="text-sm hover:underline">{matching.userDisplayName}</p>
            </a>
            <p class="text-gray-500 text-sm">in</p>
            <a href="/organizations/{matching.userId}">
                <img src={matching.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
            </a>
            <a href="/organizations/{matching.userId}">
                <p class="text-sm truncate hover:underline">{matching.organizationDisplayName}</p>
            </a>
        </div>
        <img src={matching.thumbnail} class="rounded-2xl mt-5 w-full aspect-4/3" alt="thumbnail"/>
        {#if matching.description}
        <div class="w-full bg-slate-300 mt-8 rounded-2xl p-5 whitespace-pre-line">
            {matching.description}
        </div>
        {/if}
        <div class="mt-5 w-full mb-20">
        {#each matching.buttons as button}
            <a class="button-violet w-full mb-3" href={button.url} target="_blank" rel="noopener noreferrer">{button.content}</a>
        {/each}
        </div>
        {#if matching.userId === userId}
            <div class="flex items-center justify-center w-full gap-4">
                <a class="button-violet" href="/matchings/{matching.matchingId}/edit">編集</a>
                <button class="button-red" onclick={removeMatching}>削除</button>
            </div>
        {/if}
    </div>
{/if}