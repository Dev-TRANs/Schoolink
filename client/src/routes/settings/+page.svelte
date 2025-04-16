<script>
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';

    import FormInputField from "../../../../lib/components/FormInputField.svelte";

    let userId = '';
    let sessionUuid = '';

    let currentPassword = '';
    let newPassword = '';
    let passwordFormLoading = false;
    let passwordFormErrorMessage = '';
    let passwordFormSubmitted = false;
  
    async function handlePasswordFormSubmit() {
      passwordFormSubmitted = true;
      
      if (!userId || !currentPassword || !newPassword) {
        passwordFormErrorMessage = 'すべての項目を入力してください。';
        return;
      }
  
      passwordFormLoading = true;
      passwordFormErrorMessage = '';
  
      try {
        const encoder = new TextEncoder();
        const currentPasswordData = encoder.encode(currentPassword);
        const currentHashBuffer = await crypto.subtle.digest('SHA-256', currentPasswordData);
        const hashedCurrentPassword = Array.from(new Uint8Array(currentHashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const newPasswordData = encoder.encode(newPassword);
        const newHashBuffer = await crypto.subtle.digest('SHA-256', newPasswordData);
        const hashedNewPassword = Array.from(new Uint8Array(newHashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const response = await fetch(`${PUBLIC_API_URL}/auth/change_password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionUuid,
            hashedCurrentPassword,
            hashedNewPassword
          })
        });
        const result = await response.json();
        if (result.success !== true)  {
          passwordFormErrorMessage = result.message || '認証に失敗しました。';
        }
      } catch (error) {
        console.error('Login error:', error);
        passwordFormErrorMessage = 'サーバーとの通信中にエラーが発生しました。';
      } finally {
        passwordFormLoading = false;
      }
    }
    
    let newUserId = '';
    let idFormLoading = false;
    let idFormErrorMessage = '';
    let idFormSubmitted = false;

    async function handleIdFormSubmit() {
      idFormSubmitted = true;
      
      if (!newUserId) {
        idFormErrorMessage = '新しいIDを入力してください。';
        return;
      }
  
      idFormLoading = true;
      idFormErrorMessage = '';
  
      try {
        const response = await fetch(`${PUBLIC_API_URL}/users/${userId}/id`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionUuid,
            newUserId,
          })
        });
        const result = await response.json();
        if (result.success !== true)  {
          idFormErrorMessage = result.message || '送信に失敗しました。';
        } else {
            localStorage.setItem("userId", newUserId);
            userId = newUserId;
        }
      } catch (error) {
        console.error('Error:', error);
        idFormErrorMessage = 'サーバーとの通信中にエラーが発生しました。';
      } finally {
        idFormLoading = false;
      }
    }
    
    onMount(async () => {
        sessionUuid = localStorage.getItem("sessionUuid");
        userId = localStorage.getItem("userId");
        if(!sessionUuid){
            goto('/signin');
        }
    });

</script>

<div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/settings">＜ 設定</a>
    <p class="w-full text-center text-3xl font-bold mt-5">ユーザー設定/アカウント設定</p>
    <p class="w-full text-center text-2xl underline mt-5">パスワード変更</p>
    <form on:submit|preventDefault={handlePasswordFormSubmit} class="space-y-4 mt-3">
        <FormInputField
          id="currentPassword"
          label="現在のパスワード"
          type="password"
          bind:value={currentPassword}
          error="現在のパスワードを入力してください"
          showError={passwordFormSubmitted && !currentPassword}
          disabled={passwordFormLoading}
        />
        <FormInputField
          id="newPassword"
          label="新しいパスワード"
          type="password"
          bind:value={newPassword}
          error="新しいパスワードを入力してください"
          showError={passwordFormSubmitted && !newPassword}
          disabled={passwordFormLoading}
        />
        {#if passwordFormErrorMessage}
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {passwordFormErrorMessage}
          </div>
        {/if}
        <button 
          type="submit" 
          class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          disabled={passwordFormLoading}
        >
          {passwordFormLoading ? '送信中...' : '送信'}
        </button>
        {#if passwordFormSubmitted && !passwordFormLoading && !passwordFormErrorMessage}
          <div class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            送信に成功しました
          </div>
        {/if}
    </form>
    <p class="w-full text-center text-2xl underline mt-5">ID変更</p>
    <form on:submit|preventDefault={handleIdFormSubmit} class="space-y-4 mt-3">
        <FormInputField
          id="newUserId"
          label="新しいID"
          bind:value={newUserId}
          error="新しいIDを入力してください"
          showError={idFormSubmitted && !newUserId}
          disabled={idFormLoading}
        />
        {#if idFormErrorMessage}
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {idFormErrorMessage}
          </div>
        {/if}
        <button 
          type="submit" 
          class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          disabled={idFormLoading}
        >
          {idFormLoading ? '送信中...' : '送信'}
        </button>
        {#if idFormSubmitted && !idFormLoading && !idFormErrorMessage}
          <div class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            送信に成功しました
          </div>
        {/if}
    </form>
</div>