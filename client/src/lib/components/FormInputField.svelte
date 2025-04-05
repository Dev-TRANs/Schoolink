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
      class="w-full px-3 py-2 border {showError && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 {className}"
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
      class="w-full px-3 py-2 border {showError && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 {className}"
    />
  {/if}
  
  {#if showError && error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>