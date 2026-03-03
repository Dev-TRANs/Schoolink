<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import type { ProjectType } from "../../../lib/types";
    import SubscribeButton from "../../../lib/components/SubscribeButton.svelte";
    import CommentSection from "../../../lib/components/CommentSection.svelte";

    const projectId = $page.params.projectId;

    let project = $state<ProjectType>();
    let userId = $state<string | null>(null);
    let organizationId = $state<string>('');

    onMount(async () => {
        userId = localStorage.getItem("userId");
        const sessionUuid = localStorage.getItem("sessionUuid");
        const response = await fetch(`${PUBLIC_API_URL}/projects/${projectId}`);
        const data = await response.json();
        if (!data.success) { goto("/"); return; }
        project = data.data;

        if (sessionUuid) {
            const userRes = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
            const userData = await userRes.json();
            organizationId = userData.data?.organizationId ?? '';
        }
    });

    const removeProject = async () => {
        const sessionUuid = localStorage.getItem("sessionUuid");
        await fetch(`${PUBLIC_API_URL}/projects/${projectId}/is_valid`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionUuid })
        });
        goto("/projects");
    };
</script>
<svelte:head>
	<title>{project ? project.title + " | プロジェクト | Schoolink" : "プロジェクト | Schoolink"}</title>
</svelte:head>


{#if project}
<div class="w-full flex items-center flex-col max-w-2xl mx-auto px-5 pb-20">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/projects">＜ プロジェクト</a>
    <h1 class="text-3xl font-bold text-center mt-8">{project.title}</h1>

    <div class="flex items-center gap-1 mt-2">
        <a href="/users/{project.userId}">
            <img src={project.userAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-full aspect-square" loading="lazy"/>
        </a>
        <a href="/users/{project.userId}" class="text-sm hover:underline">{project.userDisplayName}</a>
        <p class="text-gray-500 text-sm">in</p>
        <a href="/organizations/{project.organizationId}">
            <img src={project.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-md aspect-square" loading="lazy"/>
        </a>
        <a href="/organizations/{project.organizationId}" class="text-sm truncate hover:underline">{project.organizationDisplayName}</a>
    </div>

    <img src={project.thumbnail} class="rounded-2xl mt-5 w-full aspect-4/3" alt="thumbnail" loading="lazy"/>

    {#if project.description}
    <div class="w-full bg-slate-300 mt-8 rounded-2xl p-5 whitespace-pre-line">
        {project.description}
    </div>
    {/if}

    <div class="mt-5 w-full">
        {#each project.buttons as button}
            <a class="button-violet w-full mb-3" href={button.url} target="_blank" rel="noopener noreferrer">{button.content}</a>
        {/each}
    </div>

    <div class="w-full flex items-center justify-between mt-6">
        <SubscribeButton postType="project" postId={project.projectId} postUuid={project.postUuid} />
        {#if project.userId === userId}
        <div class="flex items-center gap-3">
            <a class="button-violet" href="/projects/{project.projectId}/edit">編集</a>
            <button class="button-red" onclick={removeProject}>削除</button>
        </div>
        {/if}
    </div>

    <CommentSection postUuid={project.postUuid} {organizationId} />
</div>
{/if}