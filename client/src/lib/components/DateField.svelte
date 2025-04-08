<script>
    export let id = "";
    export let name = "";
    export let label = "";
    export let value = ""; // Unixタイムスタンプとして扱う
    export let error = "";
    export let disabled = false;
    export let showError = false;
    export let className = "";
    export let dateLabel = "日付";
    export let timeLabel = "時刻";
  
    // 入力された日付と時刻
    let dateValue = "";
    let timeValue = "";
  
    // コンポーネントの初期化時に値が存在する場合、日付と時刻に変換
    $: {
      if (value && !dateValue && !timeValue) {
        const date = new Date(Number(value) * 1000);
        dateValue = formatDate(date);
        timeValue = formatTime(date);
      }
    }
  
    // 日付をYYYY-MM-DD形式に整形
    function formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  
    // 時刻をHH:MM形式に整形
    function formatTime(date) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  
    // 日付と時刻の両方が入力された場合にUnixタイムスタンプに変換
    function updateDateTime() {
      if (dateValue && timeValue) {
        const dateTimeString = `${dateValue}T${timeValue}:00`;
        const timestamp = Math.floor(new Date(dateTimeString).getTime() / 1000);
        if (!isNaN(timestamp)) {
          value = timestamp.toString();
        }
      }
    }
  
    // 日付更新ハンドラ
    function updateDate(event) {
      dateValue = event.target.value;
      updateDateTime();
    }
  
    // 時刻更新ハンドラ
    function updateTime(event) {
      timeValue = event.target.value;
      updateDateTime();
    }
  
    // 現在の日時をセット
    function setNow() {
      const now = new Date();
      dateValue = formatDate(now);
      timeValue = formatTime(now);
      updateDateTime();
    }
  </script>
  
  <div class="space-y-4">
    {#if label}
      <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
    {/if}
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="space-y-2">
        <label for={`${id}-date`} class="block text-sm font-medium text-gray-700">{dateLabel}</label>
        <input
          type="date"
          id={`${id}-date`}
          name={`${name}-date`}
          value={dateValue}
          on:input={updateDate}
          disabled={disabled}
          class="w-full px-3 py-2 border {showError && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 {className}"
        />
      </div>
      
      <div class="space-y-2">
        <label for={`${id}-time`} class="block text-sm font-medium text-gray-700">{timeLabel}</label>
        <input
          type="time"
          id={`${id}-time`}
          name={`${name}-time`}
          value={timeValue}
          on:input={updateTime}
          disabled={disabled}
          class="w-full px-3 py-2 border {showError && error ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 {className}"
        />
      </div>
    </div>
    
    <div class="flex items-center">
      <button 
        type="button" 
        on:click={setNow} 
        disabled={disabled}
        class="px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        現在の日時を設定
      </button>
      
      {#if value}
        <span class="ml-4 text-sm text-gray-500">
          Unix時間: {value}
        </span>
      {/if}
    </div>
    
    {#if showError && error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    
    <!-- フォームに送信用の隠しフィールドを追加 -->
    <input type="hidden" {name} {id} {value} />
  </div>