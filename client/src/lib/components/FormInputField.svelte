<script>
  export let id = "";
  export let name = "";
  export let label = "";
  export let value = "";
  export let error = "";
  export let disabled = false;
  export let showError = false;
  export let placeholder = "";
  export let type = "text";
  export let multiline = false;
  export let rows = 3;
  export let className = ""

  let isFocused = false;

  // バインディングのために双方向データフローを設定
  function updateValue(event) {
    value = event.target.value;
  }
</script>

<div class="space-y-2">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
  {/if}
  
  {#if multiline}
    <textarea
      {id}
      {name}
      {placeholder}
      {disabled}
      {rows}
      value={value}
      on:input={updateValue}
      on:focus={() => isFocused = true}
      on:blur={() => isFocused = false}
      class="w-full px-3 py-2 border rounded-lg shadow-sm transition
        {showError && error 
          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
          : isFocused || value
            ? 'border-sky-500 bg-sky-50 focus:border-sky-500 focus:ring-2 focus:ring-sky-200'
            : 'border-gray-300 hover:bg-sky-50 focus:border-sky-500 focus:ring-2 focus:ring-sky-200'
        }
        focus:outline-none {className}"
    ></textarea>
  {:else}
    <input
      {type}
      {id}
      {name}
      {placeholder}
      {disabled}
      value={value}
      on:input={updateValue}
      on:focus={() => isFocused = true}
      on:blur={() => isFocused = false}
      class="w-full px-3 py-2 border rounded-lg shadow-sm transition
        {showError && error 
          ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-200' 
          : isFocused || value
            ? 'border-sky-500 bg-sky-50 focus:border-sky-500 focus:ring-2 focus:ring-sky-200'
            : 'border-gray-300 hover:bg-sky-50 focus:border-sky-500 focus:ring-2 focus:ring-sky-200'
        }
        focus:outline-none {className}"
    />
  {/if}
  
  {#if showError && error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>