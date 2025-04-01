<script lang="ts">
	import '../app.css';
	
	let { children } = $props();
</script>

<header class="sm:hidden py-4 fixed top-0 w-full shadow-md z-10 text-center backdrop-blur-xl bg-white/50">
    <p class="text-3xl font-2xl font-bold font-['Allerta_Stencil']">Schoolink</p>
</header>
        
<div class="grid grid-cols-1 sm:grid-cols-[16rem_auto] h-screen pt-16 sm:pt-0">
    <div class="w-full bg-gray-200 hidden sm:block">
    <p class="text-3xl font-2xl font-bold pl-5 mt-5 font-['Allerta_Stencil']">Schoolink</p>
    <div class="text-lg mt-5 flex items-center mr-4 bg-gray-300 pl-5 py-2 rounded-r-xl">
        <span class="material-symbols-outlined mr-1 text-blue-600">public</span>
        プロジェクト
    </div>
    <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl">
    	<span class="material-symbols-outlined mr-1 text-blue-600">event</span>
        イベント
    </div>
    <div class="text-lg mt-1 flex items-center mr-4 pl-5 py-2 rounded-r-xl">
    	<span class="material-symbols-outlined mr-1 text-blue-600">account_circle</span>
        マイページ
    </div>
    </div>
    <div class="overflow-auto py-10 w-full">
        {@render children()}
    </div>
</div>

<footer class="sm:hidden bg-gray-100/80 backdrop-blur-xl fixed bottom-0 w-full shadow-lg">
    <div class="grid grid-cols-3 w-full text-gray-600 font-bold">
		<div class="text-xs flex flex-col items-center py-2 rounded-r-xl text-blue-600">
			<span class="material-symbols-outlined text-blue-600 mb-1 !text-3xl">public</span>
			プロジェクト
		</div>
		<div class="text-xs flex flex-col items-center py-2 rounded-r-xl">
			<span class="material-symbols-outlined text-gray-600 mb-1 !text-3xl">event</span>
			イベント
		</div>
		<div class="text-xs flex flex-col items-center py-2 rounded-r-xl">
			<span class="material-symbols-outlined text-gray-600 mb-1 !text-3xl">account_circle</span>
			マイページ
		</div>
	</div>
</footer>