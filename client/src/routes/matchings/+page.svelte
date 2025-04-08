<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import Fuse from 'fuse.js';
   
    type matchingType = {
     matchingId: string;
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
   
    let matchings = $state<matchingType[]>([]);
    let filteredMatchings = $state<matchingType[]>([]);
    let searchQuery = $state<string>('');
    let fuse: Fuse<matchingType>;
   
    onMount(async () => {
     const response = await fetch(`${PUBLIC_API_URL}/matchings`);
     const data = await response.json();
     matchings = data.data;
     filteredMatchings = matchings;
     
     // Fuse.jsの設定
     fuse = new Fuse(matchings, {
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
       filteredMatchings = matchings;
     } else {
       const results = fuse.search(searchQuery);
       filteredMatchings = results.map(result => result.item);
     }
    }
   </script>
   
   <div class="mx-5">
     <h1 class="text-4xl font-bold">マッチング</h1>
     <input
       class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
       placeholder="マッチングを検索…"
       type="search"
       value={searchQuery}
       oninput={handleSearch}
     />
     {#if searchQuery && filteredMatchings.length === 0}
     <p class="text-center text-2xl w-full mt-5">「{searchQuery}」の検索結果はありません</p>
     {/if}
     <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
       {#if !searchQuery}
       <a href={`/matchings/create`}>
         <div
           class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200"
         >
           ＋
         </div>
         <p class="text-xl w-full text-center mt-2">新規作成</p>
       </a>
       {/if}
       
       {#each filteredMatchings as matching}
         <a href={`/matchings/${matching.matchingId}`}>
           <div>
             <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3" src={matching.thumbnail} alt="thumbnail" />
             <p class="text-xl w-full text-left mt-2 truncate">{matching.title}</p>
             <div class="flex items-center gap-1 mt-2">
               <img src={matching.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
               <p class="text-sm">{matching.userDisplayName}</p>
               <p class="text-gray-500 text-sm">in</p>
               <img src={matching.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
               <p class="text-sm truncate">{matching.organizationDisplayName}</p>
             </div>
           </div>
         </a>
       {/each}
     </div>
   </div>
   