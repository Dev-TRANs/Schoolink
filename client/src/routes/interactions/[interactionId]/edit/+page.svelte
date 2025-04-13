<script lang="ts">
    import { page } from '$app/stores';
    import FormInputField from "../../../../lib/components/FormInputField.svelte";
    import ImgField from "../../../../lib/components/ImgField.svelte";
    import ButtonField from "../../../../lib/components/ButtonField.svelte";
    import { goto } from "$app/navigation";
    import { PUBLIC_API_URL } from "$env/static/public";
    import { onMount } from "svelte";
    
    type interactionType = {
        interactionId: string;
        title: string
        description: string;
        buttons: Array<{ content: string, url: string }>;
        thumbnail: string;
        userId: string;
        userDisplayName: string;
        userAvatar: string;
        organizationId: string;
        organizationDisplayName: string;
        organizationAvatar: string;
    };

    const interactionId = $page.params.interactionId;

    let interaction;

    let userId;

    onMount(async () => {
        userId = localStorage.getItem("userId")
        const response = await fetch(`${PUBLIC_API_URL}/interactions/${interactionId}`);
        const interactionData = await response.json();
        if(!interactionData){
            goto("/")   
        }
        interaction = interactionData.data
        if(interaction.userId !== userId){
            goto('/interactions/' + interaction.interactionId)
        }
    });

    let formElement: HTMLFormElement;
    let data: FormData;
    let loading = false;
    let errorMessage = '';
    let formSubmitted = false;
    let organizationId = "";
    
    async function handleSubmit(e) {
      formSubmitted = true;
      loading = true;
      errorMessage = '';
      
      try {
        data = new FormData(formElement);
        data.set("sessionUuid", localStorage.getItem("sessionUuid"));
        data.set("organizationId", organizationId);
        
        const thumbnail = data.get("thumbnail") as File;
        if (!thumbnail.size) {
          data.delete("thumbnail");
        }
        
        const response = await fetch(`${PUBLIC_API_URL}/interactions/${interaction.interactionId}`, {
          method: 'put',
          body: data
        });
        
        const result = await response.json();
        if (result.success === true) {
          goto('/interactions/' + interaction.interactionId);
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
    
    onMount(async () => {
      const sessionUuid = localStorage.getItem("sessionUuid");
      if(!sessionUuid){
        goto('/signin');
      } else {
        const userId = localStorage.getItem("userId");
        const response = await fetch(`${PUBLIC_API_URL}/users/${userId}`);
        const data = await response.json();
        organizationId = data.data.organizationId;
      }
    });
  </script>
  
  {#if interaction}
  <div class="w-full flex items-center flex-col max-w-lg mx-auto px-5">
    <a class="text-lg text-sky-600 text-left w-full hover:underline" href="/interactions/{interaction.interactionId}">＜ 閲覧画面</a>
    <h1 class="text-3xl font-bold text-cente mt-8">{interaction.title}</h1>
    <form on:submit|preventDefault={handleSubmit} class="mt-5 w-full" bind:this={formElement}>
      <ImgField
        className="mb-5"
        containerClassName="w-full"
        id="thumbnail"
        name="thumbnail"
        label="サムネイル"
        src={interaction.thumbnail}
        disabled={loading}
        aspectRatio={4/3}
      />
      <FormInputField
        className="mb-5"
        id="title"
        name="title"
        label="タイトル"
        error="タイトルを入力してください"
        value={interaction.title}
        showError={formSubmitted && !data?.get("title")}
        disabled={loading}
      />
      <FormInputField
        className="mb-5"
        id="description"
        name="description"
        label="説明"
        value={interaction.description}
        disabled={loading}
        multiline={true}
        rows={5}
      />
      <ButtonField
        className="mb-5"
        id="buttons"
        name="buttons"
        label="ボタン"
        value={interaction.buttons}
        disabled={loading}
      />
      {#if errorMessage}
        <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mt-5">
          {errorMessage}
        </div>
      {/if}
      <button
        type="submit"
        class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-not-allowed mt-5"
        disabled={loading}
      >
        {loading ? '送信中...' : '送信'}
      </button>
    </form>
  </div>
  {/if}