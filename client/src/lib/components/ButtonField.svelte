<script>
  export let id = "";
  export let name = "";
  export let label = "";
  export let value = []; // デフォルトで0個
  export let error = "";
  export let disabled = false;
  export let showError = false;
  export let className = "";

  // 新しいボタンを追加
  function addButton() {
    value = [...value, { content: "", url: "" }];
  }

  // ボタンを削除
  function removeButton(index) {
    value = value.filter((_, i) => i !== index);
  }

  // コンテンツを更新
  function updateContent(index, newContent) {
    value = value.map((button, i) => {
      if (i === index) {
        return { ...button, content: newContent };
      }
      return button;
    });
  }

  // URLを更新
  function updateUrl(index, newUrl) {
    value = value.map((button, i) => {
      if (i === index) {
        return { ...button, url: newUrl };
      }
      return button;
    });
  }
  
  // フォーム送信用にJSON文字列に変換
  $: jsonValue = JSON.stringify(value);
</script>

<div class="space-y-4 {className}">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
  {/if}
  
  <div class="space-y-3">
    {#each value as button, index}
      <div class="flex space-x-2 items-start">
        <div class="flex-grow space-y-2">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="ボタンテキスト"
                value={button.content}
                disabled={disabled}
                on:input={(e) => updateContent(index, e.target.value)}
                class="w-full px-3 py-2 border rounded-lg shadow-sm transition
                  {showError && error 
                    ? 'border-red-500' 
                    : button.content 
                      ? 'border-sky-500 bg-sky-50' 
                      : 'border-gray-300 hover:bg-sky-50'
                  }
                  focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="URL"
                value={button.url}
                disabled={disabled}
                on:input={(e) => updateUrl(index, e.target.value)}
                class="w-full px-3 py-2 border rounded-lg shadow-sm transition
                  {showError && error 
                    ? 'border-red-500' 
                    : button.url 
                      ? 'border-sky-500 bg-sky-50' 
                      : 'border-gray-300 hover:bg-sky-50'
                  }
                  focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          on:click={() => removeButton(index)}
          disabled={disabled}
          aria-label="ボタンを削除"
          class="mt-1 p-2 border border-gray-300 rounded-lg transition hover:bg-sky-50 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    {/each}
  </div>
  
  <div class="flex justify-between items-center">
    <button
      type="button"
      on:click={addButton}
      disabled={disabled}
      class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white transition hover:bg-sky-50 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-500 {disabled ? 'opacity-50 cursor-not-allowed' : ''}"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
      </svg>
      ボタンを追加
    </button>
    
    {#if value.length > 0}
      <div class="text-sm text-gray-500">
        合計 {value.length} ボタン
      </div>
    {/if}
  </div>
  
  <!-- フォーム送信用の入力フィールド -->
  <input 
    type="hidden" 
    {name} 
    {id} 
    value={jsonValue} 
  />
  
  {#if showError && error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}

  {#if value.length === 0}
    <p class="text-sm text-gray-500">ボタンを追加するには「ボタンを追加」をクリックしてください。</p>
  {/if}
</div>