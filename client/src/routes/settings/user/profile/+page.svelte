<svelte:head>
	<title>プロフィール設定 | ユーザー設定 | Schoolink</title>
</svelte:head>

<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation";

    import FormInputField from "../../../../lib/components/FormInputField.svelte";
    import ImgField from "../../../../lib/components/ImgField.svelte"
    import type { UserType } from "../../../../lib/types";

    let sessionUuid = ""

    onMount(async () => {
        sessionUuid = localStorage.getItem("sessionUuid")
        if(!sessionUuid){
            goto('/signin')
        }
    });

    let user: UserType = undefined

    async function loadUser() {
        sessionUuid = localStorage.getItem("sessionUuid")
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
            }
        } else {
            user = undefined
        }
    } 
    
    onMount(loadUser);

    let formElement: HTMLFormElement;
    let data: FormData;
    let loading = false;
    let errorMessage = '';
    let formSubmitted = false;

    // 修正7: アバターと他フォームを1つのフォームにまとめる
    // アバターは即時アップロードのままだが、保存ボタンで統括する流れを明示
    let avatarSaved = false;

    function handleAvatarUploadSuccess() {
        avatarSaved = true;
    }
    
    async function handleSubmit(e) {
      formSubmitted = true;
      loading = true;
      errorMessage = '';
      
      try {
        data = new FormData(formElement);
        data.set("sessionUuid", sessionUuid);
        
        const response = await fetch(`${PUBLIC_API_URL}/users/${user.userId}`, {
          method: 'PATCH',
          body: data
        });
        
        const result = await response.json();
        if (result.success !== true) {
          errorMessage = result.message || '送信に失敗しました。';
        } else {
          goto(`/users/${user.userId}`);
        }
      } catch (error) {
        console.error('Submit error:', error);
        errorMessage = 'サーバーとの通信中にエラーが発生しました。';
      } finally {
        loading = false;
      }
    }
</script>

<div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/settings">＜ 設定</a>
    <p class="w-full text-center text-3xl font-bold mt-5">プロフィール設定</p>
    {#if user}
    <!-- 修正7: アバターとプロフィールを同一フォーム内にまとめ、保存の流れを一本化 -->
    <form on:submit|preventDefault={handleSubmit} class="mt-6 w-full space-y-6" bind:this={formElement}>

        <!-- アバターセクション -->
        <div>
            <p class="text-lg font-bold text-gray-700 mb-2">アバター</p>
            <p class="text-sm text-gray-500 mb-3">画像をクリックすると変更できます。変更は自動的に保存されます。</p>
            <div class="w-1/2 mx-auto">
                <ImgField
                    className="mb-1"
                    containerClassName="w-full"
                    id="avatar"
                    name="avatar"
                    label=""
                    src={user.avatar}
                    uploadUrl="{PUBLIC_API_URL}/users/{user.userId}/avatar"
                    autoUpload
                    aspectRatio={1/1}
                    onUploadSuccess={handleAvatarUploadSuccess}
                />
            </div>
            {#if avatarSaved}
            <p class="text-center text-sm text-green-600 mt-1">✓ アバターを保存しました</p>
            {/if}
        </div>

        <hr class="border-gray-200"/>

        <!-- プロフィール情報セクション -->
        <div class="space-y-5">
            <p class="text-lg font-bold text-gray-700">プロフィール情報</p>
            <FormInputField
                id="displayName"
                name="displayName"
                label="表示名"
                error="表示名を入力してください"
                value={user.displayName}
                showError={formSubmitted && !data?.get("displayName")}
                disabled={loading}
            />
            <FormInputField
                id="bio"
                name="bio"
                label="自己紹介"
                value={user.bio}
                disabled={loading}
                multiline={true}
                rows={5}
            />
        </div>

        <hr class="border-gray-200"/>

        <!-- SNS・連絡先セクション -->
        <div class="space-y-5">
            <p class="text-lg font-bold text-gray-700">SNS・連絡先</p>
            <FormInputField
                id="instagramId"
                name="instagramId"
                label="Instagram ID"
                value={user.instagramId}
                disabled={loading}
            />
            <FormInputField
                id="threadsId"
                name="threadsId"
                label="Threads ID"
                value={user.threadsId}
                disabled={loading}
            />
            <FormInputField
                id="twitterId"
                name="twitterId"
                label="Twitter(X) ID"
                value={user.twitterId}
                disabled={loading}
            />
            <FormInputField
                id="email"
                name="email"
                label="メールアドレス"
                value={user.email}
                disabled={loading}
                type="email"
            />
        </div>

        {#if errorMessage}
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {errorMessage}
        </div>
        {/if}

        <button
            type="submit"
            class="w-full py-2 px-4 border border-sky-500 rounded-lg shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 active:bg-sky-700 transition focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
        >
            {loading ? '保存中...' : 'プロフィールを保存'}
        </button>
    </form>
    {/if}
</div>