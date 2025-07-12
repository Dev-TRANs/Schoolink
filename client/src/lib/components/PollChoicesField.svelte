<script>
    export let id = "";
    export let name = "";
    export let label = "";
    export let value = []; 
    export let error = "";
    export let disabled = false;
    export let showError = false;
    export let className = "";
  
    function addChoice() {
      value = [...value, ""];
    }
  
    function removeChoice(index) {
      value = value.filter((_, i) => i !== index);
    }
  
    function updateChoice(index, newValue) {
      value = value.map((choice, i) => (i === index ? newValue : choice));
    }
  
    $: jsonValue = JSON.stringify(value);
  </script>
  
  <div class={`space-y-4 ${className}`}>
    {#if label}
      <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
    {/if}
  
    <div class="space-y-3">
      {#each value as choice, index}
        <div class="flex space-x-2 items-center">
          <input
            type="text"
            class="w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            placeholder="選択肢を入力"
            bind:value={value[index]}
            on:input={(e) => updateChoice(index, e.target.value)}
            disabled={disabled}
          />
          <button
            type="button"
            class="p-2 border rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            on:click={() => removeChoice(index)}
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M6 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  
    <div class="flex justify-between items-center mt-4">
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        on:click={addChoice}
        disabled={disabled}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        選択肢を追加
      </button>
  
      {#if value.length > 0}
        <p class="text-sm text-gray-500">合計 {value.length} 個</p>
      {/if}
    </div>
  
    <input type="hidden" {id} {name} value={jsonValue} />
  
    {#if showError && error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
  
    {#if value.length === 0}
      <p class="text-sm text-gray-500">「選択肢を追加」をクリックしてください。</p>
    {/if}
  </div>
  