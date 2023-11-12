<script lang="ts">
  export let inputText: string;
  export let isActive: boolean;
</script>

<button on:mouseenter on:click class="flex items-center gap-2 whitespace-nowrap px-2 {isActive ? 'bg-slate-100' : ''}">
  <span class="text-slate-700">+ Add</span>
  <span class="text-slate-900">{inputText}</span>
</button>
