<script lang="ts">
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    onMount(async () => {
        const sessionUuid = localStorage.getItem("sessionUuid")
        if(!sessionUuid){
            goto('/signin')
        }
    });
</script>