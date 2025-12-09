<script lang="ts">
    import { page } from '$app/stores';
    import FormInputField from "../../../../lib/components/FormInputField.svelte";
    import ImgField from "../../../../lib/components/ImgField.svelte";
    import PollChoicesField from "../../../../lib/components/PollChoicesField.svelte";
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    import type { PollType } from '../../../../lib/types';
  
    const pollId = $page.params.pollId;
  
    let poll: PollType;
    let userId: string;
    let formElement: HTMLFormElement;
    let data: FormData;
    let loading = false;
    let errorMessage = '';
    let formSubmitted = false;
  
    onMount(async () => {
      userId = localStorage.getItem("userId");
      const sessionUuid = localStorage.getItem("sessionUuid");
      if (!sessionUuid) {
        goto('/signin');
        return;
      }
  
      const response = await fetch(`${PUBLIC_API_URL}/polls/${pollId}`);
      const pollData = await response.json();
  
      if (!pollData?.success || !pollData.data) {
        goto("/");
        return;
      }
  
      poll = pollData.data;
  
      if (poll.userId !== userId) {
        goto('/polls/' + poll.pollId);
      }
    });
  
    async function handleSubmit(e: Event) {
      formSubmitted = true;
      loading = true;
      errorMessage = '';
  
      try {
        data = new FormData(formElement);
        data.set("sessionUuid", localStorage.getItem("sessionUuid") || "");
  
        // 画像が未選択（既存画像のまま）の場合削除
        const thumbnail = data.get("thumbnail") as File;
        if (!thumbnail || (thumbnail instanceof File && thumbnail.size === 0)) {
          data.delete("thumbnail");
        }
  
        const response = await fetch(`${PUBLIC_API_URL}/polls/${poll.pollId}`, {
          method: 'PUT',
          body: data
        });
  
        const result = await response.json();
        if (result.success === true) {
          goto('/polls/' + poll.pollId);
        } else {
          errorMessage = result.message || '送信に失敗しました。';
        }
      } catch (error) {
        console.error('Poll update error:', error);
        errorMessage = 'サーバーとの通信中にエラーが発生しました。';
      } finally {
        loading = false;
      }
    }
  </script>
  
  {#if poll}
    <div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
      <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/polls/{poll.pollId}">＜ 閲覧画面</a>
      <h1 class="text-3xl font-bold text-center mt-8">{poll.title}</h1>
  
      <form on:submit|preventDefault={handleSubmit} class="mt-5 w-full" bind:this={formElement}>
        <ImgField
          className="mb-5"
          containerClassName="w-full"
          id="thumbnail"
          name="thumbnail"
          label="サムネイル"
          src={poll.thumbnail}
          disabled={loading}
          aspectRatio={4/3}
        />
  
        <FormInputField
          className="mb-5"
          id="title"
          name="title"
          label="タイトル"
          error="タイトルを入力してください"
          value={poll.title}
          showError={formSubmitted && !data?.get("title")}
          disabled={loading}
        />
  
        <FormInputField
          className="mb-5"
          id="description"
          name="description"
          label="説明"
          value={poll.description}
          disabled={loading}
          multiline={true}
          rows={5}
        />
  
        <PollChoicesField
          className="mb-5"
          id="choices"
          name="choices"
          label="選択肢"
          value={poll.pollChoices.map(choice => choice.name)}
          disabled={loading}
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
  