<script lang="ts">
	import type { Component } from 'svelte';

	let {
		icon,
		class: cls = '',
		size = 20,
	}: {
		icon?: Component<{ size?: number; class?: string }>;
		class?: string;
		size?: number;
	} = $props();
</script>

{#if icon}
	<svelte:component this={icon} {size} class={cls} />
{/if}
