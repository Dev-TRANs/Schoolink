<script>
    import { PUBLIC_API_URL } from "$env/static/public";
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';
  
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
          goto('/');
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
            goto('/')
        }
    });
</script>


<div class="flex justify-center items-center min-h-screen bg-white p-4">
    <div class="bg-white p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-center text-gray-800 mb-6">ログイン</h1>
      
      <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div class="space-y-2">
          <label for="userId" class="block text-sm font-medium text-gray-700">ユーザーID</label>
          <input 
            type="text" 
            id="userId" 
            bind:value={userId} 
            class="w-full px-3 py-2 border {formSubmitted && !userId ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
          {#if formSubmitted && !userId}
            <p class="text-sm text-red-600">ユーザーIDを入力してください</p>
          {/if}
        </div>
        
        <div class="space-y-2">
          <label for="password" class="block text-sm font-medium text-gray-700">パスワード</label>
          <input 
            type="password" 
            id="password" 
            bind:value={password} 
            class="w-full px-3 py-2 border {formSubmitted && !password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            disabled={loading}
          />
          {#if formSubmitted && !password}
            <p class="text-sm text-red-600">パスワードを入力してください</p>
          {/if}
        </div>
        
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
</div>