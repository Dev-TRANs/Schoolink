<script lang="ts">
    //TODO: アカウント無効化
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation";

    import FormInputField from "../../../../lib/components/FormInputField.svelte";

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

    type organizationType = {
        organizationId: string;
        displayName: string;
        bio: string;
        avatar: string;
        instagramId: string;
        threadsId: string;
        twitterId: string;
        users: Omit<userType, "organizationId" | "organizationDisplayName" | "organizationAvatar">[]
    }

    let sessionUuid = ""

    let userId = ""

    onMount(async () => {
        sessionUuid = localStorage.getItem("sessionUuid")
        if(!sessionUuid){
            goto('/signin')
        }
    });

    let organization: organizationType

    async function loadOrganization() {
        sessionUuid = localStorage.getItem("sessionUuid")
        userId = localStorage.getItem("userId");
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
            let user: userType
            if(sessionData.isValid) {
                const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
                const data = await response.json();
                user = data.data as userType;
                const orgResponcse = await fetch(`${PUBLIC_API_URL}/organizations/${user.organizationId}`)
                const orgData = await orgResponcse.json()
                organization = orgData.data as organizationType;
            }
        } else {
            organization = undefined
        }
    } 
    
    onMount(loadOrganization);

    const adminizeUser = async (userId) => {
        try {
        const response = await fetch(`${PUBLIC_API_URL}/users/${userId}/role`, {
          method: 'put',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionUuid,
            organizationId: organization.organizationId
          })
        });
        
        const result = await response.json();

        if(result.success === true){
            organization.users = organization.users.map(user => (user.userId === userId) ? Object.assign({}, user, {role: (user.role === "admin"? "member" : "admin" )}) : user)
        } 
      } catch(e) {

      }
    }
  
  const generatePassword = (length = 12) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }

  let newUserId = '';
  let password = generatePassword();
  let displayName = '';
  let loading = false;
  let errorMessage = '';
  let formSubmitted = false;

  async function handleSubmit() {
    formSubmitted = true;
    
    if (!newUserId || !password) {
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
      const response = await fetch(`${PUBLIC_API_URL}/auth/create_account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newUserId,
          organizationId: organization.organizationId,
          hashedPassword,
          displayName,
          sessionUuid
        })
      });
      const result = await response.json();
      if (result.success === true) {
        loadOrganization()
      } else {
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
    <p class="w-full text-center text-3xl font-bold mt-5">組織設定/ユーザー登録設定</p>
    {#if organization}
    <p class="w-full text-center text-2xl underline mt-5">ユーザー追加</p>

    <form on:submit|preventDefault={handleSubmit} class="space-y-4 mt-5">
        <FormInputField
          id="newUserId"
          label="ユーザーID"
          bind:value={newUserId}
          error="ユーザーIDを入力してください"
          showError={formSubmitted && !newUserId}
          disabled={loading}
        />
        <FormInputField
          id="password"
          label="パスワード"
          bind:value={password}
          error="パスワードを入力してください"
          showError={formSubmitted && !password}
          disabled={loading}
        />
        <FormInputField
          id="displayName"
          label="表示名"
          bind:value={displayName}
          error="表示名を入力してください"
          showError={formSubmitted && !displayName}
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
          {loading ? '送信中...' : '送信'}
        </button>
    </form>
    <p class="w-full text-center text-2xl underline mt-5">ユーザー管理</p>
    {#each organization.users as user}
        <div class="grid grid-cols-6 gap-10 mt-5 ">
            <img class="rounded-full w-full m-3 border border-gray-500 border-1 rounded-full aspect-square my-auto" src={user.avatar} alt="avatar" />
            <div class="col-span-3 text-2xl font-bold flex items-center gap-1">
                {#if user.role === "admin"}
                <p class="material-symbols-outlined">
                    crown
                </p>
                {/if}
                <p>{user.displayName}</p>
                
            </div>
            {#if user.userId !== userId}
            <button class="{user.role === "admin" ? "button-violet" : "button-red"} col-span-2" on:click={() => adminizeUser(user.userId)}>
                {#if user.role === "admin"}
                非管理者にする
                {:else}
                管理者にする
                {/if}
            </button>
            {/if}
        </div>
    {/each}
    {/if}
</div>