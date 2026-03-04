<script lang="ts">
    export let open = false;
    export let title = "確認";
    export let message = "本当に削除しますか？この操作は取り消せません。";
    export let confirmLabel = "削除する";
    export let cancelLabel = "キャンセル";
    export let onConfirm: () => void = () => {};
    export let onCancel: () => void = () => { open = false; };
</script>

{#if open}
<!-- オーバーレイ -->
<div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
>
    <div class="bg-white rounded-2xl shadow-xl p-6 mx-4 w-full max-w-sm">
        <h2 id="confirm-dialog-title" class="text-lg font-bold text-gray-800 mb-2">{title}</h2>
        <p class="text-sm text-gray-600 mb-6">{message}</p>
        <div class="flex justify-end gap-3">
            <button
                type="button"
                class="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
                onclick={onCancel}
            >
                {cancelLabel}
            </button>
            <button
                type="button"
                class="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition"
                onclick={onConfirm}
            >
                {confirmLabel}
            </button>
        </div>
    </div>
</div>
{/if}