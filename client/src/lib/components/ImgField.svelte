<script>
  export let id = "";
  export let name = "";
  export let label = "";
  export let aspectRatio = 1; // 1 = 正方形, 16/9 = 横長, 3/4 = 縦長 など
  export let value = ""; // プレビュー表示用のURL/base64データ
  export let error = "";
  export let disabled = false;
  export let showError = false;
  export let src = ""; // 初期表示画像
  export let className = ""; // コンポーネント全体のカスタムクラス
  export let containerClassName = ""; // 画像コンテナのサイズを指定するクラス (デフォルトはw-48 = 12rem)
  export let uploadUrl = ""; // アップロード先URL (空文字の場合は即時アップロードしない)
  export let autoUpload = false; // trueの場合、画像選択後に即時アップロード
  export let onUploadSuccess = null; // アップロード成功時のコールバック
  export let onUploadError = null; // アップロード失敗時のコールバック
  
  let fileInput;
  let preview = src;
  let isUploading = false;
  let currentBlob = null; // 現在の処理済みBlobを保持
  let fileName = "image.png"; // アップロードするファイル名
  let hiddenInput; // Form送信用の隠しinput要素への参照
  
  // コンポーネント初期化時に値がある場合はプレビューを設定
  $: {
    if (value && value !== preview) {
      preview = value;
    }
  }
  
  // バインディングのために双方向データフローを設定
  function updateValue(newPreviewUrl, blob) {
    value = newPreviewUrl;
    
    // このイベントがフォームに伝わるように特別なカスタムイベントを発行
    const event = new CustomEvent('imgfieldchange', { 
      bubbles: true, // 親要素に伝播させる
      detail: { 
        fieldName: name,
        value: newPreviewUrl, 
        blob: blob,
        fileName: fileName
      } 
    });
    fileInput.dispatchEvent(event);
    
    // Blobをフォームデータとして使えるようにする特殊処理
    if (hiddenInput && blob) {
      // FormDataでアクセスできるようにFile形式に変換
      const processedFile = new File([blob], fileName, { type: 'image/png' });
      
      // データ転送オブジェクトを作成（ファイルをドラッグ＆ドロップしたように）
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(processedFile);
      
      // 隠しinputのfilesプロパティを更新
      hiddenInput.files = dataTransfer.files;
      
      // 変更イベントを発火させてフォームにファイルの変更を通知
      const changeEvent = new Event('change', { bubbles: true });
      hiddenInput.dispatchEvent(changeEvent);
      
    }
  }
  
  // 外部から現在のBlobを取得できるようにするメソッド
  export function getCurrentBlob() {
    return currentBlob;
  }
  
  // 外部から現在のファイル名を取得できるようにするメソッド
  export function getFileName() {
    return fileName;
  }
  
  // 外部から手動アップロードを呼び出せるようにエクスポート
  export function manualUpload() {
    if (uploadUrl && currentBlob) {
      return uploadImage(currentBlob);
    }
    return Promise.reject("No image to upload or upload URL not specified");
  }
  
  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    fileName = file.name; // ファイル名を保存
    
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.src = e.target.result;
      img.onload = function() {
        const srcWidth = img.width;
        const srcHeight = img.height;
        let cropWidth, cropHeight;
        
        // アスペクト比に基づいて切り抜く領域を計算
        const targetAspectRatio = aspectRatio;
        const sourceAspectRatio = srcWidth / srcHeight;
        
        let startX = 0;
        let startY = 0;
        
        if (sourceAspectRatio > targetAspectRatio) {
          // 画像が目標より横長の場合は幅を切る
          cropHeight = srcHeight;
          cropWidth = srcHeight * targetAspectRatio;
          startX = (srcWidth - cropWidth) / 2;
        } else {
          // 画像が目標より縦長の場合は高さを切る
          cropWidth = srcWidth;
          cropHeight = srcWidth / targetAspectRatio;
          startY = (srcHeight - cropHeight) / 2;
        }
        
        // キャンバスサイズを適切に設定
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        
        
        // 画像を描画（トリミング処理）
        ctx.drawImage(
          img,           // ソース画像
          startX,        // ソースX位置
          startY,        // ソースY位置
          cropWidth,     // ソース幅
          cropHeight,    // ソース高さ
          0,             // 描画先X位置
          0,             // 描画先Y位置
          cropWidth,     // 描画先幅
          cropHeight     // 描画先高さ
        );
        
        // プレビュー用にDataURLを作成
        const newPreview = canvas.toDataURL('image/png');
        preview = newPreview;
        
        // Blobとして保存
        canvas.toBlob((blob) => {
          // 新しいBlobを保持
          currentBlob = blob;
          
          // トリミングされたBlobでvalueを更新し、フォーム要素も更新
          updateValue(newPreview, blob);
          
          // 自動アップロードが有効で、URLが指定されている場合
          if (autoUpload && uploadUrl) {
            uploadImage(blob);
          }
        }, 'image/png');
      };
    };
    reader.readAsDataURL(file);
  }
  
  function uploadImage(blob) {
    if (!uploadUrl) return Promise.reject("Upload URL not specified");
    if (!blob) return Promise.reject("No image blob to upload");
    
    const sessionUuid = localStorage.getItem("sessionUuid")
    
    isUploading = true;
    
    // FormDataを使用してBlobをアップロード
    const formData = new FormData();
    formData.append(name, blob, fileName);
    formData.append("sessionUuid", sessionUuid)
    
    return fetch(uploadUrl, {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (onUploadSuccess) onUploadSuccess(data);
      console.log('Uploaded:', data);
      isUploading = false;
      return data;
    })
    .catch(error => {
      if (onUploadError) onUploadError(error);
      console.error('Error:', error);
      isUploading = false;
      throw error;
    });
  }
  
  // 画像選択を開始する関数
  function triggerFileInput() {
    if (!disabled) {
      fileInput.click();
    }
  }
  
  // キーボードイベント用のハンドラ
  function handleKeyDown(event) {
    // スペースまたはEnterキーが押されたとき
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      triggerFileInput();
    }
  }
</script>

<div class="space-y-2 {className}">
  {#if label}
    <label for={id} class="block text-sm font-medium text-gray-700">{label}</label>
  {/if}
  
  <div class="relative {containerClassName}" style="aspect-ratio: {aspectRatio};">
    <img 
      src={preview || src} 
      class="w-full h-full object-cover border {showError && error ? 'border-red-500' : 'border-gray-300'} shadow-sm" 
      alt="Preview"
    >
    {#if !disabled}
      <button
        type="button"
        aria-label="画像を変更"
        class="absolute inset-0 bg-gray-800/50 flex items-center justify-center cursor-pointer hover:bg-gray-800/70 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-0" 
        on:click={triggerFileInput}
        on:keydown={handleKeyDown}
        tabindex="0"
      >
        {#if isUploading}
          <span class="text-white text-sm">処理中...</span>
        {:else}
          <span class="text-white text-sm">変更</span>
        {/if}
      </button>
    {/if}
    
    <!-- 非表示の処理用input -->
    <input 
      type="file" 
      {id}
      bind:this={fileInput} 
      accept="image/*" 
      class="hidden" 
      on:change={handleFileUpload}
    >
    
    <!-- フォーム送信用の隠しinput - これがFormDataに含まれる -->
    <input 
      type="file" 
      name={name}
      {disabled}
      bind:this={hiddenInput} 
      accept="image/*" 
      class="hidden" 
    >
  </div>
  
  {#if showError && error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
</div>