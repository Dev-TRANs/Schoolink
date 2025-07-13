<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import Fuse from 'fuse.js';
    import type { PollType } from "../../lib/types";
   
    let polls = $state<PollType[]>([]);
    let filteredPolls = $state<PollType[]>([]);
    let searchQuery = $state<string>('');
    let fuse: Fuse<PollType>;
   
    onMount(async () => {
     const response = await fetch(`${PUBLIC_API_URL}/polls`);
     const data = await response.json();
     polls = data.data;
     filteredPolls = polls;
     
     // Fuse.jsの設定
     fuse = new Fuse(polls, {
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
       filteredPolls = polls;
     } else {
       const results = fuse.search(searchQuery);
       filteredPolls = results.map(result => result.item);
     }
    }
   </script>
   
   <div class="mx-5">
     <h1 class="text-4xl font-bold">投票</h1>
     <input
       class="bg-gray-200 h-10 w-full mt-4 rounded-xl p-4"
       placeholder="投票を検索…"
       type="search"
       value={searchQuery}
       oninput={handleSearch}
     />
     {#if searchQuery && filteredPolls.length === 0}
     <p class="text-center text-2xl w-full mt-5">「{searchQuery}」の検索結果はありません</p>
     {/if}
     <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-5 gap-6">
       {#if !searchQuery}
       <a href={`/polls/create`}>
         <div
           class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200"
         >
           ＋
         </div>
         <p class="text-xl w-full text-center mt-2">新規作成</p>
       </a>
       {/if}
       
       {#each filteredPolls as poll}
         <a href={`/polls/${poll.pollId}`}>
           <div>
             <img class="text-sky-600 flex items-center justify-center text-6xl aspect-4/3 rounded-xl bg-gray-200 aspect-4/3 border border-gray-500 border-1" src={poll.thumbnail} alt="thumbnail" loading="lazy"/>
             <p class="text-xl w-full text-left mt-2 truncate">{poll.title}</p>
             <div class="flex items-center gap-1 mt-2">
               <img src={poll.userAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" loading="lazy"/>
               <p class="text-sm">{poll.userDisplayName}</p>
               <p class="text-gray-500 text-sm">in</p>
               <img src={poll.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" loading="lazy"/>
               <p class="text-sm truncate">{poll.organizationDisplayName}</p>
             </div>
           </div>
         </a>
       {/each}
     </div>
   </div>
   