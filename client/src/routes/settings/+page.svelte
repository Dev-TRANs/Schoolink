<script lang="ts">
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import type { UserType } from "../../lib/types";

    let user = $state<UserType>();

    onMount(async () => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        if(!sessionUuid){
            goto('/signin')
        }
        const userId = localStorage.getItem("userId")
        const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
        const data = await response.json();
        user = data.data;
    });

    const signOut = async () => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        localStorage.removeItem("sessionUuid")
        localStorage.removeItem("userId")
        await fetch(`${PUBLIC_API_URL}/auth/sign_out`, {
            method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                    sessionUuid,
            })
        })
        goto('/')
    }
</script>


{#if user}
<div class="w-full flex flex-col items-center px-5 sm:px-10 py-8 space-y-10">
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl items-center">
        <img class="rounded-full border border-gray-400 aspect-square w-32 h-32 mx-auto sm:mx-0" src={user.avatar} alt="avatar" />
        <div class="sm:col-span-2 flex flex-col justify-center space-y-2 text-center sm:text-left">
            <a href="/users/{user.userId}">
                <p class="text-3xl font-bold hover:underline">{user.displayName}</p>
                <p class="text-md text-gray-500">ID: <span class="bg-gray-100 px-2 py-0.5 rounded">{user.userId}</span></p>
            </a>
            <p class="text-md text-gray-500">
                所属: 
                <a class="hover:underline text-black" href="/organizations/{user.organizationId}">
                    {user.organizationDisplayName}
                </a>
            </p>
            {#if user.twitterId || user.instagramId || user.threadsId}
            <div class="flex flex-wrap justify-center sm:justify-start gap-3 text-sm text-gray-500">
                <span>SNS:</span>
                {#if user.twitterId}
                <a class="hover:underline text-blue-500" href="https://x.com/{user.twitterId}">Twitter</a>
                {/if}
                {#if user.instagramId}
                <a class="hover:underline text-pink-500" href="https://www.instagram.com/{user.instagramId}">Instagram</a>
                {/if}
                {#if user.threadsId}
                <a class="hover:underline text-purple-500" href="https://www.threads.net/@{user.threadsId}">Threads</a>
                {/if}
            </div>
            {/if}
        </div>
    </div>
    <div class="w-full mt-5">
        <p class="w-full text-center text-3xl font-bold">ユーザー設定</p>
        <a href="/settings/user/account">
            <p class="w-full text-center mt-3 text-2xl hover:underline">アカウント設定</p>
        </a>
        <a href="/settings/user/profile">
            <p class="w-full text-center mt-3 text-2xl hover:underline">プロフィール設定</p>
        </a>
    </div>
    {#if user.role === "admin"}
    <div class="w-full mt-5">
        <p class="w-full text-center text-3xl font-bold">組織設定</p>
        <a href="/settings/organization/users">
            <p class="w-full text-center mt-3 text-2xl hover:underline">ユーザー登録設定</p>
        </a>
        <a href="/settings/organization/profile">
            <p class="w-full text-center mt-3 text-2xl hover:underline">プロフィール設定</p>
        </a>
    </div>
    {/if}
    <button class="mt-5 button-red" onclick={signOut}>サインアウト</button>

    <div class="w-full mt-10 flex flex-col items-center gap-5">
        <p class="text-center text-3xl font-bold font-AllertaStencil">Project Schoolink</p>
        <a href="https://seitokaishinko.org/" target="_blank" rel="noopener noreferrer">
            <img src="/img/logo/seitokaishinko.png" alt="生徒会活動振興会" class="max-w-60" >
        </a>
        <a href="https://trans.stki.org/" target="_blank" rel="noopener noreferrer">
            <img src="/img/logo/trans.svg" alt="TRANs - 生徒会情報機構" class="max-w-30" >
        </a>
    </div>
</div>
{/if}