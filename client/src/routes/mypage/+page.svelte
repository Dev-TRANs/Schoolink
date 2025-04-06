<script lang="ts">
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import Button from '$lib/components/Button.svelte';
    onMount(async () => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        if(!sessionUuid){
            goto('/signin')
        }
    });
    const signOut = async () => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        localStorage.removeItem("sessionUuid")
        localStorage.removeItem("userId")
        await fetch(`${PUBLIC_API_URL}/auth/sign_out`, {
            method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                    sessionUuid,
            })
        })
        goto('/')
    }
</script>

<button class="bg-transparent text-violet-800 hover:bg-violet-800 hover:text-white transition border border-violet-800 rounded px-5 py-2 text-xl w-full" on:click={signOut}>サインアウト</button>