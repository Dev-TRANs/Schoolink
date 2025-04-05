<script>
    import { PUBLIC_API_URL } from "$env/static/public";
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    import FormInputField from "../../lib/components/FormInputField.svelte";
  
    let userId = '';
    let password = '';
    let loading = false;
    let errorMessage = '';
    let formSubmitted = false;
  
    async function handleSubmit() {
      formSubmitted = true;
      
      if (!userId || !password) {
        return;
      }
  
      loading = true;
      errorMessage = '';
  
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashedPassword = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        const response = await fetch(`${PUBLIC_API_URL}/auth/sign_in`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            hashedPassword
          })
        });
        const result = await response.json();
        if (result.success === true) {
          localStorage.setItem('sessionUuid', result.sessionUuid);
          localStorage.setItem('userId', result.userId);
          goto('/mypage');
        } else {
          errorMessage = result.message || 'ログインに失敗しました。';
        }
      } catch (error) {
        console.error('Login error:', error);
        errorMessage = 'サーバーとの通信中にエラーが発生しました。';
      } finally {
        loading = false;
      }
    }
    
    onMount(async () => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        if(sessionUuid){
            goto('/mypage')
        }
    });
</script>


<div class="flex flex-col justify-center items-center min-h-screen bg-white p-4">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">ログイン</h1>
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <FormInputField
          id="userId"
          label="ユーザーID"
          bind:value={userId}
          error="ユーザーIDを入力してください"
          showError={formSubmitted && !userId}
          disabled={loading}
        />
        <FormInputField
          id="password"
          label="パスワード"
          type="password"
          bind:value={password}
          error="パスワードを入力してください"
          showError={formSubmitted && !password}
          disabled={loading}
        />
        {#if errorMessage}
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {errorMessage}
          </div>
        {/if}
        <button 
          type="submit" 
          class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
    </form>
</div>