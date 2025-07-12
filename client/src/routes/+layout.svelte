<script lang="ts">
	import '../app.css'
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';
    import { page } from '$app/state';
    import type { UserType } from '../lib/types'; 

	let { children } = $props();

    let user = $state<UserType>();

    async function loadUser() {
        const sessionUuid = localStorage.getItem("sessionUuid")
        const userId = localStorage.getItem("userId");
        if (userId) {
            const sessionResponse = await fetch(`${PUBLIC_API_URL}/auth/session_check`, {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json'
            },
                body: JSON.stringify({
                    sessionUuid,
                    userId
                })
            })
            const sessionData = await sessionResponse.json();
            if(sessionData.isValid) {
                const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
                const data = await response.json();
                user = data.data;
            } else {
                localStorage.removeItem("sessionUuid")
                localStorage.removeItem("userId")
                const sessionResponse = await fetch(`${PUBLIC_API_URL}/auth/sign_out`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sessionUuid,
                    })
                })
                user = undefined
            }
        } else {
            user = undefined
        }
        if (!user && !localStorage.getItem("clientUuid")) localStorage.setItem("clientUuid", crypto.randomUUID())
    } 

    onMount(loadUser);
    afterNavigate(loadUser);
</script>

<header class="sm:hidden py-4 fixed top-0 w-full shadow-md z-10 backdrop-blur-xl bg-white/50">
    <div class="relative flex items-center justify-center">
        <a href="/">
            <p class="text-3xl font-bold font-AllertaStencil">Schoolink<span class="ml-2 text-xl text-gray-500 font-normal">β</span></p>
        </a>
        <span class="!text-3xl material-symbols-outlined text-blue-600 absolute right-6">
            <a href="/settings">{ user ? "settings" : "login" }</a>
        </span>
    </div>
</header>


        
<div class="grid grid-cols-1 sm:grid-cols-[16rem_auto] h-screen pt-16 sm:pt-0">
    <div class="w-full bg-gray-200 hidden sm:block">
        <a href="/">
            <p class="text-3xl text-2xl font-bold pl-5 mt-5 font-AllertaStencil">Schoolink<span class="ml-2 text-xl text-gray-500 font-normal">β</span></p>
        </a>
        <a href="/projects">
            <div class="text-lg mt-5 flex items-center mr-4 pl-5 py-2 rounded-r-xl {page.url.pathname.includes('/projects') ? 'bg-gray-300' : ''}">
                <span class="material-symbols-outlined mr-1 text-blue-600">public</span>
                プロジェクト
            </div>
        </a>
        <a href="/events">
            <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl {page.url.pathname.includes('/events') ? 'bg-gray-300' : ''}">
    	        <span class="material-symbols-outlined mr-1 text-blue-600">event</span>
                イベント
            </div>
        </a>
        <a href="/polls">
            <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl {page.url.pathname.includes('/polls') ? 'bg-gray-300' : ''}">
    	        <span class="material-symbols-outlined mr-1 text-blue-600">quiz</span>
                投票
            </div>
        </a>
        <a href="/settings">
            <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl {page.url.pathname.includes('/settings') ? 'bg-gray-300' : ''}">
    	        <span class="material-symbols-outlined mr-1 text-blue-600">{ user ? "settings" : "login" }</span>
                { user ? "設定" : "ログイン" }
            </div>
        </a>
        {#if user}
        <div class="flex items-center gap-1 mt-2 mr-4 pl-8">
            <a href="/users/{user.userId}">
                <img src={user.avatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" />
            </a>
            <a href="/users/{user.userId}">
                <p class="text-sm hover:underline">{user.displayName}</p>
            </a>
            <p class="text-gray-500 text-sm">in</p>
        </div>
        <div class="flex items-center gap-1 mt-2 mr-4 pl-8">
            <a href="/organizations/{user.organizationId}">
                <img src={user.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" />
            </a>
            <a href="/organizations/{user.organizationId}">
                <p class="text-sm truncate hover:underline">{user.organizationDisplayName}</p>
            </a>
        </div>
        {/if}
    </div>
    <div class="overflow-auto pt-10 pb-30 w-full">
        {@render children()}
    </div>
</div>

<footer class="sm:hidden bg-gray-100/80 backdrop-blur-xl fixed bottom-0 w-full shadow-lg">
    <div class="grid grid-cols-3 w-full text-gray-600 font-bold">
        <a href="/projects">
		    <div class="text-xs flex flex-col items-center py-2 rounded-r-xl {page.url.pathname.includes('/projects') ? 'text-blue-600' : ''}">
			    <span class="material-symbols-outlined text-{page.url.pathname.includes('/projects') ? 'blue' : 'gray'}-600 mb-1 !text-3xl">public</span>
			    プロジェクト
		    </div>
        </a>
        <a href="/events">
		    <div class="text-xs flex flex-col items-center py-2 rounded-r-xl {page.url.pathname.includes('/events') ? 'text-blue-600' : ''}">
			    <span class="material-symbols-outlined text-{page.url.pathname.includes('/events') ? 'blue' : 'gray'}-600 mb-1 !text-3xl">event</span>
			    イベント
		    </div>
        </a>
        <a href="/polls">
		    <div class="text-xs flex flex-col items-center py-2 rounded-r-xl {page.url.pathname.includes('/polls') ? 'text-blue-600' : ''}">
			    <span class="material-symbols-outlined text-{page.url.pathname.includes('/polls') ? 'blue' : 'gray'}-600 mb-1 !text-3xl">quiz</span>
			    投票
		    </div>
        </a>
	</div>
</footer>