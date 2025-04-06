<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import Button from '$lib/components/Button.svelte';
    import { onMount } from "svelte";
    
    type projectType = {
        projectId: string;
        title: string
        description: string;
        buttons: Array<{
            content: string;
            url: string
        }>;
        thumbnail: string;
        userId: string;
        userDisplayName: string;
        userAvatar: string;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
    };

    const projectId = $page.params.projectId;

    let project = $state<projectType>();

    onMount(async () => {
        const response = await fetch(`${PUBLIC_API_URL}/projects/${projectId}`);
        const data = await response.json();
        if(!data.success){
            goto("/")   
        }
        project = data.data
    });
</script>

{#if project}
    <div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
        <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/projects">＜ プロジェクト</a>
        <h1 class="text-3xl font-bold text-cente mt-8">{project.title}</h1>
        <div class="flex items-center gap-1 mt-2">
            <img src={project.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
            <p class="text-sm">{project.userDisplayName}</p>
            <p class="text-gray-500 text-sm">in</p>
            <img src={project.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
            <p class="text-sm truncate">{project.organizationDisplayName}</p>
        </div>
        <img src={project.thumbnail} class="rounded-2xl mt-5 w-full aspect-4/3" alt="thumbnail"/>
        <div class="w-full bg-slate-300 mt-8 rounded-2xl p-5 whitespace-pre-line">
            {project.description}
        </div>
        <div class="mt-5 w-full mb-20">
        {#each project.buttons as button}
            <Button href={button.url} className="w-full mb-3">{button.content}</Button>
        {/each}
        </div>
    </div>
{/if}