<svelte:head>
	<title>プロフィール設定 | 組織設定 | Schoolink</title>
</svelte:head>

<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation";

    import FormInputField from "../../../../lib/components/FormInputField.svelte";
    import ImgField from "../../../../lib/components/ImgField.svelte"
    import type { UserType, OrganizationType } from "../../../../lib/types";

    let sessionUuid = ""
    let imgFieldRef: ImgField;

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionUuid, userId })
            })
            const sessionData = await sessionResponse.json();
            if(sessionData.isValid) {
                const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
                const data = await response.json();
                const user = data.data as UserType;
                const orgResponse = await fetch(`${PUBLIC_API_URL}/organizations/${user.organizationId}`)
                const orgData = await orgResponse.json()
                organization = orgData.data as OrganizationType;
            }
        } else {
            organization = undefined
        }
    }

    onMount(loadOrganization);

    let formElement: HTMLFormElement;
    let data: FormData;
    let loading = false;
    let errorMessage = '';
    let formSubmitted = false;
    let avatarChanged = false;

    async function handleSubmit(e) {
        formSubmitted = true;
        loading = true;
        errorMessage = '';

        try {
            // アバターが変更されていればまず画像をアップロード
            if (avatarChanged && imgFieldRef) {
                await imgFieldRef.manualUpload();
            }

            // プロフィール情報を更新
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
            console.error('Submit error:', error);
            errorMessage = 'サーバーとの通信中にエラーが発生しました。';
        } finally {
            loading = false;
        }
    }
</script>

<div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/settings">＜ 設定</a>
    <p class="w-full text-center text-3xl font-bold mt-5">組織プロフィール設定</p>
    {#if organization}
    <form on:submit|preventDefault={handleSubmit} class="mt-5 w-full" bind:this={formElement}>
        <!-- アバター -->
        <p class="text-sm font-medium text-gray-700 mb-2">アバター</p>
        <div class="w-1/2 mx-auto mb-6">
            <ImgField
                bind:this={imgFieldRef}
                containerClassName="w-full"
                id="avatar"
                name="avatar"
                src={organization.avatar}
                uploadUrl="{PUBLIC_API_URL}/organizations/{organization.organizationId}/avatar"
                aspectRatio={1/1}
                on:imgfieldchange={() => avatarChanged = true}
            />
        </div>
        <p class="text-xs text-gray-400 text-center -mt-4 mb-6">クリックして画像を変更</p>

        <!-- プロフィール情報 -->
        <FormInputField
            className="mb-5"
            id="displayName"
            name="displayName"
            label="表示名"
            error="表示名を入力してください"
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
            value={organization.instagramId}
            disabled={loading}
        />
        <FormInputField
            className="mb-5"
            id="threadsId"
            name="threadsId"
            label="ThreadsのID"
            value={organization.threadsId}
            disabled={loading}
        />
        <FormInputField
            className="mb-5"
            id="twitterId"
            name="twitterId"
            label="TwitterのID"
            value={organization.twitterId}
            disabled={loading}
        />
        <FormInputField
            className="mb-5"
            id="email"
            name="email"
            label="メールアドレス"
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
            {loading ? '保存中...' : '保存する'}
        </button>
    </form>
    {/if}
</div>