<script lang="ts">
    import { PUBLIC_API_URL } from "$env/static/public";
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onMount } from "svelte";
    import { get } from "svelte/store";

    const pollId = get(page).params.pollId;

    let poll: any = null;
    let userIds: {
        sessionUuid: string | undefined;
        clientUuid: string| undefined
    }
    let selectedChoice: string | null = null;

    onMount(async () => {
        userIds = {
            sessionUuid: localStorage.getItem("sessionUuid"),
            clientUuid: localStorage.getItem("clientUuid")
        }
        await loadPollData();
        await loadUserVote();
    });

    async function loadPollData() {
        const res = await fetch(`${PUBLIC_API_URL}/polls/${pollId}`);
        const data = await res.json();
        if (!data.success) {
            goto("/");
        } else {
            poll = data.data;
        }
    }

    async function loadUserVote() {
        const res = await fetch(`${PUBLIC_API_URL}/polls/${pollId}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userIds)
        });
        const data = await res.json();
        if (data.success && data.data?.choiceName) {
            selectedChoice = data.data.choiceName;
        }
    }

    async function vote(choiceName: string) {
        if (!userIds) return;

        const res = await fetch(`${PUBLIC_API_URL}/polls/${pollId}/vote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                choiceName,
                ...userIds
            })
        });

        const result = await res.json();
        if (result.success) {
            selectedChoice = choiceName;
            await loadPollData();  
        }
    }

    async function removePoll() {
        const sessionUuid = localStorage.getItem("sessionUuid");
        await fetch(`${PUBLIC_API_URL}/polls/${pollId}/is_valid`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ sessionUuid })
        });
        goto("/polls");
    }
</script>

{#if poll}
    <div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
        <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/polls">＜ 投票</a>
        <h1 class="text-3xl font-bold text-center mt-8">{poll.title}</h1>

        <div class="flex items-center gap-1 mt-2">
            <a href={`/users/${poll.userId}`}>
                <img src={poll.userAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-full" />
            </a>
            <a href={`/users/${poll.userId}`} class="text-sm hover:underline">{poll.userDisplayName}</a>
            <p class="text-gray-500 text-sm">in</p>
            <a href={`/organizations/${poll.organizationId}`}>
                <img src={poll.organizationAvatar} alt="avatar" class="size-7 border border-gray-500 rounded-md" />
            </a>
            <a href={`/organizations/${poll.organizationId}`} class="text-sm hover:underline">{poll.organizationDisplayName}</a>
        </div>

        {#if poll.thumbnail}
            <img src={poll.thumbnail} class="rounded-2xl mt-5 w-full aspect-[4/3]" alt="thumbnail"/>
        {/if}

        {#if poll.description}
            <div class="w-full bg-slate-100 mt-8 rounded-2xl p-5 whitespace-pre-line">
                {poll.description}
            </div>
        {/if}

        <div class="mt-5 w-full mb-20">
            {#each poll.pollChoices as choice}
                <button
                on:click={() => vote(choice.name)}
                class={`w-full border rounded-lg p-3 my-2 flex justify-between items-center transition
                    ${selectedChoice === choice.name
                        ? "bg-sky-100 border-sky-500 font-bold"
                        : "hover:bg-sky-100 border-gray-300"
                    }`}
                >
                <span>{choice.name}</span>
                <span class="text-sm text-gray-600">{choice.count}票</span>
            </button>
            {/each}
        </div>

        {#if poll.userId === localStorage.getItem("userId")}
            <div class="flex items-center justify-center w-full gap-4">
                <a class="button-violet" href={`/polls/${poll.pollId}/edit`}>編集</a>
                <button class="button-red" on:click={removePoll}>削除</button>
            </div>
        {/if}
    </div>
{/if}