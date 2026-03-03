<script lang="ts">
    import { page } from '$app/stores';
    import FormInputField from "../../../../lib/components/FormInputField.svelte";
    import ImgField from "../../../../lib/components/ImgField.svelte";
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import type { QuestionType } from '../../../../lib/types';

    const questionId = $page.params.questionId;

    let question: QuestionType;
    let userId: string;
    let formElement: HTMLFormElement;
    let data: FormData;
    let loading = false;
    let errorMessage = '';
    let formSubmitted = false;

    onMount(async () => {
        userId = localStorage.getItem("userId") ?? '';
        const sessionUuid = localStorage.getItem("sessionUuid");
        if (!sessionUuid) {
            goto('/signin');
            return;
        }

        const response = await fetch(`${PUBLIC_API_URL}/questions/${questionId}`);
        const questionData = await response.json();

        if (!questionData?.success || !questionData.data) {
            goto("/questions");
            return;
        }

        question = questionData.data;

        if (question.userId !== userId) {
            goto('/questions/' + question.questionId);
        }
    });

    async function handleSubmit(e: Event) {
        formSubmitted = true;
        loading = true;
        errorMessage = '';

        try {
            data = new FormData(formElement);
            data.set("sessionUuid", localStorage.getItem("sessionUuid") || "");

            const thumbnail = data.get("thumbnail") as File;
            if (!thumbnail || (thumbnail instanceof File && thumbnail.size === 0)) {
                data.delete("thumbnail");
            }

            const response = await fetch(`${PUBLIC_API_URL}/questions/${question.questionId}`, {
                method: 'PATCH',
                body: data
            });

            const result = await response.json();
            if (result.success === true) {
                goto('/questions/' + question.questionId);
            } else {
                errorMessage = result.message || '送信に失敗しました。';
            }
        } catch (error) {
            console.error('Question update error:', error);
            errorMessage = 'サーバーとの通信中にエラーが発生しました。';
        } finally {
            loading = false;
        }
    }
</script>
<svelte:head>
	<title>{question ? question.title + " | 質問を編集 | Schoolink" : "質問を編集 | Schoolink"}</title>
</svelte:head>


{#if question}
<div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/questions/{question.questionId}">＜ 閲覧画面</a>
    <h1 class="text-3xl font-bold mt-8">{question.title}</h1>

    <form on:submit|preventDefault={handleSubmit} class="mt-5 w-full" bind:this={formElement}>
        <ImgField
            className="mb-5"
            containerClassName="w-full"
            id="thumbnail"
            name="thumbnail"
            label="サムネイル"
            src={question.thumbnail}
            disabled={loading}
            aspectRatio={4/3}
        />

        <FormInputField
            className="mb-5"
            id="title"
            name="title"
            label="タイトル"
            error="タイトルを入力してください"
            value={question.title}
            showError={formSubmitted && !data?.get("title")}
            disabled={loading}
        />

        <FormInputField
            className="mb-5"
            id="description"
            name="description"
            label="説明"
            value={question.description}
            disabled={loading}
            multiline={true}
            rows={5}
        />

        {#if errorMessage}
            <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mt-5">
                {errorMessage}
            </div>
        {/if}

        <button
            type="submit"
            class="w-full py-2 px-4 border border-sky-500 rounded-lg shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 active:bg-sky-700 transition focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed disabled:opacity-50 mt-5"
            disabled={loading}
        >
            {loading ? '送信中...' : '送信'}
        </button>
    </form>
</div>
{/if}
