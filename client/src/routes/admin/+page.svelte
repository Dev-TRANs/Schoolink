<script lang="ts">
  import { PUBLIC_API_URL } from "$env/static/public";
  import { onMount } from 'svelte';
  import { goto } from "$app/navigation";
  import type { UserType } from "../../lib/types";
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
</script>

{#if user && user.role === 'admin'}
  <div class="mx-5">
      <p class="text-normal">
          <a href="/about" class="underline text-sky-600">つながる学生のためのプラットフォーム、Schoolinkを知る→</a>
      </p>
      <h1 class="mt-3 text-4xl font-bold">管理者パネル</h1>
  </div>
{:else if user}
  <h1>Access Denied</h1>
  <p>You do not have permission to access this page.</p>
{/if}
