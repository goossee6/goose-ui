<script lang="ts">
	import type { Component } from 'svelte';

	let {
		icon,
		class: cls = '',
		style = '',
		spin = false,
		size = 20,
	}: {
		icon?: Component<{ size?: number; class?: string }>;
		class?: string;
		style?: string;
		/** 加载旋转动画 */
		spin?: boolean;
		size?: number;
	} = $props();
</script>

{#if icon}
	{@const Cmp = icon}
	<span class="goose-icon {cls}" class:goose-icon--spin={spin} {style}>
		<Cmp {size} />
	</span>
{/if}

<style>
	.goose-icon {
		display: inline-flex;
		align-items: center;
	}
	.goose-icon--spin {
		animation: goose-icon-spin 0.8s linear infinite;
	}
	@keyframes goose-icon-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
