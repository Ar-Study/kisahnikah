<script>
	import { page } from '$app/state';
	import { weddingStore, TEMPLATES } from '$lib/weddingStore.svelte.js';
	import InvitationView from '$lib/components/InvitationView.svelte';

	// Extract guest name from URL query param ?to=Nama+Tamu
	let guestName = $derived(page.url.searchParams.get('to') || 'Tamu Undangan');

	// Extract template ID from URL query param ?template=id or ?tpl=id
	let urlTemplateId = $derived(
		page.url.searchParams.get('template') || page.url.searchParams.get('tpl')
	);

	// Determine active template ID (URL query takes highest precedence)
	let activeTemplateId = $derived(
		urlTemplateId && TEMPLATES.some((t) => t.id === urlTemplateId)
			? urlTemplateId
			: (weddingStore.data.templateId || 'champagne-gold')
	);

	// Get active template definition
	let currentTemplate = $derived(
		TEMPLATES.find((t) => t.id === activeTemplateId) || TEMPLATES[0]
	);

	// Create derived weddingData with the active template ID
	let activeWeddingData = $derived({
		...weddingStore.data,
		templateId: activeTemplateId
	});

	let titleText = $derived(
		`Undangan Pernikahan [${currentTemplate.name}] — ${activeWeddingData.mempelai.pria.namaPanggilan} & ${activeWeddingData.mempelai.wanita.namaPanggilan}`
	);

	function handleSwitchTemplate(newId) {
		if (typeof window !== 'undefined') {
			const url = new URL(window.location.href);
			url.searchParams.set('template', newId);
			window.location.href = url.toString();
		}
	}
</script>

<svelte:head>
	<title>{titleText}</title>
	<meta
		name="description"
		content="Kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan {activeWeddingData
			.mempelai.pria.namaLengkap} & {activeWeddingData.mempelai.wanita
			.namaLengkap}. Klik link ini untuk detail acara & RSVP."
	/>
	<meta property="og:title" content={titleText} />
	<meta
		property="og:description"
		content="Kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan kami. Klik untuk membuka undangan digital."
	/>
	<meta property="og:image" content={currentTemplate.previewImage || activeWeddingData.coverImage} />
	<meta property="og:type" content="website" />
</svelte:head>

<div class="invite-page-root">
	<!-- TOP FLOATING PREVIEW SWITCHER BAR -->
	<header class="invite-topbar-preview">
		<div class="topbar-inner">
			<a href="/#template" class="btn-topbar-back" title="Kembali ke Katalog">
				<i class="bi bi-arrow-left"></i>
				<span class="d-none-mobile">Katalog</span>
			</a>

			<div class="preview-theme-selector">
				<i class="bi bi-palette-fill selector-icon"></i>
				<span class="selector-label d-none-mobile">Tema Preview:</span>
				<select
					value={activeTemplateId}
					onchange={(e) => handleSwitchTemplate(e.currentTarget.value)}
					class="select-theme-dropdown"
					aria-label="Ganti Tema Undangan"
				>
					<optgroup label="🎁 PAKET GRATIS (Free)">
						{#each TEMPLATES.filter((t) => t.tier === 'free') as t}
							<option value={t.id}>🎁 {t.name} (Gratis)</option>
						{/each}
					</optgroup>
					<optgroup label="⭐ PAKET PREMIUM PRO (Rp 140rb)">
						{#each TEMPLATES.filter((t) => t.tier === 'premium') as t}
							<option value={t.id}>⭐ {t.name} (Pro)</option>
						{/each}
					</optgroup>
					<optgroup label="👑 PAKET VIP EXCLUSIVE (Rp 250rb)">
						{#each TEMPLATES.filter((t) => t.tier === 'vip') as t}
							<option value={t.id}>👑 {t.name} (VIP)</option>
						{/each}
					</optgroup>
				</select>
			</div>

			<a href="/editor" class="btn-use-template" title="Edit Template Ini">
				<i class="bi bi-pencil-square"></i>
				<span>Gunakan Desain</span>
			</a>
		</div>
	</header>

	<!-- STANDALONE FULLSCREEN INVITATION VIEW -->
	<div class="invite-canvas" style="background-color: {currentTemplate.bgColor};">
		<InvitationView
			weddingData={activeWeddingData}
			guestName={guestName}
			isSimulator={false}
		/>
	</div>

	<!-- Floating Brand Badge for Visitors -->
	<div class="evermomen-badge-bar">
		<a href="/editor" class="brand-badge-link" title="Buat Undangan Digital Anda Sendiri">
			<img src="/logo.png" alt="Logo Kisah Nikah" class="badge-logo-img" />
			<span>Buat Undangan Seperti Ini di <strong>Kisah Nikah</strong></span>
			<i class="bi bi-arrow-right-short"></i>
		</a>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background-color: #12100e;
	}

	.invite-page-root {
		min-height: 100vh;
		background-color: #12100e;
		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;
	}

	/* TOP FLOATING PREVIEW SWITCHER BAR */
	.invite-topbar-preview {
		position: sticky;
		top: 0;
		left: 0;
		right: 0;
		width: 100%;
		z-index: 2500;
		background: rgba(18, 15, 13, 0.94);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid rgba(197, 160, 89, 0.35);
		padding: 0.5rem 1rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
	}

	.topbar-inner {
		max-width: 900px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.btn-topbar-back {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		color: #dfd5c5;
		text-decoration: none;
		font-size: 0.82rem;
		font-weight: 600;
		padding: 0.4rem 0.8rem;
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.15);
		transition: all 0.2s ease;
	}

	.btn-topbar-back:hover {
		background: rgba(255, 255, 255, 0.18);
		color: #ffffff;
	}

	.preview-theme-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(197, 160, 89, 0.5);
		padding: 0.25rem 0.75rem;
		border-radius: 30px;
		flex: 1;
		max-width: 450px;
	}

	.selector-icon {
		color: #c5a059;
		font-size: 0.95rem;
	}

	.selector-label {
		font-size: 0.78rem;
		font-weight: 600;
		color: #e5ded5;
		white-space: nowrap;
	}

	.select-theme-dropdown {
		background: transparent;
		border: none;
		color: #ffffff;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		width: 100%;
		outline: none;
	}

	.select-theme-dropdown option,
	.select-theme-dropdown optgroup {
		background: #1e1b18;
		color: #ffffff;
	}

	.btn-use-template {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: linear-gradient(135deg, #c5a059 0%, #aa7c11 100%);
		color: #110e0a;
		text-decoration: none;
		font-size: 0.8rem;
		font-weight: 700;
		padding: 0.45rem 1rem;
		border-radius: 25px;
		white-space: nowrap;
		box-shadow: 0 2px 10px rgba(197, 160, 89, 0.35);
		transition: all 0.2s ease;
	}

	.btn-use-template:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 15px rgba(197, 160, 89, 0.5);
	}

	.invite-canvas {
		width: 100%;
		max-width: 480px;
		min-height: 100vh;
		position: relative;
		box-shadow: 0 0 50px rgba(0, 0, 0, 0.3);
		transition: background-color 0.3s ease;
	}

	.evermomen-badge-bar {
		position: fixed;
		bottom: 14px;
		left: 16px;
		z-index: 1800;
	}

	.brand-badge-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		background: rgba(18, 16, 14, 0.9);
		backdrop-filter: blur(12px);
		border: 1px solid rgba(197, 160, 89, 0.45);
		color: #e5ded5;
		text-decoration: none;
		font-size: 0.74rem;
		padding: 0.45rem 0.9rem;
		border-radius: 20px;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
		transition: all 0.25s ease;
	}

	.brand-badge-link:hover {
		background: #c5a059;
		color: #110e0a;
		transform: translateY(-2px);
	}

	.badge-logo-img {
		width: 20px;
		height: 20px;
		object-fit: contain;
		border-radius: 4px;
	}

	.brand-badge-link strong {
		color: #ffffff;
	}

	.brand-badge-link:hover strong {
		color: #000000;
	}

	@media (max-width: 540px) {
		.d-none-mobile {
			display: none;
		}

		.topbar-inner {
			gap: 0.4rem;
		}

		.btn-use-template {
			padding: 0.4rem 0.75rem;
			font-size: 0.75rem;
		}
	}

	@media (max-width: 480px) {
		.evermomen-badge-bar {
			display: none;
		}
	}
</style>
