<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import Fuse from 'fuse.js';
   
    type interactionType = {
     interactionId: string;
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
   
    let interactions = $state<interactionType[]>([]);
    let filteredInteractions = $state<interactionType[]>([]);
    let searchQuery = $state<string>('');
    let fuse: Fuse<interactionType>;
   
    onMount(async () => {
     const response = await fetch(`${PUBLIC_API_URL}/interactions`);
     const data = await response.json();
     interactions = data.data;
     filteredInteractions = interactions;
     
     // Fuse.jsの設定
     fuse = new Fuse(interactions, {
       keys: ['title', 'description', 'userDisplayName', 'organizationDisplayName'],
       threshold: 0.4,
       ignoreLocation: true
     });
    });
   
    // 検索処理
    function handleSearch(event: Event) {
     const target = event.target as HTMLInputElement;
     searchQuery = target.value;
     
     if (searchQuery.trim() === '') {
       filteredInteractions = interactions;
     } else {
       const results = fuse.search(searchQuery);
       filteredInteractions = results.map(result => result.item);
     }
    }
   </script>
   
   <div class="mx-5">
     <h1 class="text-4xl font-bold">交流会</h1>
     <input
       class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
       placeholder="交流会を検索…"
       type="search"
       value={searchQuery}
       oninput={handleSearch}
     />
     {#if searchQuery && filteredInteractions.length === 0}
     <p class="text-center text-2xl w-full mt-5">「{searchQuery}」の検索結果はありません</p>
     {/if}
     <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
       {#if !searchQuery}
       <a href={`/interactions/create`}>
         <div
           class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200"
         >
           ＋
         </div>
         <p class="text-xl w-full text-center mt-2">新規作成</p>
       </a>
       {/if}
       
       {#each filteredInteractions as interaction}
         <a href={`/interactions/${interaction.interactionId}`}>
           <div>
             <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3 border border-gray-500 border-1" src={interaction.thumbnail} alt="thumbnail" />
             <p class="text-xl w-full text-left mt-2 truncate">{interaction.title}</p>
             <div class="flex items-center gap-1 mt-2">
               <img src={interaction.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
               <p class="text-sm">{interaction.userDisplayName}</p>
               <p class="text-gray-500 text-sm">in</p>
               <img src={interaction.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
               <p class="text-sm truncate">{interaction.organizationDisplayName}</p>
             </div>
           </div>
         </a>
       {/each}
     </div>
   </div>
   