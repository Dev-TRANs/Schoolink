<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation";

    import FormInputField from "../../../../lib/components/FormInputField.svelte";
    import ImgField from "../../../../lib/components/ImgField.svelte"

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

    let sessionUuid = ""

    onMount(async () => {
        sessionUuid = localStorage.getItem("sessionUuid")
        if(!sessionUuid){
            goto('/signin')
        }
    });

    let user: userType = undefined

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
    
    async function handleSubmit(e) {
      formSubmitted = true;
      loading = true;
      errorMessage = '';
      
      try {
        data = new FormData(formElement);
        data.set("sessionUuid", sessionUuid);
        
        const response = await fetch(`${PUBLIC_API_URL}/users/${user.userId}`, {
          method: 'put',
          body: data
        });
        
        const result = await response.json();
        if (result.success !== true) {
          errorMessage = result.message || '送信に失敗しました。';
        }
      } catch (error) {
        console.error('Login error:', error);
        errorMessage = 'サーバーとの通信中にエラーが発生しました。';
      } finally {
        loading = false;
      }
    }
</script>

<div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/settings">＜ 設定</a>
    <p class="w-full text-center text-3xl font-bold mt-5">ユーザー設定/プロフィール設定</p>
    {#if user}
    <p class="w-full text-center text-2xl underline mt-5">アバター変更</p>
    <div class="w-1/2 mx-auto mt-3">
    <ImgField
        className="mb-5"
        containerClassName="w-full"
        id="avatar"
        name="avatar"
        label="アバター"
        src={user.avatar}
        uploadUrl="{PUBLIC_API_URL}/users/{user.userId}/avatar"
        autoUpload
        aspectRatio={1/1}
      />
    </div>
    <p class="w-full text-center text-2xl underline mt-5">プロフィール変更</p>
    <form on:submit|preventDefault={handleSubmit} class="mt-5 w-full" bind:this={formElement}>
      <FormInputField
        className="mb-5"
        id="displayName"
        name="displayName"
        label="表示名"
        error="表示名"
        value={user.displayName}
        showError={formSubmitted && !data?.get("displayName")}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="bio"
        name="bio"
        label="自己紹介"
        value={user.bio}
        disabled={loading}
        multiline={true}
        rows={5}
      />
      <FormInputField
        className="mb-5"
        id="instagramId"
        name="instagramId"
        label="InstagramのID"
        error="InstagramのID"
        value={user.instagramId}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="threadsId"
        name="threadsId"
        label="threadsのID"
        error="threadsのID"
        value={user.threadsId}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="twitterId"
        name="twitterId"
        label="TwitterのID"
        error="TwitterのID"
        value={user.twitterId}
        disabled={loading}
      />
      {#if errorMessage}
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mt-5">
          {errorMessage}
        </div>
      {/if}
      <button
        type="submit"
        class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed mt-5"
        disabled={loading}
      >
        {loading ? '送信中...' : '送信'}
      </button>
    </form>
    {/if}
</div>