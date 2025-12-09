<script>
    export let id = "";
    export let name = "";
    export let label = "";
    export let value = []; 
    export let error = "";
    export let disabled = false;
    export let showError = false;
    export let className = "";
  
    let focusedIndex = -1;
  
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
            class="w-full px-3 py-2 border rounded-lg shadow-sm transition
              {focusedIndex === index || value[index]
                ? 'border-sky-500 bg-sky-50 focus:border-sky-500 focus:ring-2 focus:ring-sky-200'
                : 'border-gray-300 hover:bg-sky-50 focus:border-sky-500 focus:ring-2 focus:ring-sky-200'
              }
              focus:outline-none disabled:opacity-50"
            placeholder="選択肢を入力"
            bind:value={value[index]}
            on:input={(e) => updateChoice(index, e.target.value)}
            on:focus={() => focusedIndex = index}
            on:blur={() => focusedIndex = -1}
            disabled={disabled}
          />
          <button
            type="button"
            class="p-2 border border-gray-300 rounded-lg shadow-sm transition hover:bg-sky-50 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
            on:click={() => removeChoice(index)}
            disabled={disabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  
    <div class="flex justify-between items-center mt-4">
      <button
        type="button"
        class="inline-flex items-center px-4 py-2 border border-sky-500 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white transition hover:bg-sky-50 active:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:opacity-50"
        on:click={addChoice}
        disabled={disabled}
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-sky-600" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        選択肢を追加
      </button>
  
      {#if value.length > 0}
        <p class="text-sm text-gray-600">合計 {value.length} 個</p>
      {/if}
    </div>
  
    <input type="hidden" {id} {name} value={jsonValue} />
  
    {#if showError && error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
  
    {#if value.length === 0}
      <p class="text-sm text-gray-600">「選択肢を追加」をクリックしてください。</p>
    {/if}
  </div>