<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
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


    let projects = $state<projectType[]>([]);

    onMount(async () => {
        const response = await fetch(`${PUBLIC_API_URL}/projects`);
        const data = await response.json();
        projects = data.data
    });
</script>

<div class="mx-5">
    <h1 class="text-4xl font-bold">プロジェクト</h1>
    <input
        class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
        placeholder="プロジェクトを検索…"
        type="search"
    />
    <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
        <a href={`/projects/create`}>
            <div
                class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200"
            >
                ＋
            </div>
            <p class="text-xl w-full text-center mt-2">新規作成</p>
        </a>
        {#each projects as project}
        <a href={`/projects/${project.projectId}`}>
            <div>
                <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3" src={project.thumbnail} alt="thumbnail" />
                <p class="text-xl w-full text-left mt-2 truncate">{project.title}</p>
                <div class="flex items-center gap-1 mt-2">
                    <img src={project.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
                    <p class="text-sm">{project.userDisplayName}</p>
                    <p class="text-gray-500 text-sm">in</p>
                    <img src={project.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md" aspect-square />
                    <p class="text-sm truncate">{project.organizationDisplayName}</p>
                </div>
            </div>
        </a>
        {/each}
    </div>
</div>