<script lang="ts">
	import '../app.css'
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';
    import { page } from '$app/state';
    import type { UserType } from '../lib/types';
    import { notifications, unreadCount, fetchNotifications, startPolling, stopPolling } from '../lib/stores/notifications';

	let { children } = $props();

    let user = $state<UserType>();

    async function loadUser() {
        const sessionUuid = localStorage.getItem("sessionUuid")
        const userId = localStorage.getItem("userId");
        if (userId) {
            const sessionResponse = await fetch(`${PUBLIC_API_URL}/auth/session_check`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionUuid, userId })
            });
            const sessionData = await sessionResponse.json();
            if (sessionData.isValid) {
                const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
                const data = await response.json();
                user = data.data;
                // 通知をバックグラウンドで取得してポーリング開始
                fetchNotifications(PUBLIC_API_URL);
                startPolling(PUBLIC_API_URL, 30000);
            } else {
                localStorage.removeItem("sessionUuid");
                localStorage.removeItem("userId");
                await fetch(`${PUBLIC_API_URL}/auth/sign_out`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionUuid })
                });
                user = undefined;
                notifications.set([]);
                stopPolling();
            }
        } else {
            user = undefined;
            notifications.set([]);
        }
        if (!user && !localStorage.getItem("clientUuid"))
            localStorage.setItem("clientUuid", crypto.randomUUID());
    }

    onMount(loadUser);
    afterNavigate(loadUser);
</script>

<!-- モバイルヘッダー -->
<header class="sm:hidden py-4 fixed top-0 w-full shadow-md z-10 backdrop-blur-xl bg-white/50">
    <div class="relative flex items-center justify-center">
        <a href="/">
            <p class="text-3xl font-bold font-AllertaStencil">Schoolink<span class="ml-2 text-xl text-gray-500 font-normal">β</span></p>
        </a>
        <div class="absolute right-4 flex items-center gap-2">
            {#if user}
            <!-- 通知ベル -->
            <a href="/notifications" class="relative">
                <span class="!text-2xl material-symbols-outlined text-blue-600">notifications</span>
                {#if $unreadCount > 0}
                <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {$unreadCount > 99 ? '99+' : $unreadCount}
                </span>
                {/if}
            </a>
            {/if}
            <span class="!text-2xl material-symbols-outlined text-blue-600">
                <a href="/settings">{ user ? "settings" : "login" }</a>
            </span>
        </div>
    </div>
</header>

<div class="grid grid-cols-1 sm:grid-cols-[16rem_auto] h-screen pt-16 sm:pt-0">
    <!-- デスクトップサイドバー -->
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
        <a href="/questions">
            <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl {page.url.pathname.includes('/questions') ? 'bg-gray-300' : ''}">
    	        <span class="material-symbols-outlined mr-1 text-blue-600">live_help</span>
                質問
            </div>
        </a>
        {#if user}
        <!-- 通知（ログイン時のみ） -->
        <a href="/notifications">
            <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl {page.url.pathname.includes('/notifications') ? 'bg-gray-300' : ''}">
                <span class="relative mr-1 pt-2">
                    <span class="material-symbols-outlined text-blue-600">notifications</span>
                    {#if $unreadCount > 0}
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                        {$unreadCount > 99 ? '99+' : $unreadCount}
                    </span>
                    {/if}
                </span>
                通知
                {#if $unreadCount > 0}
                <span class="ml-auto mr-4 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5">{$unreadCount > 99 ? '99+' : $unreadCount}</span>
                {/if}
            </div>
        </a>
        {/if}
        <a href="/settings">
            <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl {page.url.pathname.includes('/settings') ? 'bg-gray-300' : ''}">
    	        <span class="material-symbols-outlined mr-1 text-blue-600">{ user ? "settings" : "login" }</span>
                { user ? "設定" : "ログイン" }
            </div>
        </a>
        {#if user}
        <div class="flex items-center gap-1 mt-2 mr-4 pl-8">
            <a href="/users/{user.userId}">
                <img src={user.avatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-full aspect-square" loading="lazy"/>
            </a>
            <a href="/users/{user.userId}">
                <p class="text-sm hover:underline">{user.displayName}</p>
            </a>
            <p class="text-gray-500 text-sm">in</p>
        </div>
        <div class="flex items-center gap-1 mt-2 mr-4 pl-8">
            <a href="/organizations/{user.organizationId}">
                <img src={user.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 border-1 rounded-md aspect-square" loading="lazy"/>
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

<!-- モバイルフッター -->
<footer class="sm:hidden bg-gray-100/80 backdrop-blur-xl fixed bottom-0 w-full shadow-lg">
    <div class="grid grid-cols-5 w-full text-gray-600 font-bold">
        <a href="/projects">
		    <div class="text-xs flex flex-col items-center py-2 {page.url.pathname.includes('/projects') ? 'text-blue-600' : ''}">
			    <span class="material-symbols-outlined text-{page.url.pathname.includes('/projects') ? 'blue' : 'gray'}-600 mb-1 !text-2xl">public</span>
			    プロジェクト
		    </div>
        </a>
        <a href="/events">
		    <div class="text-xs flex flex-col items-center py-2 {page.url.pathname.includes('/events') ? 'text-blue-600' : ''}">
			    <span class="material-symbols-outlined text-{page.url.pathname.includes('/events') ? 'blue' : 'gray'}-600 mb-1 !text-2xl">event</span>
			    イベント
		    </div>
        </a>
        <a href="/polls">
		    <div class="text-xs flex flex-col items-center py-2 {page.url.pathname.includes('/polls') ? 'text-blue-600' : ''}">
			    <span class="material-symbols-outlined text-{page.url.pathname.includes('/polls') ? 'blue' : 'gray'}-600 mb-1 !text-2xl">quiz</span>
			    投票
		    </div>
        </a>
        <a href="/questions">
		    <div class="text-xs flex flex-col items-center py-2 {page.url.pathname.includes('/questions') ? 'text-blue-600' : ''}">
			    <span class="material-symbols-outlined text-{page.url.pathname.includes('/questions') ? 'blue' : 'gray'}-600 mb-1 !text-2xl">help</span>
			    質問
		    </div>
        </a>
        <a href={user ? '/notifications' : '/signin'}>
		    <div class="text-xs flex flex-col items-center py-2 relative {page.url.pathname.includes('/notifications') ? 'text-blue-600' : ''}">
                <span class="relative">
			        <span class="material-symbols-outlined text-{page.url.pathname.includes('/notifications') ? 'blue' : 'gray'}-600 mb-1 !text-2xl">notifications</span>
                    {#if $unreadCount > 0}
                    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[14px] h-3.5 flex items-center justify-center px-0.5">
                        {$unreadCount > 9 ? '9+' : $unreadCount}
                    </span>
                    {/if}
                </span>
			    通知
		    </div>
        </a>
	</div>
</footer>