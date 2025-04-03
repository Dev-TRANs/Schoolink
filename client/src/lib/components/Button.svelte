<script>
    export let className = "";
    export let href="#"
</script>

<a href={href}>
    <button class="bg-transparent text-violet-800 hover:bg-violet-800 hover:text-white transition border border-violet-800 rounded px-5 py-2 text-xl {className}">
        <slot />
    </button>
</a>
