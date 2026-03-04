<svelte:head>
	<title>プロジェクト | Schoolink</title>
</svelte:head>

<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import Fuse from 'fuse.js';
    import type { ProjectType } from "../../lib/types";
   
    let projects = $state<ProjectType[]>([]);
    let filteredProjects = $state<ProjectType[]>([]);
    let searchQuery = $state<string>('');
    let fuse: Fuse<ProjectType>;
    let loading = $state(true);
   
    onMount(async () => {
     const response = await fetch(`${PUBLIC_API_URL}/projects`);
     const data = await response.json();
     projects = data.data;
     filteredProjects = projects;
     
     fuse = new Fuse(projects, {
       keys: ['title', 'description', 'userDisplayName', 'organizationDisplayName'],
       threshold: 0.4,
       ignoreLocation: true
     });
     loading = false;
    });
   
    function handleSearch(event: Event) {
     const target = event.target as HTMLInputElement;
     searchQuery = target.value;
     
     if (searchQuery.trim() === '') {
       filteredProjects = projects;
     } else {
       const results = fuse.search(searchQuery);
       filteredProjects = results.map(result => result.item);
     }
    }
   </script>
   
   <div class="mx-5">
     <p class="text-normal">
      <a href="/about" class="underline text-sky-600">つながる学生のためのプラットフォーム、Schoolinkを知る→</a>
     </p>
     <h1 class="mt-3 text-4xl font-bold">プロジェクト</h1>
     <input
       class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
       placeholder="プロジェクトを検索…"
       type="search"
       value={searchQuery}
       oninput={handleSearch}
     />
     {#if searchQuery && filteredProjects.length === 0}
     <p class="text-center text-2xl w-full mt-5">「{searchQuery}」の検索結果はありません</p>
     {/if}

     {#if loading}
     <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6 animate-pulse">
       {#each [1,2,3,4,5,6] as _}
       <div>
         <div class="aspect-[4/3] rounded-xl bg-gray-200"></div>
         <div class="h-5 bg-gray-200 rounded mt-2 w-3/4"></div>
         <div class="h-4 bg-gray-200 rounded mt-2 w-1/2"></div>
       </div>
       {/each}
     </div>
     {:else}
     <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
       {#if !searchQuery}
       <a href={`/projects/create`}>
         <div class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200">＋</div>
         <p class="text-xl w-full text-center mt-2">新規作成</p>
       </a>
       {/if}
       
       {#each filteredProjects as project}
         <a href={`/projects/${project.projectId}`}>
           <div>
             <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3 border border-gray-500 border-1" src={project.thumbnail} alt="thumbnail" loading="lazy"/>
             <p class="text-xl w-full text-left mt-2 truncate">{project.title}</p>
             <div class="flex items-center gap-1 mt-2">
               <img src={project.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" loading="lazy"/>
               <p class="text-sm">{project.userDisplayName}</p>
               <p class="text-gray-500 text-sm">in</p>
               <img src={project.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" loading="lazy"/>
               <p class="text-sm truncate">{project.organizationDisplayName}</p>
             </div>
           </div>
         </a>
       {/each}
     </div>
     {/if}
   </div>