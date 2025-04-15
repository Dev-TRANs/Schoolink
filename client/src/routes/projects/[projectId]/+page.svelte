<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import type { ProjectType } from "../../../lib/types";

    const projectId = $page.params.projectId;

    let project = $state<ProjectType>();

    let userId = $state<string>();

    onMount(async () => {
        userId = localStorage.getItem("userId")
        const response = await fetch(`${PUBLIC_API_URL}/projects/${projectId}`);
        const data = await response.json();
        if(!data.success){
            goto("/")   
        }
        project = data.data
    });

    const removeProject = async() => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        await fetch(`${PUBLIC_API_URL}/projects/${projectId}/is_valid`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionUuid
          })
        });
        goto("/projects")
    }
</script>

{#if project}
    <div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
        <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/projects">＜ プロジェクト</a>
        <h1 class="text-3xl font-bold text-cente mt-8">{project.title}</h1>
        <div class="flex items-center gap-1 mt-2">
            <a href="/users/{project.userId}">
                <img src={project.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
            </a>
            <a href="/users/{project.userId}">
                <p class="text-sm hover:underline">{project.userDisplayName}</p>
            </a>
            <p class="text-gray-500 text-sm">in</p>
            <a href="/organizations/{project.organizationId}">
                <img src={project.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
            </a>
            <a href="/organizations/{project.organizationId}">
                <p class="text-sm truncate hover:underline">{project.organizationDisplayName}</p>
            </a>
        </div>
        <img src={project.thumbnail} class="rounded-2xl mt-5 w-full aspect-4/3" alt="thumbnail"/>
        {#if project.description}
        <div class="w-full bg-slate-300 mt-8 rounded-2xl p-5 whitespace-pre-line">
            {project.description}
        </div>
        {/if}
        <div class="mt-5 w-full mb-20">
        {#each project.buttons as button}
            <a class="button-violet w-full mb-3" href={button.url} target="_blank" rel="noopener noreferrer">{button.content}</a>
        {/each}
        </div>
        {#if project.userId === userId}
            <div class="flex items-center justify-center w-full gap-4">
                <a class="button-violet" href="/projects/{project.projectId}/edit">編集</a>
                <button class="button-red" onclick={removeProject}>削除</button>
            </div>
        {/if}
    </div>
{/if}