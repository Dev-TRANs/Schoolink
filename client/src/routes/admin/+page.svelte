<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from 'svelte';
  import { sessionManager } from "../../lib/stores/session.svelte";

  let user = $derived(sessionManager.user);

  onMount(() => {
      if(!sessionManager.sessionUuid){
          goto('/signin')
      }
  });
</script>

{#if user && user.role === 'admin'}
  <div class="mx-5">
      <h1 class="mt-3 text-4xl font-bold">管理者パネル</h1>
      <div class="w-full flex justify-center">
        <a href="/admin/organizations" class="button-violet w-full max-w-4xl">組織管理</a>
        
      </div>
  </div>
{:else if user}
  <h1>Access Denied</h1>
  <p>You do not have permission to access this page.</p>
{/if}
