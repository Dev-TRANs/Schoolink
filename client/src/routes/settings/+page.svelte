<script lang="ts">
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";

    type userType = {
        userId: string;
        displayName: string;
        bio: string | null;
        avatar: string;
        instagramId: string | null;
        threadsId: string | null;
        twitterId: string | null;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
        role: "admin" | "member";
    };

    let user = $state<userType>();

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
<div class="w-full flex flex-col mx-auto px-5 sm:px-10 items-center">
    <div class="grid grid-cols-3 gap-10 max-w-lg">
        <img class="rounded-full w-full m-3 border border-gray-500 border-1 rounded-full aspect-square" src={user.avatar} alt="avatar" />
        <div class="col-span-2 flex flex-col justify-center">
            <a href="/users/{user.userId}">
                <p class="text-3xl font-bold hover:underline">{user.displayName}<span class="ml-1 text-3xl text-gray-500 hover:underline">@{user.userId}</span></p>
            </a>
            <p class="text-md text-gray-500 truncate">in <a class="hover:underline text-black" href="/organizations/{user.organizationId}">{user.organizationDisplayName}</a></p>
            <div class="flex items-center gap-1">
                {#if user.twitterId || user.instagramId || user.threadsId}
                <p class="text-gray-500">SNS:</p>
                {/if}
                {#if user.twitterId}
                <a class="hover:underline" href="https://x.com/{user.twitterId}">Twitter</a>
                {/if}
                {#if user.instagramId}
                <a class="hover:underline" href="https://www.instagram.com/{user.instagramId}">Instagram</a>
                {/if}
                {#if user.threadsId}
                <a class="hover:underline" href="https://www.threads.net/@{user.threadsId}">Threads</a>
                {/if}
            </div>
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
</div>
{/if}