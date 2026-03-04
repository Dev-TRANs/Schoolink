<svelte:head>
	<title>プロフィール設定 | 組織設定 |  Schoolink</title>
</svelte:head>

<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation";

    import FormInputField from "../../../../lib/components/FormInputField.svelte";
    import ImgField from "../../../../lib/components/ImgField.svelte"
    import type { UserType, OrganizationType } from "../../../../lib/types";

    let sessionUuid = ""

    onMount(async () => {
        sessionUuid = localStorage.getItem("sessionUuid")
        if(!sessionUuid){
            goto('/signin')
        }
    });

    let organization: OrganizationType

    async function loadOrganization() {
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
            let user: UserType
            if(sessionData.isValid) {
                const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
                const data = await response.json();
                user = data.data as UserType;
                const orgResponcse = await fetch(`${PUBLIC_API_URL}/organizations/${user.organizationId}`)
                const orgData = await orgResponcse.json()
                organization = orgData.data as OrganizationType;
            }
        } else {
            organization = undefined
        }
    } 
    
    onMount(loadOrganization);


    // プロフィール帳アップロード
    let profileBookLoading = false;
    let profileBookError = '';
    let profileBookSuccess = false;

    async function handleProfileBookUpload(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        if (file.type !== 'application/pdf') {
            profileBookError = 'PDFファイルを選択してください。';
            return;
        }
        profileBookLoading = true;
        profileBookError = '';
        profileBookSuccess = false;
        try {
            const formData = new FormData();
            formData.set('sessionUuid', sessionUuid);
            formData.set('profileBook', file);
            const response = await fetch(`${PUBLIC_API_URL}/organizations/${organization.organizationId}/profile_book`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                profileBookSuccess = true;
            } else {
                profileBookError = result.message || 'アップロードに失敗しました。';
            }
        } catch (error) {
            console.error('Profile book upload error:', error);
            profileBookError = 'サーバーとの通信中にエラーが発生しました。';
        } finally {
            profileBookLoading = false;
        }
    }
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
        
        const response = await fetch(`${PUBLIC_API_URL}/organizations/${organization.organizationId}`, {
          method: 'PATCH',
          body: data
        });
        
        const result = await response.json();
        if (result.success !== true) {
          errorMessage = result.message || '送信に失敗しました。';
        } else {
          goto(`/organizations/${organization.organizationId}`);
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
    <p class="w-full text-center text-3xl font-bold mt-5">組織設定/プロフィール設定</p>
    {#if organization}
    <p class="w-full text-center text-2xl underline mt-5">アバター変更</p>
    <div class="w-1/2 mx-auto mt-3">
    <ImgField
        className="mb-5"
        containerClassName="w-full"
        id="avatar"
        name="avatar"
        label="アバター"
        src={organization.avatar}
        uploadUrl="{PUBLIC_API_URL}/organizations/{organization.organizationId}/avatar"
        autoUpload
        aspectRatio={1/1}
      />
    </div>

    <p class="w-full text-center text-2xl underline mt-5">プロフィール帳</p>
    <div class="w-full mt-3 mb-2">
        {#if organization.profileBook}
        <div class="mb-3">
            <p class="text-sm text-gray-500 mb-1">現在のプロフィール帳:</p>
            <a href={organization.profileBook} target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:underline text-sm">PDFを開く →</a>
        </div>
        {/if}
        <label class="block text-sm font-medium text-gray-700 mb-1">PDFをアップロード</label>
        <input
            type="file"
            accept="application/pdf"
            on:change={handleProfileBookUpload}
            disabled={profileBookLoading}
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-50 file:text-sky-600 hover:file:bg-sky-100 disabled:opacity-50"
        />
        {#if profileBookLoading}
        <p class="text-sm text-gray-500 mt-2">アップロード中...</p>
        {/if}
        {#if profileBookSuccess}
        <p class="text-sm text-green-600 mt-2">アップロードが完了しました。</p>
        {/if}
        {#if profileBookError}
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mt-2 text-sm">{profileBookError}</div>
        {/if}
    </div>
    <p class="w-full text-center text-2xl underline mt-5">プロフィール変更</p>
    <form on:submit|preventDefault={handleSubmit} class="mt-5 w-full" bind:this={formElement}>
      <FormInputField
        className="mb-5"
        id="displayName"
        name="displayName"
        label="表示名"
        error="表示名"
        value={organization.displayName}
        showError={formSubmitted && !data?.get("displayName")}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="bio"
        name="bio"
        label="自己紹介"
        value={organization.bio}
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
        value={organization.instagramId}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="threadsId"
        name="threadsId"
        label="threadsのID"
        error="threadsのID"
        value={organization.threadsId}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="twitterId"
        name="twitterId"
        label="TwitterのID"
        error="TwitterのID"
        value={organization.twitterId}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="email"
        name="email"
        label="メールアドレス"
        error="メールアドレス"
        value={organization.email}
        disabled={loading}
        type="email"
      />
      {#if errorMessage}
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mt-5">
          {errorMessage}
        </div>
      {/if}
      <button
        type="submit"
        class="w-full py-2 px-4 border border-sky-500 rounded-lg shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 active:bg-sky-700 transition focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 mt-5"
        disabled={loading}
      >
        {loading ? '送信中...' : '送信'}
      </button>
    </form>
    {/if}
</div>