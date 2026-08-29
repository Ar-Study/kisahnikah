<script>
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import UpgradeModal from '$lib/components/UpgradeModal.svelte';
	import OrderWaModal from '$lib/components/OrderWaModal.svelte';
	import { TEMPLATES, weddingStore } from '$lib/weddingStore.svelte.js';
	import { goto } from '$app/navigation';

	let activeFaq = $state(null);
	let isAuthModalOpen = $state(false);
	let isUpgradeModalOpen = $state(false);
	let isOrderWaModalOpen = $state(false);
	let orderPackageName = $state('Paket Premium All-in-One');
	let orderAmount = $state(140000);
	let targetUpgradeTemplate = $state(null);
	let targetTemplateAfterLogin = $state(null);

	onMount(() => {
		weddingStore.initSupabaseAuth();
	});

	let templateFilter = $state('all'); // 'all' | 'free' | 'premium' | 'vip'
	let filteredTemplates = $derived(
		templateFilter === 'all'
			? TEMPLATES
			: TEMPLATES.filter((t) => t.tier === templateFilter)
	);

	function isTemplateLocked(tpl) {
		if (tpl.tier === 'free' || !tpl.isPremium) return false;
		if (weddingStore.user.tier === 'vip') return false;
		if (weddingStore.user.tier === 'premium' && tpl.tier !== 'vip') return false;
		return true;
	}

	function toggleFaq(index) {
		activeFaq = activeFaq === index ? null : index;
	}

	function handleGoToEditor(e, targetTpl = null) {
		if (e && e.preventDefault) e.preventDefault();
		if (!weddingStore.user.isLoggedIn) {
			targetTemplateAfterLogin = targetTpl;
			isAuthModalOpen = true;
			return;
		}
		if (targetTpl) {
			selectAndEditTemplate(targetTpl);
		} else {
			goto('/editor');
		}
	}

	function selectAndEditTemplate(tpl) {
		if (typeof tpl === 'string') {
			tpl = TEMPLATES.find((t) => t.id === tpl) || TEMPLATES[0];
		}
		if (!weddingStore.user.isLoggedIn) {
			targetTemplateAfterLogin = tpl;
			isAuthModalOpen = true;
			return;
		}
		if (isTemplateLocked(tpl)) {
			targetUpgradeTemplate = tpl;
			isUpgradeModalOpen = true;
			return;
		}
		weddingStore.setTemplate(tpl.id);
		goto('/editor');
	}

	const FAQS = [
		{
			q: 'Berapa lama proses pembuatan undangan digital di Kisah Nikah?',
			a: 'Sangat cepat! Anda hanya perlu memilih template, melengkapi data mempelai & acara pada studio editor, dan undangan Anda langsung siap disebarkan dalam hitungan menit.'
		},
		{
			q: 'Apakah saya bisa mengganti template setelah mengisi data?',
			a: 'Tentu saja! Seluruh informasi acara dan mempelai yang telah Anda masukkan akan otomatis tersimpan dan dapat dialihkan ke template manapun dengan 1 klik tanpa perlu mengisi ulang.'
		},
		{
			q: 'Bagaimana cara membagikan undangan dengan nama tamu yang berbeda-beda?',
			a: 'Kisah Nikah memiliki fitur Generator Tamu. Anda cukup memasukkan daftar nama tamu pada menu "Sebar & Tamu", dan sistem akan otomatis membuat tautan personal beserta template pesan WhatsApp yang siap Anda bagikan.'
		},
		{
			q: 'Apakah tamu bisa mengirimkan konfirmasi kehadiran (RSVP) & ucapan?',
			a: 'Ya, setiap tamu dapat memilih status kehadiran (Hadir, Tidak Hadir, atau Ragu) serta menuliskan ucapan dan doa restu yang langsung tampil secara realtime di dinding buku tamu undangan Anda.'
		},
		{
			q: 'Apakah bisa menambahkan nomor rekening untuk amplop / kado digital?',
			a: 'Bisa sekali! Anda dapat menambahkan nomor rekening bank (BCA, Mandiri, BSI, dll) maupun dompet digital (GoPay, OVO, Dana). Tamu cukup menekan tombol "Salin Nomor Rekening" untuk kemudahan transfer.'
		}
	];
</script>

<svelte:head>
	<title>Kisah Nikah — Undangan Digital, Cerita Seumur Hidup</title>
	<meta
		name="description"
		content="Kisah Nikah (kisahnikah.web.id) — Platform pembuatan undangan pernikahan digital modern, anggun, hemat, dan mudah dibagikan. Padamara, Purbalingga, Jawa Tengah. WhatsApp: 089669788817."
	/>
</svelte:head>

<div class="landing-page-root">
	<Navbar />

	<!-- HERO SECTION -->
	<section class="hero-section" id="beranda">
		<div class="hero-container">
			<div class="hero-content">
				<div class="hero-badge">
					<i class="bi bi-heart-fill"></i>
					<span>Undangan Digital Modern #1</span>
				</div>

				<h1 class="hero-title">
					Undangan Pernikahan Digital yang
					<span class="highlight-gold">Elegan</span>,
					<span class="highlight-gold">Praktis</span> &
					<span class="highlight-gold">Berkesan</span>
				</h1>

				<p class="hero-description">
					Platform pembuatan undangan pernikahan web profesional. Pilih dari beragam template
					eksklusif, lengkapi data acara Anda dengan mudah, dan bagikan undangan personal via
					WhatsApp dalam hitungan menit.
				</p>

				<div class="hero-cta-group">
					<button type="button" class="btn btn-hero-primary" onclick={(e) => handleGoToEditor(e)}>
						<i class="bi bi-magic"></i>
						<span>Buat Undangan Sekarang</span>
					</button>
					<a href="#template" class="btn btn-hero-secondary">
						<i class="bi bi-palette"></i>
						<span>Lihat 10 Template</span>
					</a>
					<a href="/invite?template=champagne-gold" target="_blank" rel="noopener noreferrer" class="btn btn-hero-outline">
						<i class="bi bi-play-circle"></i>
						<span>Live Demo</span>
					</a>
				</div>

				<!-- Social Proof -->
				<div class="hero-social-proof">
					<div class="avatar-stack">
						<img
							src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100"
							alt="User Sarah"
							class="proof-avatar"
						/>
						<img
							src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100"
							alt="User Rizky"
							class="proof-avatar"
						/>
						<img
							src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100"
							alt="User Dinda"
							class="proof-avatar"
						/>
						<img
							src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100"
							alt="User Farhan"
							class="proof-avatar"
						/>
					</div>
					<div class="proof-info">
						<div class="stars-row">
							<i class="bi bi-star-fill"></i>
							<i class="bi bi-star-fill"></i>
							<i class="bi bi-star-fill"></i>
							<i class="bi bi-star-fill"></i>
							<i class="bi bi-star-fill"></i>
						</div>
						<span class="proof-text">Telah digunakan oleh <strong>10.000+</strong> pasangan bahagia</span>
					</div>
				</div>
			</div>

			<!-- HERO VISUAL (SMARTPHONE MOCKUP & FLOATING CARDS) -->
			<div class="hero-visual">
				<div class="visual-mockup-wrapper">
					<!-- Floating Card 1: WA Sharing -->
					<div class="floating-bubble bubble-1">
						<div class="bubble-icon icon-wa">
							<i class="bi bi-whatsapp"></i>
						</div>
						<div class="bubble-text">
							<strong>Mudah Dibagikan</strong>
							<span>Sapaan personal per tamu</span>
						</div>
					</div>

					<!-- Floating Card 2: Complete Features -->
					<div class="floating-bubble bubble-2">
						<div class="bubble-icon icon-gift">
							<i class="bi bi-gift-fill"></i>
						</div>
						<div class="bubble-text">
							<strong>Angpao & RSVP Realtime</strong>
							<span>1-Klik Salin Rekening</span>
						</div>
					</div>

					<!-- Floating Card 3: Music & Maps -->
					<div class="floating-bubble bubble-3">
						<div class="bubble-icon icon-music">
							<i class="bi bi-music-note-beamed"></i>
						</div>
						<div class="bubble-text">
							<strong>Musik Romantis & Peta</strong>
							<span>Navigasi Google Maps</span>
						</div>
					</div>

					<!-- Phone Mockup Frame -->
					<div class="hero-phone-outer">
						<div class="hero-phone-screen">
							<div class="mockup-cover-content">
								<div class="mockup-sub">Undangan Pernikahan</div>
								<h3 class="mockup-names">
									{weddingStore.data.mempelai.pria.namaPanggilan} & {weddingStore.data.mempelai.wanita
										.namaPanggilan}
								</h3>
								<div class="mockup-to-card">
									<span>Kepada Yth:</span>
									<strong>Tamu Undangan</strong>
								</div>
								<button type="button" class="mockup-btn" onclick={(e) => handleGoToEditor(e)}>
									<i class="bi bi-envelope-open-fill"></i> Buka Undangan
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION: FITUR UNGGULAN -->
	<section class="section-padding bg-light" id="fitur">
		<div class="section-container">
			<div class="section-header text-center">
				<span class="badge-label">FITUR UNGGULAN</span>
				<h2 class="section-title">
					Semua Kebutuhan Undangan dalam <span class="highlight-gold">Satu Platform</span>
				</h2>
				<p class="section-subtitle">
					Dirancang khusus untuk memberikan pengalaman yang mewah, berkesan, dan memudahkan setiap
					tamu undangan Anda.
				</p>
			</div>

			<div class="features-grid">
				<!-- Fitur 1 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-palette"></i>
					</div>
					<h4 class="feature-title">Desain Elegan & Eksklusif</h4>
					<p class="feature-desc">
						Pilihan tema premium mulai dari Royal Gold, Emerald Botanic, Midnight Celestial, hingga
						Romantic Floral.
					</p>
				</div>

				<!-- Fitur 2 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-person-badge"></i>
					</div>
					<h4 class="feature-title">Sapaan Nama Tamu Personal</h4>
					<p class="feature-desc">
						Setiap link undangan menampilkan nama tamu secara khusus dan eksklusif di layar pembuka
						undangan.
					</p>
				</div>

				<!-- Fitur 3 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-check2-circle"></i>
					</div>
					<h4 class="feature-title">Konfirmasi Kehadiran (RSVP)</h4>
					<p class="feature-desc">
						Tamu dapat mengonfirmasi kehadiran dengan jumlah orang, tersimpan rapi dan dapat Anda
						pantau kapan saja.
					</p>
				</div>

				<!-- Fitur 4 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-book"></i>
					</div>
					<h4 class="feature-title">Buku Tamu & Ucapan Doa</h4>
					<p class="feature-desc">
						Dinding doa online tempat kerabat dan sahabat menuliskan ucapan selamat yang langsung
						tampil real-time.
					</p>
				</div>

				<!-- Fitur 5 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-credit-card-2-front"></i>
					</div>
					<h4 class="feature-title">Angpao & Kado Digital</h4>
					<p class="feature-desc">
						Kemudahan mengirim tanda kasih langsung ke rekening bank atau e-wallet dengan tombol
						salin instan.
					</p>
				</div>

				<!-- Fitur 6 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-images"></i>
					</div>
					<h4 class="feature-title">Galeri Foto & Kisah Cinta</h4>
					<p class="feature-desc">
						Abadikan momen prewedding dengan galeri foto beranimasi halus dan timeline cerita
						perjalanan cinta Anda.
					</p>
				</div>

				<!-- Fitur 7 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-geo-alt"></i>
					</div>
					<h4 class="feature-title">Lokasi & Google Maps</h4>
					<p class="feature-desc">
						Integrasi peta dan petunjuk arah satu klik langsung ke aplikasi Google Maps di smartphone
						tamu.
					</p>
				</div>

				<!-- Fitur 8 -->
				<div class="feature-card">
					<div class="feature-icon-box">
						<i class="bi bi-music-note-beamed"></i>
					</div>
					<h4 class="feature-title">Musik Latar Romantis</h4>
					<p class="feature-desc">
						Musik latar romantis yang berputar otomatis dengan pemutar piringan hitam vinyl yang
						dapat dipause kapan saja.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION: KATALOG TEMPLATE -->
	<section class="section-padding" id="template">
		<div class="section-container">
			<div class="section-header text-center">
				<span class="badge-label">KATALOG EKSKLUSIF</span>
				<h2 class="section-title">
					Pilih Desain Template <span class="highlight-gold">Favorit Anda</span>
				</h2>
				<p class="section-subtitle">
					Setiap template dirancang dengan palet warna, tipografi berkarakter, dan ornamen mewah
					yang dapat disesuaikan.
				</p>
			</div>

			<!-- FILTER TABS BERDASARKAN TIER & KATEGORI -->
			<div class="catalog-filter-bar">
				<button
					type="button"
					class="filter-pill-btn {templateFilter === 'all' ? 'active' : ''}"
					onclick={() => (templateFilter = 'all')}
				>
					Semua Tema ({TEMPLATES.length})
				</button>
				<button
					type="button"
					class="filter-pill-btn filter-free {templateFilter === 'free' ? 'active' : ''}"
					onclick={() => (templateFilter = 'free')}
				>
					<i class="bi bi-gift-fill"></i> Paket Gratis ({TEMPLATES.filter((t) => t.tier === 'free').length})
				</button>
				<button
					type="button"
					class="filter-pill-btn filter-pro {templateFilter === 'premium' ? 'active' : ''}"
					onclick={() => (templateFilter = 'premium')}
				>
					<i class="bi bi-stars"></i> Premium Pro ⭐ ({TEMPLATES.filter((t) => t.tier === 'premium').length})
				</button>
				<button
					type="button"
					class="filter-pill-btn filter-vip {templateFilter === 'vip' ? 'active' : ''}"
					onclick={() => (templateFilter = 'vip')}
				>
					<i class="bi bi-crown-fill"></i> VIP Exclusive 👑 ({TEMPLATES.filter((t) => t.tier === 'vip').length})
				</button>
			</div>

			<div class="templates-catalog-grid">
				{#each filteredTemplates as tpl}
					<div class="catalog-card {tpl.tier === 'vip' ? 'is-vip-card' : (tpl.isPremium ? 'is-premium-card' : '')}">
						<div class="catalog-image-wrap">
							<img src={tpl.previewImage} alt={tpl.name} class="catalog-img" loading="lazy" />
							<div class="catalog-overlay">
								<button
									type="button"
									class="btn btn-overlay-action"
									onclick={() => selectAndEditTemplate(tpl)}
								>
									<i class="bi bi-pencil-square"></i> Gunakan Template
								</button>
								<a
									href="/invite?template={tpl.id}"
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-overlay-preview"
								>
									<i class="bi bi-eye"></i> Live Preview
								</a>
							</div>
							<span class="catalog-category-pill">{tpl.category || tpl.tag}</span>
							<div class="catalog-tier-corner {tpl.tier === 'vip' ? 'tier-vip' : (tpl.isPremium ? 'tier-pro' : 'tier-free')}">
								{#if tpl.tier === 'vip'}
									<i class="bi bi-crown-fill"></i> VIP 👑
								{:else if tpl.isPremium}
									<i class="bi bi-stars"></i> Pro ⭐
								{:else}
									<i class="bi bi-gift"></i> Gratis
								{/if}
							</div>
						</div>

						<div class="catalog-info">
							<div class="catalog-header-row">
								<h4 class="catalog-name">{tpl.name}</h4>
							</div>
							<p class="catalog-desc">{tpl.desc}</p>
							<div class="catalog-footer">
								<div class="catalog-swatch">
									<span class="swatch-circle" style="background: {tpl.primaryColor}" title="Primary Color"></span>
									<span class="swatch-circle" style="background: {tpl.secondaryColor}" title="Secondary Color"></span>
									<span class="swatch-circle" style="background: {tpl.bgColor}" title="Background Color"></span>
								</div>
								<button
									type="button"
									class="btn-select-tpl {tpl.tier === 'vip' ? 'btn-select-vip' : ''}"
									onclick={() => selectAndEditTemplate(tpl)}
								>
									{#if tpl.tier === 'vip'}
										<span>Pilih Desain (VIP)</span> <i class="bi bi-crown-fill"></i>
									{:else if tpl.isPremium}
										<span>Pilih Desain (Pro)</span> <i class="bi bi-lock-fill"></i>
									{:else}
										<span>Gunakan Gratis</span> <i class="bi bi-arrow-right"></i>
									{/if}
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="text-center mt-5">
				<button type="button" class="btn btn-primary-custom btn-lg" onclick={(e) => handleGoToEditor(e)}>
					<i class="bi bi-magic me-2"></i> Buka Studio Editor untuk Mencoba Semua Template
				</button>
			</div>
		</div>
	</section>

	<!-- SECTION: HARGA & PAKET UNDANGAN -->
	<section class="section-padding bg-light" id="harga">
		<div class="section-container">
			<div class="section-header text-center">
				<span class="badge-label">HARGA & PAKET</span>
				<h2 class="section-title">
					Harga Sederhana, <span class="highlight-gold">Fitur Berlimpah</span>
				</h2>
				<p class="section-subtitle">
					Mulai dari paket gratis untuk mencoba, hingga paket lengkap all-in-one tanpa biaya tersembunyi.
				</p>
			</div>

			<div class="pricing-cards-grid">
				<!-- 1. PAKET GRATIS -->
				<div class="pricing-plan-card">
					<div class="plan-header">
						<span class="plan-badge badge-free-plan">Uji Coba</span>
						<h3 class="plan-title">Paket Gratis</h3>
						<p class="plan-desc">Cocok untuk mencoba fitur dan melihat tampilan undangan.</p>
						<div class="plan-price-wrap">
							<span class="price-val">Rp 0</span>
							<span class="price-cycle">/ selamanya</span>
						</div>
					</div>

					<ul class="plan-features">
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>3 Template Standar Gratis</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Maksimal 20 Tamu Undangan</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Masa Aktif 30 Hari</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> RSVP & Buku Tamu Standar</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Integrasi Google Maps</li>
						<li class="feature-disabled"><i class="bi bi-x-circle text-muted"></i> Template Mewah & Adat Tradisional</li>
						<li class="feature-disabled"><i class="bi bi-x-circle text-muted"></i> Unlimited Tamu Undangan</li>
						<li class="feature-disabled"><i class="bi bi-x-circle text-muted"></i> Kado Digital & Salin Rekening</li>
					</ul>

					<button type="button" class="btn btn-plan-action btn-plan-free" onclick={(e) => handleGoToEditor(e)}>
						Mulai Buat Gratis
					</button>
				</div>

				<!-- 2. PAKET PREMIUM ALL-IN-ONE (BEST SELLER) -->
				<div class="pricing-plan-card featured-plan">
					<div class="featured-ribbon">PALING FAVORIT ⭐</div>
					<div class="plan-header">
						<span class="plan-badge badge-pro-plan">Best Seller</span>
						<h3 class="plan-title">Paket Premium</h3>
						<p class="plan-desc">Solusi paling diminati untuk pernikahan berkesan selamanya.</p>
						<div class="plan-price-wrap">
							<span class="price-strikethrough">Rp 250.000</span>
							<span class="price-val highlight-gold">Rp 140.000</span>
							<span class="price-cycle">/ sekali bayar</span>
						</div>
					</div>

					<ul class="plan-features">
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>Akses 8 Template Mewah</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>Termasuk Adat Jawa & Nuansa Islami</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>Unlimited Tamu Undangan</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>Masa Aktif Selamanya (Lifetime)</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Fitur RSVP & Buku Tamu Realtime</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Galeri Foto HD & Kisah Cinta</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Angpao & Kado Digital (1-Klik Salin)</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Musik Latar Romantis Bebas Pilih</li>
					</ul>

					<button
						type="button"
						class="btn btn-plan-action btn-plan-pro"
						onclick={() => {
							orderPackageName = 'Paket Premium All-in-One';
							orderAmount = 140000;
							targetUpgradeTemplate = TEMPLATES[3];
							isOrderWaModalOpen = true;
						}}
					>
						<i class="bi bi-whatsapp me-1"></i> Order Paket Premium via WA
					</button>
				</div>

				<!-- 3. PAKET VIP CUSTOM -->
				<div class="pricing-plan-card">
					<div class="plan-header">
						<span class="plan-badge badge-vip-plan">Terima Beres</span>
						<h3 class="plan-title">Paket VIP Assist</h3>
						<p class="plan-desc">Dibantu pembuatan & input data sampai tuntas oleh tim.</p>
						<div class="plan-price-wrap">
							<span class="price-val">Rp 250.000</span>
							<span class="price-cycle">/ sekali bayar</span>
						</div>
					</div>

					<ul class="plan-features">
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>Akses SEMUA 10 Template (Termasuk VIP)</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>Template Royal Velvet & Adat Sunda Siger</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> <strong>Dibantu Input Data oleh Tim Kisah Nikah</strong></li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Custom Subdomain Pilihan</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Bebas Revisi Data Hingga Hari H</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Prioritas CS WhatsApp 24/7</li>
						<li><i class="bi bi-check-circle-fill text-success"></i> Panduan Sebar Undangan via WA</li>
					</ul>

					<button
						type="button"
						class="btn btn-plan-action btn-plan-vip"
						onclick={() => {
							orderPackageName = 'Paket VIP Custom Assist';
							orderAmount = 250000;
							targetUpgradeTemplate = TEMPLATES[8];
							isOrderWaModalOpen = true;
						}}
					>
						<i class="bi bi-whatsapp me-1"></i> Order Paket VIP via WA
					</button>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION: CARA ORDER / CARA BUAT -->
	<section class="section-padding" id="cara-buat">
		<div class="section-container">
			<div class="section-header text-center">
				<span class="badge-label">CARA KERJA MUDAH</span>
				<h2 class="section-title">
					4 Langkah Mudah Membuat <span class="highlight-gold">Undangan Siap Pakai</span>
				</h2>
				<p class="section-subtitle">
					Tanpa perlu mengerti koding atau desain rumit, undangan Anda langsung jadi dalam sekejap.
				</p>
			</div>

			<div class="steps-grid">
				<div class="step-card">
					<div class="step-num">1</div>
					<div class="step-icon"><i class="bi bi-palette"></i></div>
					<h4 class="step-title">Pilih Template</h4>
					<p class="step-desc">
						Tentukan tema visual yang paling pas dengan nuansa acara pernikahan impian Anda.
					</p>
				</div>

				<div class="step-card">
					<div class="step-num">2</div>
					<div class="step-icon"><i class="bi bi-card-text"></i></div>
					<h4 class="step-title">Isi Data Acara</h4>
					<p class="step-desc">
						Lengkapi data mempelai, jadwal akad, resepsi, peta lokasi, hingga nomor rekening.
					</p>
				</div>

				<div class="step-card">
					<div class="step-num">3</div>
					<div class="step-icon"><i class="bi bi-people"></i></div>
					<h4 class="step-title">Input Daftar Tamu</h4>
					<p class="step-desc">
						Masukkan nama tamu untuk menghasilkan sapaan personal khusus per orang/keluarga.
					</p>
				</div>

				<div class="step-card">
					<div class="step-num">4</div>
					<div class="step-icon"><i class="bi bi-whatsapp"></i></div>
					<h4 class="step-title">Sebar via WhatsApp</h4>
					<p class="step-desc">
						Salin pesan yang sudah diformat otomatis dan kirimkan langsung ke WhatsApp para tamu.
					</p>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION: TESTIMONI -->
	<section class="section-padding" id="testimoni">
		<div class="section-container">
			<div class="section-header text-center">
				<span class="badge-label">TESTIMONIAL</span>
				<h2 class="section-title">
					Apa Kata <span class="highlight-gold">Pasangan Bahagia?</span>
				</h2>
				<p class="section-subtitle">
					Cerita nyata dari pasangan yang mempercayakan momen sakral mereka bersama Kisah Nikah.
				</p>
			</div>

			<div class="testimonial-grid">
				<div class="testi-card">
					<div class="testi-stars">
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
					</div>
					<p class="testi-quote">
						"Undangannya cantik banget! Tamu-tamu pada kagum dan banyak yang nanya bikin di mana.
						Fitur tombol salin rekening dan RSVP nya bener-bener ngebantu banget!"
					</p>
					<div class="testi-author">
						<img
							src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120"
							alt="Rizky & Anin"
							class="testi-avatar"
						/>
						<div>
							<h5 class="author-name">Rizky & Anindya</h5>
							<span class="author-sub">Pernikahan di Bandung</span>
						</div>
					</div>
				</div>

				<div class="testi-card">
					<div class="testi-stars">
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
					</div>
					<p class="testi-quote">
						"Sistem generator WhatsApp nya juara! Gak perlu capek-capek ketik sapaan satu per satu.
						Tinggal klik salin dan langsung kirim ke keluarga. Recommended!"
					</p>
					<div class="testi-author">
						<img
							src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120"
							alt="Fajar & Putri"
							class="testi-avatar"
						/>
						<div>
							<h5 class="author-name">Fajar & Putri</h5>
							<span class="author-sub">Pernikahan di Jakarta</span>
						</div>
					</div>
				</div>

				<div class="testi-card">
					<div class="testi-stars">
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
						<i class="bi bi-star-fill"></i>
					</div>
					<p class="testi-quote">
						"Template Emerald Forest nya anggun banget. Fitur musiknya pas dibuka langsung hidup
						bikin suasana jadi romantis. Sangat worth it!"
					</p>
					<div class="testi-author">
						<img
							src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120"
							alt="Doni & Maya"
							class="testi-avatar"
						/>
						<div>
							<h5 class="author-name">Doni & Maya</h5>
							<span class="author-sub">Pernikahan di Yogyakarta</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- SECTION: FAQ ACCORDION -->
	<section class="section-padding bg-light" id="faq">
		<div class="section-container" style="max-width: 820px;">
			<div class="section-header text-center">
				<span class="badge-label">PERTANYAAN UMUM</span>
				<h2 class="section-title">
					Pertanyaan Seputar <span class="highlight-gold">Undangan Digital</span>
				</h2>
				<p class="section-subtitle">
					Jawaban atas hal-hal yang sering ditanyakan oleh calon pengantin.
				</p>
			</div>

			<div class="faq-list">
				{#each FAQS as faq, i}
					<div class="faq-item {activeFaq === i ? 'is-open' : ''}">
						<button
							type="button"
							class="faq-question"
							onclick={() => toggleFaq(i)}
							aria-expanded={activeFaq === i}
						>
							<span>{faq.q}</span>
							<i class="bi {activeFaq === i ? 'bi-chevron-up' : 'bi-chevron-down'}"></i>
						</button>
						{#if activeFaq === i}
							<div class="faq-answer">
								<p>{faq.a}</p>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- CTA BANNER -->
	<section class="cta-banner-section">
		<div class="section-container">
			<div class="cta-card">
				<div class="cta-badge">MULAI SEKARANG</div>
				<h2 class="cta-title">Siap Membuat Undangan Pernikahan Impian Anda?</h2>
				<p class="cta-desc">
					Bergabunglah bersama ribuan pasangan lain dan buat hari istimewa Anda lebih berkesan dengan
					undangan digital terbaik.
				</p>
				<div class="cta-buttons">
					<button type="button" class="btn btn-cta-primary" onclick={(e) => handleGoToEditor(e)}>
						<i class="bi bi-magic me-2"></i> Buka Editor & Buat Sekarang
					</button>
					<a href="/invite" class="btn btn-cta-outline">
						<i class="bi bi-eye me-2"></i> Lihat Contoh Undangan
					</a>
				</div>
			</div>
		</div>
	</section>

	<Footer />

	<!-- AUTH & UPGRADE MODALS -->
	<AuthModal
		isOpen={isAuthModalOpen}
		onClose={() => (isAuthModalOpen = false)}
		onSuccess={() => {
			if (targetTemplateAfterLogin) {
				const t = targetTemplateAfterLogin;
				targetTemplateAfterLogin = null;
				selectAndEditTemplate(t);
			} else {
				goto('/editor');
			}
		}}
	/>

	<UpgradeModal
		isOpen={isUpgradeModalOpen}
		targetTemplateName={targetUpgradeTemplate?.name || 'Template Premium'}
		targetTier={targetUpgradeTemplate?.tier || 'premium'}
		onClose={() => (isUpgradeModalOpen = false)}
		onUpgradeSuccess={() => {
			if (targetUpgradeTemplate) {
				weddingStore.setTemplate(targetUpgradeTemplate.id);
				goto('/editor');
			}
		}}
		onOpenPayment={() => {
			isUpgradeModalOpen = false;
			if (targetUpgradeTemplate?.tier === 'vip') {
				orderPackageName = 'Paket VIP Custom Assist';
				orderAmount = 250000;
			} else {
				orderPackageName = 'Paket Premium All-in-One';
				orderAmount = 140000;
			}
			isOrderWaModalOpen = true;
		}}
	/>

	<!-- WHATSAPP ORDER MODAL -->
	<OrderWaModal
		isOpen={isOrderWaModalOpen}
		packageName={orderPackageName}
		amount={orderAmount}
		targetTemplateName={targetUpgradeTemplate?.name || 'Emerald Forest Luxury'}
		onClose={() => (isOrderWaModalOpen = false)}
	/>
</div>

<style>
	.landing-page-root {
		font-family: 'Plus Jakarta Sans', sans-serif;
		color: #2b2621;
		background: #faf8f5;
	}

	.section-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.section-padding {
		padding: 5.5rem 0;
	}

	.bg-light {
		background: #f4efe9;
	}

	.section-header {
		margin-bottom: 3.5rem;
	}

	.badge-label {
		display: inline-block;
		font-family: 'Cinzel', serif;
		font-size: 0.72rem;
		letter-spacing: 3px;
		font-weight: 700;
		color: #a88439;
		background: rgba(197, 160, 89, 0.12);
		padding: 0.3rem 0.85rem;
		border-radius: 20px;
		margin-bottom: 0.8rem;
	}

	.section-title {
		font-family: 'Cinzel', serif;
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		color: #1a1918;
		font-weight: 700;
		margin-bottom: 0.8rem;
		line-height: 1.25;
	}

	.section-subtitle {
		font-size: 1.02rem;
		color: #6d6459;
		max-width: 620px;
		margin: 0 auto;
		line-height: 1.6;
	}

	.highlight-gold {
		color: #b38b3b;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	/* HERO */
	.hero-section {
		padding: 4.5rem 0 6rem;
		background: radial-gradient(circle at 80% 20%, #fdf8f0 0%, #faf5ee 60%, #f3ece2 100%);
		position: relative;
		overflow: hidden;
	}

	.hero-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
		display: grid;
		grid-template-columns: 1.15fr 0.85fr;
		align-items: center;
		gap: 3.5rem;
	}

	.hero-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #ffffff;
		border: 1px solid #ebdcc8;
		padding: 0.4rem 1rem;
		border-radius: 25px;
		font-size: 0.78rem;
		font-weight: 700;
		color: #a88439;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
		margin-bottom: 1.5rem;
	}

	.hero-badge i {
		color: #e11d48;
	}

	.hero-title {
		font-family: 'Cinzel', serif;
		font-size: clamp(2.3rem, 5vw, 3.4rem);
		line-height: 1.2;
		color: #1a1918;
		margin-bottom: 1.4rem;
		font-weight: 800;
	}

	.hero-description {
		font-size: 1.08rem;
		line-height: 1.7;
		color: #5c5348;
		margin-bottom: 2.2rem;
		max-width: 540px;
	}

	.hero-cta-group {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		margin-bottom: 2.8rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.85rem 1.6rem;
		border-radius: 30px;
		font-weight: 700;
		font-size: 0.92rem;
		text-decoration: none;
		transition: all 0.25s ease;
		cursor: pointer;
		border: none;
	}

	.btn-hero-primary {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		box-shadow: 0 6px 20px rgba(197, 160, 89, 0.4);
	}

	.btn-hero-primary:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 25px rgba(197, 160, 89, 0.55);
	}

	.btn-hero-secondary {
		background: #ffffff;
		color: #4b3e28;
		border: 1px solid #dfd2be;
	}

	.btn-hero-secondary:hover {
		background: #f7f3ec;
		transform: translateY(-2px);
	}

	.btn-hero-outline {
		background: transparent;
		color: #6b5c43;
		border: 1px dashed #c5a059;
	}

	.btn-hero-outline:hover {
		background: rgba(197, 160, 89, 0.1);
	}

	.hero-social-proof {
		display: flex;
		align-items: center;
		gap: 1.2rem;
	}

	.avatar-stack {
		display: flex;
	}

	.proof-avatar {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		border: 3px solid #ffffff;
		margin-left: -12px;
		object-fit: cover;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.proof-avatar:first-child {
		margin-left: 0;
	}

	.stars-row {
		color: #f59e0b;
		font-size: 0.85rem;
		margin-bottom: 0.2rem;
	}

	.proof-text {
		font-size: 0.82rem;
		color: #554e44;
	}

	/* HERO VISUAL MOCKUP */
	.visual-mockup-wrapper {
		position: relative;
		display: flex;
		justify-content: center;
	}

	.hero-phone-outer {
		width: 290px;
		height: 570px;
		background: #1a1918;
		border-radius: 42px;
		border: 8px solid #33312e;
		box-shadow:
			0 25px 50px rgba(0, 0, 0, 0.22),
			0 0 0 1px rgba(255, 255, 255, 0.1);
		overflow: hidden;
		position: relative;
	}

	.hero-phone-screen {
		width: 100%;
		height: 100%;
		background-image: linear-gradient(rgba(15, 12, 10, 0.55), rgba(15, 12, 10, 0.85)),
			url('https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=600');
		background-size: cover;
		background-position: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		text-align: center;
		color: #ffffff;
	}

	.mockup-sub {
		font-family: 'Cinzel', serif;
		font-size: 0.65rem;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: #f4ead3;
		margin-bottom: 0.8rem;
	}

	.mockup-names {
		font-family: 'Alex Brush', cursive;
		font-size: 2.8rem;
		line-height: 1.1;
		color: #ffffff;
		margin: 0 0 1.5rem;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
	}

	.mockup-to-card {
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 0.6rem 1rem;
		margin-bottom: 1.5rem;
		width: 85%;
	}

	.mockup-to-card span {
		display: block;
		font-size: 0.65rem;
		color: #e5ded5;
	}

	.mockup-to-card strong {
		font-family: 'Cinzel', serif;
		font-size: 0.95rem;
		color: #ffffff;
	}

	.mockup-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: linear-gradient(135deg, #c5a059 0%, #fff7d6 50%, #aa7c11 100%);
		color: #111;
		text-decoration: none;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 1px;
		padding: 0.65rem 1.2rem;
		border-radius: 25px;
	}

	/* FLOATING BUBBLES */
	.floating-bubble {
		position: absolute;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(12px);
		border: 1px solid #ebdcc8;
		padding: 0.75rem 1rem;
		border-radius: 16px;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
		z-index: 10;
		animation: floatAnim 4s ease-in-out infinite alternate;
	}

	.bubble-icon {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		color: #ffffff;
		flex-shrink: 0;
	}

	.icon-wa {
		background: #22c55e;
	}

	.icon-gift {
		background: #f59e0b;
	}

	.icon-music {
		background: #8b5cf6;
	}

	.bubble-text strong {
		display: block;
		font-size: 0.8rem;
		color: #1a1918;
	}

	.bubble-text span {
		font-size: 0.7rem;
		color: #776e62;
	}

	.bubble-1 {
		top: 15%;
		left: -25px;
	}

	.bubble-2 {
		bottom: 22%;
		right: -30px;
		animation-delay: 1.5s;
	}

	.bubble-3 {
		bottom: 4%;
		left: 0;
		animation-delay: 2.5s;
	}

	@keyframes floatAnim {
		from {
			transform: translateY(0px);
		}
		to {
			transform: translateY(-8px);
		}
	}

	/* FEATURES GRID */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.feature-card {
		background: #ffffff;
		border-radius: 20px;
		padding: 2rem 1.6rem;
		border: 1px solid #e7ded2;
		transition: all 0.3s ease;
	}

	.feature-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 12px 30px rgba(197, 160, 89, 0.15);
		border-color: #c5a059;
	}

	.feature-icon-box {
		width: 52px;
		height: 52px;
		border-radius: 14px;
		background: rgba(197, 160, 89, 0.15);
		color: #8c6a27;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.25rem;
	}

	.feature-title {
		font-family: 'Cinzel', serif;
		font-size: 1.12rem;
		font-weight: 700;
		color: #1a1918;
		margin-bottom: 0.6rem;
	}

	.feature-desc {
		font-size: 0.88rem;
		line-height: 1.6;
		color: #665d52;
		margin: 0;
	}

	/* CATALOG FILTER BAR */
	.catalog-filter-bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		margin-bottom: 2.5rem;
	}

	.filter-pill-btn {
		background: #ffffff;
		border: 1px solid #dfd5c5;
		color: #554e44;
		font-size: 0.85rem;
		font-weight: 600;
		padding: 0.55rem 1.25rem;
		border-radius: 30px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		transition: all 0.2s ease;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
	}

	.filter-pill-btn:hover {
		border-color: #c5a059;
		color: #1a1918;
		transform: translateY(-1px);
	}

	.filter-pill-btn.active {
		background: #1a1816;
		color: #ffffff;
		border-color: #1a1816;
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
	}

	.filter-pill-btn.filter-free.active {
		background: #15803d;
		border-color: #15803d;
		color: #ffffff;
	}

	.filter-pill-btn.filter-pro.active {
		background: linear-gradient(135deg, #c5a059 0%, #aa7c11 100%);
		border-color: #c5a059;
		color: #1a1408;
	}

	.filter-pill-btn.filter-vip.active {
		background: linear-gradient(135deg, #9e1b32 0%, #700b1d 100%);
		border-color: #9e1b32;
		color: #ffffff;
	}

	/* TEMPLATES CATALOG GRID */
	.templates-catalog-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.8rem;
	}

	.catalog-card {
		background: #ffffff;
		border-radius: 20px;
		overflow: hidden;
		border: 1px solid #e8e0d4;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
	}

	.catalog-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 16px 35px rgba(0, 0, 0, 0.08);
	}

	.catalog-image-wrap {
		position: relative;
		height: 220px;
		overflow: hidden;
	}

	.catalog-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.5s ease;
	}

	.catalog-card:hover .catalog-img {
		transform: scale(1.06);
	}

	.catalog-overlay {
		position: absolute;
		inset: 0;
		background: rgba(15, 12, 10, 0.65);
		backdrop-filter: blur(3px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		opacity: 0;
		transition: opacity 0.3s ease;
		padding: 1rem;
	}

	.catalog-card:hover .catalog-overlay {
		opacity: 1;
	}

	.btn-overlay-action {
		background: #c5a059;
		color: #ffffff;
		border: none;
		padding: 0.6rem 1.2rem;
		border-radius: 25px;
		font-weight: 700;
		font-size: 0.84rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.btn-overlay-preview {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
		border: 1px solid #ffffff;
		padding: 0.55rem 1.2rem;
		border-radius: 25px;
		font-weight: 600;
		font-size: 0.82rem;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.catalog-info {
		padding: 1.4rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.catalog-name {
		font-family: 'Cinzel', serif;
		font-size: 1.15rem;
		font-weight: 700;
		color: #1a1918;
		margin: 0 0 0.4rem;
	}

	.catalog-desc {
		font-size: 0.84rem;
		line-height: 1.6;
		color: #6b6357;
		margin: 0 0 1.2rem;
		flex: 1;
	}

	.catalog-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 0.85rem;
		border-top: 1px solid #f0e8dc;
	}

	.catalog-swatch {
		display: flex;
		gap: 0.35rem;
	}

	.swatch-circle {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.15);
	}

	.btn-select-tpl {
		background: none;
		border: none;
		color: #a88439;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.catalog-tier-corner {
		position: absolute;
		top: 12px;
		right: 12px;
		font-size: 0.72rem;
		font-weight: 800;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		z-index: 5;
	}

	.catalog-tier-corner.tier-free {
		background: rgba(255, 255, 255, 0.95);
		color: #15803d;
		border: 1px solid rgba(22, 163, 74, 0.3);
	}

	.catalog-tier-corner.tier-pro {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		border: 1px solid rgba(170, 124, 17, 0.4);
	}

	.catalog-tier-corner.tier-vip {
		background: linear-gradient(135deg, #9e1b32 0%, #c4334f 50%, #dfb15b 100%);
		color: #ffffff;
		border: 1px solid rgba(223, 177, 91, 0.6);
		box-shadow: 0 2px 10px rgba(158, 27, 50, 0.4);
	}

	.catalog-category-pill {
		position: absolute;
		bottom: 12px;
		left: 12px;
		background: rgba(18, 16, 14, 0.82);
		backdrop-filter: blur(8px);
		color: #f3ede2;
		font-size: 0.7rem;
		font-weight: 600;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		border: 1px solid rgba(197, 160, 89, 0.35);
		z-index: 5;
	}

	.is-premium-card {
		border-color: #ebdcc8;
	}

	.catalog-card.is-vip-card {
		border-color: #f0ccd3;
	}

	.btn-select-tpl.btn-select-vip {
		color: #9e1b32;
	}

	/* PRICING SECTION STYLES */
	.pricing-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
		gap: 2rem;
		align-items: stretch;
	}

	.pricing-plan-card {
		background: #ffffff;
		border-radius: 24px;
		padding: 2.5rem 2rem;
		border: 1px solid #e7ded2;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.04);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
		transition: all 0.3s ease;
	}

	.pricing-plan-card:hover {
		transform: translateY(-5px);
		box-shadow: 0 16px 35px rgba(0, 0, 0, 0.08);
	}

	.pricing-plan-card.featured-plan {
		border: 2px solid #c5a059;
		box-shadow: 0 16px 40px rgba(197, 160, 89, 0.18);
		transform: scale(1.02);
	}

	.pricing-plan-card.featured-plan:hover {
		transform: scale(1.02) translateY(-5px);
	}

	.featured-ribbon {
		position: absolute;
		top: -14px;
		left: 50%;
		transform: translateX(-50%);
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		font-family: 'Cinzel', serif;
		font-size: 0.72rem;
		font-weight: 800;
		letter-spacing: 1px;
		padding: 0.35rem 1rem;
		border-radius: 20px;
		box-shadow: 0 4px 12px rgba(197, 160, 89, 0.4);
		white-space: nowrap;
	}

	.plan-header {
		text-align: center;
		padding-bottom: 1.5rem;
		border-bottom: 1px solid #f0e7db;
		margin-bottom: 1.5rem;
	}

	.plan-badge {
		display: inline-block;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 1px;
		text-transform: uppercase;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		margin-bottom: 0.8rem;
	}

	.badge-free-plan {
		background: #f3f4f6;
		color: #4b5563;
	}

	.badge-pro-plan {
		background: rgba(197, 160, 89, 0.15);
		color: #8c6a27;
	}

	.badge-vip-plan {
		background: #fdf2f8;
		color: #db2777;
	}

	.plan-title {
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		font-weight: 800;
		color: #1a1918;
		margin: 0 0 0.4rem;
	}

	.plan-desc {
		font-size: 0.86rem;
		color: #665d52;
		margin: 0 0 1.2rem;
		min-height: 40px;
	}

	.plan-price-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.price-strikethrough {
		font-size: 0.85rem;
		color: #9ca3af;
		text-decoration: line-through;
	}

	.price-val {
		font-family: 'Cinzel', serif;
		font-size: 2.2rem;
		font-weight: 800;
		color: #1a1918;
		line-height: 1.1;
	}

	.price-cycle {
		font-size: 0.75rem;
		color: #8c8276;
	}

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 0 0 2rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		font-size: 0.86rem;
		color: #3b352e;
		flex: 1;
	}

	.plan-features li {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		line-height: 1.5;
	}

	.plan-features li i {
		font-size: 1rem;
		margin-top: 0.1rem;
	}

	.feature-disabled {
		opacity: 0.5;
		text-decoration: line-through;
	}

	.btn-plan-action {
		width: 100%;
		padding: 0.85rem;
		border-radius: 25px;
		font-weight: 700;
		font-size: 0.9rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		transition: all 0.25s ease;
		border: none;
	}

	.btn-plan-free {
		background: #f4efe9;
		color: #4b3e28;
		border: 1px solid #dfd2be;
	}

	.btn-plan-free:hover {
		background: #eadecb;
		color: #1a1408;
	}

	.btn-plan-pro {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		box-shadow: 0 6px 20px rgba(197, 160, 89, 0.4);
	}

	.btn-plan-pro:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 25px rgba(197, 160, 89, 0.55);
	}

	.btn-plan-vip {
		background: #181512;
		color: #ffffff;
		border: 1px solid rgba(197, 160, 89, 0.5);
	}

	.btn-plan-vip:hover {
		background: #2b251e;
		color: #c5a059;
	}

	/* STEPS GRID */
	.steps-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
		gap: 1.5rem;
	}

	.step-card {
		background: #ffffff;
		border-radius: 20px;
		padding: 2.2rem 1.5rem;
		text-align: center;
		border: 1px solid #e5dccc;
		position: relative;
	}

	.step-num {
		position: absolute;
		top: 12px;
		left: 16px;
		font-family: 'Cinzel', serif;
		font-size: 0.9rem;
		font-weight: 800;
		color: #c5a059;
		opacity: 0.8;
	}

	.step-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: #fdfaf5;
		border: 2px solid #eadecb;
		color: #c5a059;
		font-size: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 1.2rem;
	}

	.step-title {
		font-family: 'Cinzel', serif;
		font-size: 1.15rem;
		font-weight: 700;
		color: #1a1918;
		margin: 0 0 0.5rem;
	}

	.step-desc {
		font-size: 0.86rem;
		line-height: 1.6;
		color: #665d52;
		margin: 0;
	}

	/* TESTIMONIAL */
	.testimonial-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1.8rem;
	}

	.testi-card {
		background: #ffffff;
		border-radius: 20px;
		padding: 2rem;
		border: 1px solid #e7dfd4;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.03);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.testi-stars {
		color: #f59e0b;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.testi-quote {
		font-size: 0.94rem;
		line-height: 1.7;
		font-style: italic;
		color: #3b352e;
		margin-bottom: 1.5rem;
	}

	.testi-author {
		display: flex;
		align-items: center;
		gap: 0.85rem;
	}

	.testi-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid #c5a059;
	}

	.author-name {
		font-family: 'Cinzel', serif;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1a1918;
		margin: 0 0 0.2rem;
	}

	.author-sub {
		font-size: 0.75rem;
		color: #887d70;
	}

	/* FAQ */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.faq-item {
		background: #ffffff;
		border-radius: 14px;
		border: 1px solid #e5dcce;
		overflow: hidden;
		transition: all 0.2s ease;
	}

	.faq-item.is-open {
		border-color: #c5a059;
	}

	.faq-question {
		width: 100%;
		padding: 1.25rem 1.5rem;
		background: none;
		border: none;
		text-align: left;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'Cinzel', serif;
		font-size: 0.98rem;
		font-weight: 700;
		color: #1a1918;
		cursor: pointer;
	}

	.faq-question i {
		color: #a88439;
		font-size: 0.9rem;
	}

	.faq-answer {
		padding: 0 1.5rem 1.25rem;
		font-size: 0.88rem;
		line-height: 1.65;
		color: #554e44;
	}

	.faq-answer p {
		margin: 0;
	}

	/* CTA BANNER */
	.cta-banner-section {
		padding: 4rem 0 5.5rem;
	}

	.cta-card {
		background: linear-gradient(135deg, #181512 0%, #29241e 100%);
		border: 1px solid rgba(197, 160, 89, 0.4);
		border-radius: 28px;
		padding: 4rem 2rem;
		text-align: center;
		color: #ffffff;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
	}

	.cta-badge {
		font-family: 'Cinzel', serif;
		font-size: 0.72rem;
		letter-spacing: 3px;
		color: #c5a059;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.cta-title {
		font-family: 'Cinzel', serif;
		font-size: clamp(1.8rem, 4vw, 2.6rem);
		margin-bottom: 1rem;
		font-weight: 800;
	}

	.cta-desc {
		font-size: 1rem;
		line-height: 1.65;
		color: #ccc4ba;
		max-width: 580px;
		margin: 0 auto 2.2rem;
	}

	.cta-buttons {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}

	.btn-cta-primary {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #12100e;
		font-weight: 700;
		padding: 0.95rem 2rem;
		border-radius: 30px;
	}

	.btn-cta-primary:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(197, 160, 89, 0.45);
	}

	.btn-cta-outline {
		background: transparent;
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 0.95rem 1.8rem;
		border-radius: 30px;
	}

	.btn-cta-outline:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.btn-primary-custom {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #12100e;
		font-weight: 700;
		padding: 0.85rem 2rem;
		border-radius: 30px;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}

	.btn-primary-custom:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(197, 160, 89, 0.4);
	}

	.mt-5 {
		margin-top: 2.5rem;
	}

	.me-2 {
		margin-right: 0.5rem;
	}

	@media (max-width: 991px) {
		.hero-container {
			grid-template-columns: 1fr;
			text-align: center;
			gap: 3rem;
		}

		.hero-visual {
			margin-top: 1rem;
		}

		.hero-description {
			margin-left: auto;
			margin-right: auto;
		}

		.hero-cta-group {
			justify-content: center;
		}

		.hero-social-proof {
			justify-content: center;
		}

		.floating-bubble {
			display: none;
		}

		.pricing-cards-grid {
			grid-template-columns: 1fr;
			max-width: 500px;
			margin: 0 auto;
		}

		.pricing-plan-card.featured-plan {
			transform: none;
		}

		.pricing-plan-card.featured-plan:hover {
			transform: translateY(-5px);
		}
	}

	@media (max-width: 768px) {
		.templates-catalog-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.catalog-filter-bar {
			overflow-x: auto;
			justify-content: flex-start;
			padding-bottom: 0.6rem;
			flex-wrap: nowrap;
			-webkit-overflow-scrolling: touch;
		}

		.filter-pill-btn {
			white-space: nowrap;
			flex-shrink: 0;
		}

		.hero-title {
			font-size: 2.2rem;
		}

		.steps-grid {
			grid-template-columns: 1fr;
			gap: 1.5rem;
		}

		.testimonial-grid {
			grid-template-columns: 1fr;
		}

		.cta-card {
			padding: 2.5rem 1.5rem;
			border-radius: 20px;
		}

		.hero-phone-outer {
			width: 290px;
			height: 580px;
			margin: 0 auto;
		}
	}

	@media (max-width: 480px) {
		.hero-title {
			font-size: 1.85rem;
		}

		.section-padding {
			padding: 3.5rem 1rem;
		}

		.hero-cta-group {
			flex-direction: column;
			width: 100%;
		}

		.btn-hero-primary,
		.btn-hero-outline {
			width: 100%;
			justify-content: center;
		}

		.cta-buttons {
			flex-direction: column;
			width: 100%;
		}

		.btn-cta-primary,
		.btn-cta-outline {
			width: 100%;
		}

		.pricing-plan-card {
			padding: 1.75rem 1.25rem;
		}
	}
</style>
