<script>
	import { TEMPLATES } from '$lib/weddingStore.svelte.js';

	/** @type {{ templateId: string }} */
	let { templateId = 'champagne-gold' } = $props();

	let current = $derived(TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0]);
</script>

<svelte:head>
	{@html `<style>
		:root {
			--theme-primary: ${current.primaryColor};
			--theme-secondary: ${current.secondaryColor};
			--theme-bg: ${current.bgColor};
			--theme-text: ${current.textColor};
			--theme-card: ${current.cardBg};
			--theme-font-title: ${current.fontTitle};
			--theme-font-heading: ${current.fontHeading};
			--theme-font-body: ${current.fontBody};
		}
	</style>`}
</svelte:head>
