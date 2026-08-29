<script>
	import { onMount } from 'svelte';
	import { weddingStore, TEMPLATES, MUSIC_TRACKS } from '$lib/weddingStore.svelte.js';
	import InvitationView from '$lib/components/InvitationView.svelte';
	import AuthModal from '$lib/components/AuthModal.svelte';
	import UpgradeModal from '$lib/components/UpgradeModal.svelte';
	import OrderWaModal from '$lib/components/OrderWaModal.svelte';

	// Active tab inside the editor
	let activeTab = $state('template');

	// Mobile view mode: 'form' or 'preview'
	let mobileView = $state('form');

	// Selected guest name for live preview
	let previewGuestName = $state('Bapak Budi Santoso & Keluarga');

	// Auth, Upgrade, & Order WhatsApp modal states
	let isAuthModalOpen = $state(false);
	let isUpgradeModalOpen = $state(false);
	let isOrderWaModalOpen = $state(false);
	let orderPackageName = $state('Paket Premium All-in-One');
	let orderAmount = $state(140000);
	let targetUpgradeTemplate = $state(null);

	onMount(() => {
		weddingStore.initSupabaseAuth();
		if (!weddingStore.user.isLoggedIn) {
			setTimeout(() => {
				if (!weddingStore.user.isLoggedIn) {
					isAuthModalOpen = true;
				}
			}, 300);
		}
	});

	// Toast state
	let toastMsg = $state('');
	let showToast = $state(false);

	// New guest form
	let newTamuNama = $state('');
	let newTamuWa = $state('');

	// New story milestone form
	let newCeritaTahun = $state('');
	let newCeritaJudul = $state('');
	let newCeritaIsi = $state('');

	// New photo form
	let newFotoUrl = $state('');
	let newFotoCaption = $state('');

	// New bank account form
	let newBankNama = $state('Bank Central Asia (BCA)');
	let newBankRek = $state('');
	let newBankAn = $state('');

	// JSON import/export modal state
	let isJsonModalOpen = $state(false);
	let jsonContent = $state('');

	// Quick sample photos
	const SAMPLE_PHOTOS = [
		{
			url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
			label: 'Cover Alam'
		},
		{
			url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200',
			label: 'Romantic Forest'
		},
		{
			url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200',
			label: 'Rose Blossom'
		},
		{
			url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=1200',
			label: 'Midnight Glam'
		}
	];

	function notify(msg) {
		toastMsg = msg;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 2500);
	}

	function handleDataChange() {
		weddingStore.save();
	}

	function isTemplateLocked(tpl) {
		if (tpl.tier === 'free' || !tpl.isPremium) return false;
		if (weddingStore.user.tier === 'vip') return false;
		if (weddingStore.user.tier === 'premium' && tpl.tier !== 'vip') return false;
		return true;
	}

	function selectTemplate(tplOrId) {
		const tpl =
			typeof tplOrId === 'string'
				? TEMPLATES.find((t) => t.id === tplOrId) || TEMPLATES[0]
				: tplOrId;

		if (isTemplateLocked(tpl)) {
			targetUpgradeTemplate = tpl;
			isUpgradeModalOpen = true;
			return;
		}

		weddingStore.setTemplate(tpl.id);
		notify(`Template "${tpl.name}" aktif!`);
	}

	function handleAddTamu(e) {
		e.preventDefault();
		if (!newTamuNama.trim()) return;
		weddingStore.addTamu(newTamuNama, newTamuWa);
		previewGuestName = newTamuNama;
		newTamuNama = '';
		newTamuWa = '';
		notify('Tamu berhasil ditambahkan!');
	}

	function handleAddCerita(e) {
		e.preventDefault();
		if (!newCeritaJudul.trim()) return;
		weddingStore.addCerita(newCeritaTahun, newCeritaJudul, newCeritaIsi);
		newCeritaTahun = '';
		newCeritaJudul = '';
		newCeritaIsi = '';
		notify('Kisah cinta ditambahkan!');
	}

	function handleAddFoto(e) {
		e.preventDefault();
		if (!newFotoUrl.trim()) return;
		weddingStore.addFotoGaleri(newFotoUrl, newFotoCaption);
		newFotoUrl = '';
		newFotoCaption = '';
		notify('Foto galeri ditambahkan!');
	}

	function handleAddRekening(e) {
		e.preventDefault();
		if (!newBankRek.trim()) return;
		weddingStore.addRekening(newBankNama, newBankRek, newBankAn);
		newBankRek = '';
		newBankAn = '';
		notify('Rekening bank ditambahkan!');
	}

	function copyShareLink(guestName = '') {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const url = guestName
			? `${base}/invite?to=${encodeURIComponent(guestName)}`
			: `${base}/invite`;
		navigator.clipboard.writeText(url).then(() => {
			notify('Link undangan berhasil disalin!');
		});
	}

	function copyWaMessage(guestName = 'Tamu Undangan') {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const text = weddingStore.generateWaText(guestName, base);
		navigator.clipboard.writeText(text).then(() => {
			notify(`Pesan WhatsApp untuk "${guestName}" berhasil disalin!`);
		});
	}

	function openWhatsApp(guest) {
		const base = typeof window !== 'undefined' ? window.location.origin : '';
		const text = encodeURIComponent(weddingStore.generateWaText(guest.nama, base));
		let waNum = (guest.nomorWa || '').replace(/[^0-9]/g, '');
		if (waNum.startsWith('0')) {
			waNum = '62' + waNum.slice(1);
		}
		const url = waNum ? `https://wa.me/${waNum}?text=${text}` : `https://wa.me/?text=${text}`;
		window.open(url, '_blank');
	}

	function handleReset() {
		if (confirm('Apakah Anda yakin ingin mengembalikan seluruh data undangan ke default bawaan?')) {
			weddingStore.reset();
			notify('Data berhasil di-reset ke preset default!');
		}
	}

	function openExportModal() {
		jsonContent = weddingStore.exportJson();
		isJsonModalOpen = true;
	}

	function handleImportJson() {
		const success = weddingStore.importJson(jsonContent);
		if (success) {
			isJsonModalOpen = false;
			notify('Data undangan berhasil diimpor!');
		} else {
			alert('Format JSON tidak valid. Periksa kembali teks JSON Anda.');
		}
	}
</script>

<svelte:head>
	<title>Studio Editor Undangan — Kisah Nikah</title>
</svelte:head>

{#if !weddingStore.user.isLoggedIn}
	<!-- LOGIN REQUIRED GATE FOR STUDIO EDITOR -->
	<div class="editor-gate-screen">
		<div class="gate-card">
			<div class="gate-icon-circle">
				<i class="bi bi-person-lock"></i>
			</div>
			<span class="gate-badge">LOGIN DIPERLUKAN</span>
			<h2 class="gate-title">Masuk untuk Membuat Undangan</h2>
			<p class="gate-desc">
				Untuk memastikan seluruh rancangan undangan, data mempelai, jadwal acara, galeri foto, dan konfirmasi kehadiran tersimpan aman di database serta siap disebarkan, silakan masuk ke akun Anda atau daftar akun gratis.
			</p>

			<div class="gate-actions">
				<button type="button" class="btn btn-gate-login" onclick={() => (isAuthModalOpen = true)}>
					<i class="bi bi-box-arrow-in-right"></i> Masuk / Daftar Akun
				</button>
				<a href="/" class="btn btn-gate-home">
					<i class="bi bi-arrow-left"></i> Kembali ke Beranda
				</a>
			</div>
		</div>
	</div>
{:else}
<div class="editor-layout">
	<!-- TOP APP BAR -->
	<header class="editor-topbar">
		<div class="topbar-left">
			<a href="/" class="btn-back-home" title="Kembali ke Beranda">
				<i class="bi bi-arrow-left"></i>
				<span class="d-none-mobile">Beranda</span>
			</a>
			<div class="topbar-divider"></div>
			<div class="topbar-brand">
				<img src="/logo.png" alt="Kisah Nikah" class="topbar-logo-img" />
				<div>
					<h1 class="topbar-title">Studio Editor Undangan</h1>
					<span class="topbar-sub">Kisah Nikah Live Builder</span>
				</div>
			</div>
		</div>

		<div class="topbar-center">
			<!-- Template Switcher Dropdown -->
			<div class="template-quick-select">
				<label for="quick-tpl">
					<i class="bi bi-palette-fill"></i>
					<span>Tema:</span>
				</label>
				<select
					id="quick-tpl"
					value={weddingStore.data.templateId}
					onchange={(e) => selectTemplate(e.currentTarget.value)}
				>
					<optgroup label="🎁 TEMPLATE GRATIS (Free Trial)">
						{#each TEMPLATES.filter((t) => t.tier === 'free') as tpl}
							<option value={tpl.id}>🎁 {tpl.name} (Gratis)</option>
						{/each}
					</optgroup>
					<optgroup label="⭐ TEMPLATE PREMIUM PRO (Rp 140rb)">
						{#each TEMPLATES.filter((t) => t.tier === 'premium') as tpl}
							<option value={tpl.id}>⭐ {tpl.name} (Premium)</option>
						{/each}
					</optgroup>
					<optgroup label="👑 TEMPLATE VIP EXCLUSIVE (Rp 250rb)">
						{#each TEMPLATES.filter((t) => t.tier === 'vip') as tpl}
							<option value={tpl.id}>👑 {tpl.name} (VIP)</option>
						{/each}
					</optgroup>
				</select>
			</div>
		</div>

		<div class="topbar-right">
			<!-- User Tier Indicator -->
			{#if weddingStore.user.isLoggedIn}
				<div class="topbar-user-status">
					<span class="user-name-small">{weddingStore.user.name}</span>
					{#if weddingStore.user.tier === 'vip'}
						<span class="badge-vip" style="background: linear-gradient(135deg, #9e1b32, #dfb15b);" title="Akun VIP Exclusive">👑 VIP</span>
					{:else if weddingStore.user.tier === 'premium'}
						<span class="badge-vip" title="Akun Premium Pro">⭐ Pro</span>
					{:else}
						<span class="badge-free">Free</span>
						<button
							type="button"
							class="btn-upgrade-topbar"
							onclick={() => {
								targetUpgradeTemplate = TEMPLATES[3];
								isUpgradeModalOpen = true;
							}}
						>
							⭐ Upgrade
						</button>
					{/if}
				</div>
			{:else}
				<button
					type="button"
					class="btn-topbar-action"
					onclick={() => (isAuthModalOpen = true)}
				>
					<i class="bi bi-person"></i>
					<span>Masuk</span>
				</button>
			{/if}

			<!-- Mobile Toggle Form / Preview -->
			<div class="mobile-view-toggle">
				<button
					type="button"
					class="btn-toggle-view {mobileView === 'form' ? 'active' : ''}"
					onclick={() => (mobileView = 'form')}
				>
					<i class="bi bi-sliders"></i> Edit
				</button>
				<button
					type="button"
					class="btn-toggle-view {mobileView === 'preview' ? 'active' : ''}"
					onclick={() => (mobileView = 'preview')}
				>
					<i class="bi bi-phone"></i> Preview
				</button>
			</div>

			<button
				type="button"
				class="btn-topbar-action"
				onclick={openExportModal}
				title="Cadangkan / Impor JSON"
			>
				<i class="bi bi-code-square"></i>
				<span class="d-none-tablet">JSON</span>
			</button>

			<button
				type="button"
				class="btn-topbar-action btn-danger-action"
				onclick={handleReset}
				title="Reset ke Data Bawaan"
			>
				<i class="bi bi-arrow-counterclockwise"></i>
				<span class="d-none-tablet">Reset</span>
			</button>

			<a
				href="/invite?template={weddingStore.data.templateId}&to={encodeURIComponent(previewGuestName)}"
				target="_blank"
				rel="noopener noreferrer"
				class="btn-topbar-preview"
			>
				<i class="bi bi-box-arrow-up-right"></i>
				<span>Buka Undangan Tamu</span>
			</a>
		</div>
	</header>

	<!-- MAIN WORKSPACE -->
	<div class="editor-workspace">
		<!-- LEFT COLUMN: FORM TABS & INPUTS -->
		<div class="editor-sidebar {mobileView === 'form' ? 'show-on-mobile' : 'hide-on-mobile'}">
			<!-- Tab Navigation Bar -->
			<nav class="sidebar-tabs">
				<button
					type="button"
					class="tab-btn {activeTab === 'template' ? 'active' : ''}"
					onclick={() => (activeTab = 'template')}
				>
					<i class="bi bi-palette"></i>
					<span>Tema & Desain</span>
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'mempelai' ? 'active' : ''}"
					onclick={() => (activeTab = 'mempelai')}
				>
					<i class="bi bi-people"></i>
					<span>Data Mempelai</span>
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'acara' ? 'active' : ''}"
					onclick={() => (activeTab = 'acara')}
				>
					<i class="bi bi-calendar-event"></i>
					<span>Jadwal Acara</span>
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'kutipan' ? 'active' : ''}"
					onclick={() => (activeTab = 'kutipan')}
				>
					<i class="bi bi-chat-quote"></i>
					<span>Ayat & Kutipan</span>
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'cerita' ? 'active' : ''}"
					onclick={() => (activeTab = 'cerita')}
				>
					<i class="bi bi-hearts"></i>
					<span>Kisah Cinta</span>
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'galeri' ? 'active' : ''}"
					onclick={() => (activeTab = 'galeri')}
				>
					<i class="bi bi-images"></i>
					<span>Galeri Foto</span>
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'kado' ? 'active' : ''}"
					onclick={() => (activeTab = 'kado')}
				>
					<i class="bi bi-gift"></i>
					<span>Kado & Rekening</span>
				</button>
				<button
					type="button"
					class="tab-btn {activeTab === 'tamu' ? 'active' : ''}"
					onclick={() => (activeTab = 'tamu')}
				>
					<i class="bi bi-whatsapp"></i>
					<span>Sebar & Tamu</span>
				</button>
			</nav>

			<!-- TAB CONTENT CONTAINER -->
			<div class="sidebar-form-container">
				<!-- TAB 1: TEMPLATE & DESAIN -->
				{#if activeTab === 'template'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Pilih Desain Template</h3>
							<p>Tentukan gaya estetika visual yang paling sesuai dengan tema pernikahan Anda.</p>
						</div>

						<div class="template-cards-grid">
							{#each TEMPLATES as tpl}
								<button
									type="button"
									class="tpl-option-card {weddingStore.data.templateId === tpl.id
										? 'is-selected'
										: ''}"
									onclick={() => selectTemplate(tpl)}
								>
									<div class="tpl-thumb-wrap">
										<img src={tpl.previewImage} alt={tpl.name} class="tpl-thumb" />
										
										<!-- Status Badge: Active vs Free/Premium -->
										{#if weddingStore.data.templateId === tpl.id}
											<div class="selected-badge">
												<i class="bi bi-check-circle-fill"></i> Aktif
											</div>
										{/if}

										<div class="tier-corner-badge {tpl.tier === 'vip' ? 'tier-vip' : (tpl.isPremium ? 'tier-pro' : 'tier-free')}">
											{#if tpl.tier === 'vip'}
												<i class="bi bi-crown-fill"></i> VIP
											{:else if tpl.isPremium}
												<i class="bi bi-stars"></i> Pro
											{:else}
												Gratis
											{/if}
										</div>

										<!-- Locked Overlay for Locked Users -->
										{#if isTemplateLocked(tpl)}
											<div class="tpl-locked-overlay">
												<div class="locked-icon-circle {tpl.tier === 'vip' ? 'vip-lock' : ''}">
													<i class="bi {tpl.tier === 'vip' ? 'bi-crown-fill' : 'bi-lock-fill'}"></i>
												</div>
												<span>{tpl.tier === 'vip' ? 'Buka VIP (Rp 250rb)' : 'Buka Pro (Rp 140rb)'}</span>
											</div>
										{/if}
									</div>
									<div class="tpl-info">
										<div class="tpl-title">{tpl.name}</div>
										<span class="tpl-tag">{tpl.tag}</span>
										<div class="tpl-colors">
											<span class="color-dot" style="background: {tpl.primaryColor}"></span>
											<span class="color-dot" style="background: {tpl.secondaryColor}"></span>
											<span class="color-dot" style="background: {tpl.bgColor}"></span>
										</div>
									</div>
								</button>
							{/each}
						</div>

						<!-- Music Settings -->
						<div class="form-section-box mt-4">
							<h4 class="box-title"><i class="bi bi-music-note-beamed"></i> Musik Latar Romantis</h4>
							<div class="form-row checkbox-row">
								<label class="switch-label">
									<input
										type="checkbox"
										bind:checked={weddingStore.data.music.enabled}
										onchange={handleDataChange}
									/>
									<span>Aktifkan Musik Otomatis Saat Undangan Dibuka</span>
								</label>
							</div>

							{#if weddingStore.data.music.enabled}
								<div class="form-group mt-3">
									<label for="track-select">Pilih Lagu Romantis:</label>
									<select
										id="track-select"
										bind:value={weddingStore.data.music.trackId}
										onchange={(e) => weddingStore.setMusicTrack(e.currentTarget.value)}
									>
										{#each MUSIC_TRACKS as track}
											<option value={track.id}>{track.title} ({track.artist})</option>
										{/each}
									</select>
								</div>
							{/if}
						</div>

						<!-- Cover Image Setting -->
						<div class="form-section-box mt-4">
							<h4 class="box-title"><i class="bi bi-image"></i> Foto Cover Undangan</h4>
							<div class="form-group">
								<label for="cover-url">URL Foto Cover (Latar Belakang Utama):</label>
								<input
									type="url"
									id="cover-url"
									bind:value={weddingStore.data.coverImage}
									oninput={handleDataChange}
									placeholder="https://..."
								/>
							</div>

							<div class="sample-covers-row">
								<span class="small text-muted">Contoh Gambar Pilihan:</span>
								<div class="sample-covers-buttons">
									{#each SAMPLE_PHOTOS as item}
										<button
											type="button"
											class="btn-sample-cover"
											onclick={() => {
												weddingStore.data.coverImage = item.url;
												handleDataChange();
											}}
										>
											{item.label}
										</button>
									{/each}
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- TAB 2: DATA MEMPELAI -->
				{#if activeTab === 'mempelai'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Informasi Mempelai</h3>
							<p>Lengkapi nama, keluarga, dan foto mempelai pria serta wanita.</p>
						</div>

						<!-- MEMPELAI PRIA -->
						<div class="form-section-box">
							<h4 class="box-title groom-title">
								<i class="bi bi-gender-male"></i> Mempelai Pria (Groom)
							</h4>

							<div class="form-group">
								<label for="pria-lengkap">Nama Lengkap & Gelar:</label>
								<input
									type="text"
									id="pria-lengkap"
									bind:value={weddingStore.data.mempelai.pria.namaLengkap}
									oninput={handleDataChange}
								/>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="pria-panggilan">Nama Panggilan:</label>
									<input
										type="text"
										id="pria-panggilan"
										bind:value={weddingStore.data.mempelai.pria.namaPanggilan}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="pria-anak">Urutan Anak:</label>
									<input
										type="text"
										id="pria-anak"
										bind:value={weddingStore.data.mempelai.pria.anakKe}
										oninput={handleDataChange}
										placeholder="Putra Pertama"
									/>
								</div>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="pria-ayah">Nama Ayah:</label>
									<input
										type="text"
										id="pria-ayah"
										bind:value={weddingStore.data.mempelai.pria.ayah}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="pria-ibu">Nama Ibu:</label>
									<input
										type="text"
										id="pria-ibu"
										bind:value={weddingStore.data.mempelai.pria.ibu}
										oninput={handleDataChange}
									/>
								</div>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="pria-foto">URL Foto Profil Pria:</label>
									<input
										type="url"
										id="pria-foto"
										bind:value={weddingStore.data.mempelai.pria.foto}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="pria-ig">Instagram (@username):</label>
									<input
										type="text"
										id="pria-ig"
										bind:value={weddingStore.data.mempelai.pria.instagram}
										oninput={handleDataChange}
										placeholder="tanpa @"
									/>
								</div>
							</div>
						</div>

						<!-- MEMPELAI WANITA -->
						<div class="form-section-box mt-4">
							<h4 class="box-title bride-title">
								<i class="bi bi-gender-female"></i> Mempelai Wanita (Bride)
							</h4>

							<div class="form-group">
								<label for="wanita-lengkap">Nama Lengkap & Gelar:</label>
								<input
									type="text"
									id="wanita-lengkap"
									bind:value={weddingStore.data.mempelai.wanita.namaLengkap}
									oninput={handleDataChange}
								/>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="wanita-panggilan">Nama Panggilan:</label>
									<input
										type="text"
										id="wanita-panggilan"
										bind:value={weddingStore.data.mempelai.wanita.namaPanggilan}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="wanita-anak">Urutan Anak:</label>
									<input
										type="text"
										id="wanita-anak"
										bind:value={weddingStore.data.mempelai.wanita.anakKe}
										oninput={handleDataChange}
										placeholder="Putri Kedua"
									/>
								</div>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="wanita-ayah">Nama Ayah:</label>
									<input
										type="text"
										id="wanita-ayah"
										bind:value={weddingStore.data.mempelai.wanita.ayah}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="wanita-ibu">Nama Ibu:</label>
									<input
										type="text"
										id="wanita-ibu"
										bind:value={weddingStore.data.mempelai.wanita.ibu}
										oninput={handleDataChange}
									/>
								</div>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="wanita-foto">URL Foto Profil Wanita:</label>
									<input
										type="url"
										id="wanita-foto"
										bind:value={weddingStore.data.mempelai.wanita.foto}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="wanita-ig">Instagram (@username):</label>
									<input
										type="text"
										id="wanita-ig"
										bind:value={weddingStore.data.mempelai.wanita.instagram}
										oninput={handleDataChange}
										placeholder="tanpa @"
									/>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- TAB 3: JADWAL ACARA -->
				{#if activeTab === 'acara'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Rangkaian Acara</h3>
							<p>Atur tanggal, waktu, dan lokasi Akad Nikah serta Resepsi Pernikahan.</p>
						</div>

						<!-- AKAD NIKAH -->
						<div class="form-section-box">
							<h4 class="box-title"><i class="bi bi-heart"></i> Akad Nikah</h4>

							<div class="form-group">
								<label for="akad-judul">Judul Acara:</label>
								<input
									type="text"
									id="akad-judul"
									bind:value={weddingStore.data.acara.akad.judul}
									oninput={handleDataChange}
								/>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="akad-tgl">Tanggal Acara:</label>
									<input
										type="date"
										id="akad-tgl"
										bind:value={weddingStore.data.acara.akad.tanggal}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="akad-zona">Zona Waktu:</label>
									<select
										id="akad-zona"
										bind:value={weddingStore.data.acara.akad.zonaWaktu}
										onchange={handleDataChange}
									>
										<option value="WIB">WIB (Waktu Indonesia Barat)</option>
										<option value="WITA">WITA (Waktu Indonesia Tengah)</option>
										<option value="WIT">WIT (Waktu Indonesia Timur)</option>
									</select>
								</div>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="akad-mulai">Jam Mulai:</label>
									<input
										type="time"
										id="akad-mulai"
										bind:value={weddingStore.data.acara.akad.waktuMulai}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="akad-selesai">Jam Selesai:</label>
									<input
										type="time"
										id="akad-selesai"
										bind:value={weddingStore.data.acara.akad.waktuSelesai}
										oninput={handleDataChange}
									/>
								</div>
							</div>

							<div class="form-group">
								<label for="akad-tempat">Nama Tempat / Masjid / Gedung:</label>
								<input
									type="text"
									id="akad-tempat"
									bind:value={weddingStore.data.acara.akad.tempat}
									oninput={handleDataChange}
								/>
							</div>

							<div class="form-group">
								<label for="akad-alamat">Alamat Lengkap:</label>
								<textarea
									id="akad-alamat"
									rows="2"
									bind:value={weddingStore.data.acara.akad.alamat}
									oninput={handleDataChange}
								></textarea>
							</div>

							<div class="form-group">
								<label for="akad-maps">Tautan Google Maps:</label>
								<input
									type="url"
									id="akad-maps"
									bind:value={weddingStore.data.acara.akad.mapsUrl}
									oninput={handleDataChange}
								/>
							</div>
						</div>

						<!-- RESEPSI PERNIKAHAN -->
						<div class="form-section-box mt-4">
							<h4 class="box-title"><i class="bi bi-balloon-heart"></i> Resepsi Pernikahan</h4>

							<div class="form-group">
								<label for="resepsi-judul">Judul Acara:</label>
								<input
									type="text"
									id="resepsi-judul"
									bind:value={weddingStore.data.acara.resepsi.judul}
									oninput={handleDataChange}
								/>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="resepsi-tgl">Tanggal Acara:</label>
									<input
										type="date"
										id="resepsi-tgl"
										bind:value={weddingStore.data.acara.resepsi.tanggal}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="resepsi-zona">Zona Waktu:</label>
									<select
										id="resepsi-zona"
										bind:value={weddingStore.data.acara.resepsi.zonaWaktu}
										onchange={handleDataChange}
									>
										<option value="WIB">WIB (Waktu Indonesia Barat)</option>
										<option value="WITA">WITA (Waktu Indonesia Tengah)</option>
										<option value="WIT">WIT (Waktu Indonesia Timur)</option>
									</select>
								</div>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="resepsi-mulai">Jam Mulai:</label>
									<input
										type="time"
										id="resepsi-mulai"
										bind:value={weddingStore.data.acara.resepsi.waktuMulai}
										oninput={handleDataChange}
									/>
								</div>
								<div class="form-group">
									<label for="resepsi-selesai">Jam Selesai:</label>
									<input
										type="time"
										id="resepsi-selesai"
										bind:value={weddingStore.data.acara.resepsi.waktuSelesai}
										oninput={handleDataChange}
									/>
								</div>
							</div>

							<div class="form-group">
								<label for="resepsi-tempat">Nama Gedung / Ballroom / Hotel:</label>
								<input
									type="text"
									id="resepsi-tempat"
									bind:value={weddingStore.data.acara.resepsi.tempat}
									oninput={handleDataChange}
								/>
							</div>

							<div class="form-group">
								<label for="resepsi-alamat">Alamat Lengkap:</label>
								<textarea
									id="resepsi-alamat"
									rows="2"
									bind:value={weddingStore.data.acara.resepsi.alamat}
									oninput={handleDataChange}
								></textarea>
							</div>

							<div class="form-group">
								<label for="resepsi-maps">Tautan Google Maps:</label>
								<input
									type="url"
									id="resepsi-maps"
									bind:value={weddingStore.data.acara.resepsi.mapsUrl}
									oninput={handleDataChange}
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- TAB 4: AYAT & KUTIPAN -->
				{#if activeTab === 'kutipan'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Ayat & Kutipan Pernikahan</h3>
							<p>Pilih atau tuliskan kata-kata mutiara, ayat suci, dan salam pembuka.</p>
						</div>

						<div class="form-section-box">
							<div class="form-group">
								<label for="salam-input">Salam Pembuka:</label>
								<input
									type="text"
									id="salam-input"
									bind:value={weddingStore.data.kutipan.salam}
									oninput={handleDataChange}
								/>
							</div>

							<div class="form-group">
								<label for="pesan-input">Pesan Pengantar:</label>
								<textarea
									id="pesan-input"
									rows="2"
									bind:value={weddingStore.data.kutipan.pesan}
									oninput={handleDataChange}
								></textarea>
							</div>

							<div class="form-group">
								<label for="ayat-teks">Isi Ayat / Kutipan Cinta:</label>
								<textarea
									id="ayat-teks"
									rows="4"
									bind:value={weddingStore.data.kutipan.teks}
									oninput={handleDataChange}
								></textarea>
							</div>

							<div class="form-group">
								<label for="ayat-sumber">Sumber Kutipan:</label>
								<input
									type="text"
									id="ayat-sumber"
									bind:value={weddingStore.data.kutipan.sumber}
									oninput={handleDataChange}
									placeholder="QS. Ar-Rum: 21"
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- TAB 5: KISAH CINTA (LOVE STORY) -->
				{#if activeTab === 'cerita'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Kisah Perjalanan Cinta</h3>
							<p>Bagikan momen-momen berharga dalam perjalanan cinta kalian.</p>
						</div>

						<!-- List of current milestones -->
						<div class="items-list">
							{#each weddingStore.data.cerita as c}
								<div class="item-card">
									<div class="item-header">
										<span class="badge-year">{c.tahun}</span>
										<button
											type="button"
											class="btn-delete-item"
											onclick={() => weddingStore.removeCerita(c.id)}
											title="Hapus momen"
										>
											<i class="bi bi-trash"></i>
										</button>
									</div>
									<h5 class="item-title">{c.judul}</h5>
									<p class="item-text">{c.isi}</p>
								</div>
							{/each}
						</div>

						<!-- Add milestone form -->
						<form onsubmit={handleAddCerita} class="form-section-box mt-4">
							<h4 class="box-title"><i class="bi bi-plus-circle"></i> Tambah Momen Cinta Baru</h4>
							<div class="form-row-2">
								<div class="form-group">
									<label for="new-cerita-tahun">Tahun / Waktu:</label>
									<input
										type="text"
										id="new-cerita-tahun"
										bind:value={newCeritaTahun}
										placeholder="Contoh: 2021"
										required
									/>
								</div>
								<div class="form-group">
									<label for="new-cerita-judul">Judul Momen:</label>
									<input
										type="text"
										id="new-cerita-judul"
										bind:value={newCeritaJudul}
										placeholder="Awal Pertemuan"
										required
									/>
								</div>
							</div>
							<div class="form-group">
								<label for="new-cerita-isi">Deskripsi Singkat:</label>
								<textarea
									id="new-cerita-isi"
									rows="2"
									bind:value={newCeritaIsi}
									placeholder="Ceritakan momen indah saat itu..."
									required
								></textarea>
							</div>
							<button type="submit" class="btn-submit-action">
								<i class="bi bi-check2"></i> Tambahkan Momen
							</button>
						</form>
					</div>
				{/if}

				<!-- TAB 6: GALERI FOTO -->
				{#if activeTab === 'galeri'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Galeri Foto Prewedding</h3>
							<p>Tampilkan foto-foto terbaik Anda dan pasangan.</p>
						</div>

						<!-- Photo Grid Management -->
						<div class="gallery-manager-grid">
							{#each weddingStore.data.galeri as foto}
								<div class="gallery-preview-card">
									<img src={foto.url} alt={foto.caption} class="gallery-preview-img" />
									<div class="gallery-preview-info">
										<span class="preview-caption">{foto.caption || 'Foto Prewedding'}</span>
										<button
											type="button"
											class="btn-delete-photo"
											onclick={() => weddingStore.removeFotoGaleri(foto.id)}
											title="Hapus foto"
										>
											<i class="bi bi-trash"></i>
										</button>
									</div>
								</div>
							{/each}
						</div>

						<!-- Add Photo Form -->
						<form onsubmit={handleAddFoto} class="form-section-box mt-4">
							<h4 class="box-title"><i class="bi bi-cloud-plus"></i> Tambah Foto Galeri</h4>
							<div class="form-group">
								<label for="new-foto-url">URL Foto:</label>
								<input
									type="url"
									id="new-foto-url"
									bind:value={newFotoUrl}
									placeholder="https://images.unsplash.com/..."
									required
								/>
							</div>
							<div class="form-group">
								<label for="new-foto-caption">Keterangan / Caption Foto (Opsional):</label>
								<input
									type="text"
									id="new-foto-caption"
									bind:value={newFotoCaption}
									placeholder="Momen bahagia di pantai"
								/>
							</div>
							<button type="submit" class="btn-submit-action">
								<i class="bi bi-plus-lg"></i> Simpan ke Galeri
							</button>
						</form>
					</div>
				{/if}

				<!-- TAB 7: KADO & REKENING -->
				{#if activeTab === 'kado'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Kado & Angpao Digital</h3>
							<p>Atur rekening bank, e-wallet, dan alamat fisik pengiriman kado.</p>
						</div>

						<div class="form-group">
							<label for="kado-desc">Pesan Pengantar Kado:</label>
							<textarea
								id="kado-desc"
								rows="2"
								bind:value={weddingStore.data.kado.deskripsi}
								oninput={handleDataChange}
							></textarea>
						</div>

						<!-- Current bank accounts -->
						<div class="items-list mt-3">
							{#each weddingStore.data.kado.rekening as rek}
								<div class="item-card">
									<div class="item-header">
										<span class="badge-bank">{rek.bank}</span>
										<button
											type="button"
											class="btn-delete-item"
											onclick={() => weddingStore.removeRekening(rek.id)}
											title="Hapus rekening"
										>
											<i class="bi bi-trash"></i>
										</button>
									</div>
									<div class="rek-num">{rek.noRek}</div>
									<div class="rek-an">a.n. {rek.atasNama}</div>
								</div>
							{/each}
						</div>

						<!-- Add Account Form -->
						<form onsubmit={handleAddRekening} class="form-section-box mt-4">
							<h4 class="box-title"><i class="bi bi-credit-card-2-front"></i> Tambah Rekening / E-Wallet</h4>
							<div class="form-group">
								<label for="new-bank-nama">Nama Bank / Dompet Digital:</label>
								<select id="new-bank-nama" bind:value={newBankNama}>
									<option value="Bank Central Asia (BCA)">Bank Central Asia (BCA)</option>
									<option value="Bank Mandiri">Bank Mandiri</option>
									<option value="Bank Syariah Indonesia (BSI)">Bank Syariah Indonesia (BSI)</option>
									<option value="Bank Rakyat Indonesia (BRI)">Bank Rakyat Indonesia (BRI)</option>
									<option value="Bank Negara Indonesia (BNI)">Bank Negara Indonesia (BNI)</option>
									<option value="GoPay / OVO / Dana / ShopeePay">GoPay / OVO / Dana / ShopeePay</option>
								</select>
							</div>
							<div class="form-row-2">
								<div class="form-group">
									<label for="new-bank-rek">Nomor Rekening / No. HP E-Wallet:</label>
									<input
										type="text"
										id="new-bank-rek"
										bind:value={newBankRek}
										placeholder="1234567890"
										required
									/>
								</div>
								<div class="form-group">
									<label for="new-bank-an">Atas Nama (A/N):</label>
									<input
										type="text"
										id="new-bank-an"
										bind:value={newBankAn}
										placeholder="Nama Pemilik Rekening"
										required
									/>
								</div>
							</div>
							<button type="submit" class="btn-submit-action">
								<i class="bi bi-check2"></i> Simpan Rekening
							</button>
						</form>

						<!-- Physical Gift Address -->
						<div class="form-section-box mt-4">
							<h4 class="box-title"><i class="bi bi-house-heart"></i> Alamat Pengiriman Kado Fisik</h4>
							<div class="form-group">
								<label for="alamat-kado">Alamat Lengkap & Kontak Penerima:</label>
								<textarea
									id="alamat-kado"
									rows="3"
									bind:value={weddingStore.data.kado.alamatKado}
									oninput={handleDataChange}
									placeholder="Jl. ..., No. ..., Kel. ..., Kec. ..., Kota ..., Kode Pos ..., No HP ..."
								></textarea>
							</div>
						</div>
					</div>
				{/if}

				<!-- TAB 8: SEBAR & DAFTAR TAMU (WHATSAPP GENERATOR) -->
				{#if activeTab === 'tamu'}
					<div class="tab-pane">
						<div class="pane-header">
							<h3>Sebar Undangan & Generator WhatsApp</h3>
							<p>
								Kirim undangan secara personal ke keluarga dan sahabat dengan sapaan khusus & teks
								WhatsApp siap kirim.
							</p>
						</div>

						<!-- Add Guest Form -->
						<form onsubmit={handleAddTamu} class="form-section-box">
							<h4 class="box-title"><i class="bi bi-person-plus-fill"></i> Tambah Tamu Undangan</h4>
							<div class="form-row-2">
								<div class="form-group">
									<label for="tamu-nama">Nama Tamu & Gelar / Keluarga:</label>
									<input
										type="text"
										id="tamu-nama"
										bind:value={newTamuNama}
										placeholder="Contoh: Bapak Budi & Keluarga"
										required
									/>
								</div>
								<div class="form-group">
									<label for="tamu-wa">Nomor WhatsApp (Opsional):</label>
									<input
										type="tel"
										id="tamu-wa"
										bind:value={newTamuWa}
										placeholder="081234567890"
									/>
								</div>
							</div>
							<button type="submit" class="btn-submit-action">
								<i class="bi bi-plus-lg"></i> Buat Link Undangan
							</button>
						</form>

						<!-- Guest List & 1-Click WhatsApp Copy -->
						<div class="form-section-box mt-4">
							<div class="box-header-flex">
								<h4 class="box-title"><i class="bi bi-people"></i> Daftar Tamu Undangan</h4>
								<span class="guest-count-badge">{weddingStore.data.daftarTamu.length} Tamu</span>
							</div>

							<div class="guest-cards-list">
								{#each weddingStore.data.daftarTamu as guest}
									<div class="guest-card-item">
										<div class="guest-meta">
											<strong class="guest-name">{guest.nama}</strong>
											{#if guest.nomorWa}
												<span class="guest-phone"><i class="bi bi-whatsapp"></i> {guest.nomorWa}</span>
											{/if}
										</div>

										<div class="guest-actions">
											<button
												type="button"
												class="btn-guest-action"
												onclick={() => {
													previewGuestName = guest.nama;
													notify(`Preview diubah ke: ${guest.nama}`);
												}}
												title="Lihat di Emulator"
											>
												<i class="bi bi-eye"></i> Preview
											</button>
											<button
												type="button"
												class="btn-guest-action"
												onclick={() => copyShareLink(guest.nama)}
												title="Salin URL Khusus"
											>
												<i class="bi bi-link-45deg"></i> Link
											</button>
											<button
												type="button"
												class="btn-guest-action btn-wa-action"
												onclick={() => copyWaMessage(guest.nama)}
												title="Salin Pesan WhatsApp"
											>
												<i class="bi bi-clipboard"></i> Salin WA
											</button>
											<button
												type="button"
												class="btn-guest-action btn-wa-send"
												onclick={() => openWhatsApp(guest)}
												title="Buka Chat WhatsApp"
											>
												<i class="bi bi-send"></i> Kirim
											</button>
											<button
												type="button"
												class="btn-delete-item"
												onclick={() => weddingStore.removeTamu(guest.id)}
												title="Hapus tamu"
											>
												<i class="bi bi-x-lg"></i>
											</button>
										</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- RIGHT COLUMN: LIVE INTERACTIVE SMARTPHONE SIMULATOR -->
		<div class="editor-preview {mobileView === 'preview' ? 'show-on-mobile' : 'hide-on-mobile'}">
			<div class="simulator-wrapper">
				<!-- Simulator Toolbar -->
				<div class="simulator-toolbar">
					<div class="simulator-status">
						<span class="pulse-dot"></span>
						<span>Live Realtime Simulator</span>
					</div>

					<div class="simulator-guest-selector">
						<label for="preview-guest-select">Sapaan Tamu:</label>
						<input
							type="text"
							id="preview-guest-select"
							bind:value={previewGuestName}
							placeholder="Nama Tamu"
						/>
					</div>

					<div class="simulator-actions">
						<button
							type="button"
							class="btn-sim-tool"
							onclick={() => copyShareLink(previewGuestName)}
							title="Salin link undangan ini"
						>
							<i class="bi bi-share"></i>
						</button>
						<a
							href="/invite?to={encodeURIComponent(previewGuestName)}"
							target="_blank"
							rel="noopener noreferrer"
							class="btn-sim-tool"
							title="Buka layar penuh"
						>
							<i class="bi bi-arrows-fullscreen"></i>
						</a>
					</div>
				</div>

				<!-- Phone Frame Mockup -->
				<div class="phone-mockup-frame">
					<div class="phone-speaker-notch"></div>
					<div class="phone-screen-viewport">
						<InvitationView
							weddingData={weddingStore.data}
							guestName={previewGuestName}
							isSimulator={true}
						/>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- JSON IMPORT / EXPORT MODAL -->
	{#if isJsonModalOpen}
		<div
			class="modal-backdrop"
			onclick={() => (isJsonModalOpen = false)}
			onkeydown={(e) => e.key === 'Escape' && (isJsonModalOpen = false)}
			tabindex="-1"
			role="presentation"
		>
			<div
				class="modal-dialog"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				tabindex="-1"
			>
				<div class="modal-header">
					<h4>Cadangkan & Impor Data Undangan (JSON)</h4>
					<button
						type="button"
						class="btn-close-modal"
						onclick={() => (isJsonModalOpen = false)}
						aria-label="Tutup"
					>
						<i class="bi bi-x-lg"></i>
					</button>
				</div>
				<div class="modal-body">
					<p class="modal-info">
						Anda dapat menyalin data JSON di bawah untuk disimpan sebagai cadangan, atau menempelkan
						data JSON sebelumnya lalu klik <strong>Impor Data</strong>.
					</p>
					<textarea
						class="json-editor-area"
						rows="12"
						bind:value={jsonContent}
						placeholder="JSON data..."
					></textarea>
				</div>
				<div class="modal-footer">
					<button
						type="button"
						class="btn btn-secondary"
						onclick={() => {
							navigator.clipboard.writeText(jsonContent);
							notify('Data JSON berhasil disalin!');
						}}
					>
						<i class="bi bi-clipboard"></i> Salin JSON
					</button>
					<button type="button" class="btn btn-primary" onclick={handleImportJson}>
						<i class="bi bi-arrow-down-circle"></i> Impor Data Sekarang
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- TOAST FEEDBACK -->
	{#if showToast}
		<div class="toast-bar">
			<i class="bi bi-check-circle-fill"></i>
			<span>{toastMsg}</span>
		</div>
	{/if}
</div>
{/if}

<!-- AUTH MODAL -->
<AuthModal
	isOpen={isAuthModalOpen}
	onClose={() => (isAuthModalOpen = false)}
	onSuccess={() => notify(`Selamat datang, ${weddingStore.user.name}!`)}
/>

<!-- UPGRADE MODAL -->
<UpgradeModal
	isOpen={isUpgradeModalOpen}
	targetTemplateName={targetUpgradeTemplate?.name || 'Template Premium'}
	targetTier={targetUpgradeTemplate?.tier || 'premium'}
	onClose={() => (isUpgradeModalOpen = false)}
	onUpgradeSuccess={() => {
		if (targetUpgradeTemplate) {
			weddingStore.setTemplate(targetUpgradeTemplate.id);
			notify(`Template ${targetUpgradeTemplate.name} berhasil diaktifkan!`);
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

<style>
	/* LOGIN REQUIRED GATE SCREEN */
	.editor-gate-screen {
		min-height: 100vh;
		background: radial-gradient(circle at top center, #fbf8f3 0%, #ede6db 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem;
		font-family: 'Plus Jakarta Sans', sans-serif;
	}

	.gate-card {
		background: #ffffff;
		border-radius: 24px;
		max-width: 480px;
		width: 100%;
		padding: 2.5rem 2rem;
		text-align: center;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.08);
		border: 1px solid #ebdcc8;
		animation: zoomIn 0.3s ease;
	}

	@keyframes zoomIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.gate-icon-circle {
		width: 64px;
		height: 64px;
		margin: 0 auto 1.2rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.8rem;
		color: #1a1408;
		box-shadow: 0 4px 15px rgba(197, 160, 89, 0.35);
	}

	.gate-badge {
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 1.2px;
		color: #8c6a27;
		text-transform: uppercase;
		display: block;
		margin-bottom: 0.4rem;
	}

	.gate-title {
		font-family: 'Cinzel', serif;
		font-size: 1.4rem;
		font-weight: 700;
		color: #1a1918;
		margin: 0 0 0.8rem;
	}

	.gate-desc {
		font-size: 0.85rem;
		color: #6b6357;
		line-height: 1.6;
		margin: 0 0 1.8rem;
	}

	.gate-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.btn-gate-login {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		border: none;
		padding: 0.85rem 1.5rem;
		border-radius: 25px;
		font-size: 0.92rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		box-shadow: 0 4px 14px rgba(197, 160, 89, 0.35);
		transition: all 0.2s ease;
	}

	.btn-gate-login:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(197, 160, 89, 0.5);
	}

	.btn-gate-home {
		background: transparent;
		color: #6b6357;
		border: 1px solid #dcd1be;
		padding: 0.75rem 1.5rem;
		border-radius: 25px;
		font-size: 0.86rem;
		font-weight: 600;
		text-decoration: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		transition: all 0.2s ease;
	}

	.btn-gate-home:hover {
		background: #f5eedf;
		color: #1a1918;
	}

	/* MAIN EDITOR LAYOUT */
	.editor-layout {
		display: flex;
		flex-direction: column;
		height: 100vh;
		background: #f4efe9;
		overflow: hidden;
		font-family: 'Plus Jakarta Sans', sans-serif;
	}

	/* TOP APP BAR */
	.editor-topbar {
		height: 64px;
		background: #ffffff;
		border-bottom: 1px solid #e5dcce;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		z-index: 100;
		flex-shrink: 0;
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.btn-back-home {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		text-decoration: none;
		color: #444;
		font-size: 0.88rem;
		font-weight: 600;
		padding: 0.45rem 0.85rem;
		border-radius: 8px;
		background: #f7f3ee;
		border: 1px solid #e8decb;
		transition: all 0.2s ease;
	}

	.btn-back-home:hover {
		background: #ece4d5;
		color: #111;
	}

	.topbar-divider {
		width: 1px;
		height: 28px;
		background: #e2d9cc;
	}

	.topbar-brand {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.topbar-logo-img {
		width: 38px;
		height: 38px;
		object-fit: contain;
		border-radius: 8px;
	}

	.topbar-title {
		font-family: 'Cinzel', serif;
		font-size: 1.15rem;
		margin: 0;
		color: #1a1918;
		font-weight: 700;
	}

	.topbar-sub {
		font-size: 0.68rem;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: #a88439;
		font-weight: 600;
	}

	.topbar-center {
		display: flex;
		align-items: center;
	}

	.template-quick-select {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #fdfaf6;
		padding: 0.35rem 0.8rem;
		border-radius: 20px;
		border: 1px solid #dfd3c0;
	}

	.template-quick-select label {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #8c6a27;
	}

	.template-quick-select select {
		border: none;
		background: transparent;
		font-size: 0.84rem;
		font-weight: 700;
		color: #2b2212;
		outline: none;
		cursor: pointer;
	}

	.topbar-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.mobile-view-toggle {
		display: none;
		background: #eee6d8;
		border-radius: 20px;
		padding: 2px;
	}

	.btn-toggle-view {
		border: none;
		background: none;
		padding: 0.35rem 0.75rem;
		font-size: 0.78rem;
		font-weight: 600;
		border-radius: 16px;
		color: #555;
		cursor: pointer;
	}

	.btn-toggle-view.active {
		background: #ffffff;
		color: #c5a059;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
	}

	.btn-topbar-action {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.5rem 0.9rem;
		border-radius: 8px;
		border: 1px solid #dcd1be;
		background: #ffffff;
		color: #444;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-topbar-action:hover {
		background: #f7f3ec;
		color: #111;
	}

	.btn-danger-action:hover {
		background: #fee2e2;
		color: #b91c1c;
		border-color: #fca5a5;
	}

	.btn-topbar-preview {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 700;
		padding: 0.55rem 1.15rem;
		border-radius: 25px;
		box-shadow: 0 4px 12px rgba(197, 160, 89, 0.35);
		transition: all 0.25s ease;
	}

	.btn-topbar-preview:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 16px rgba(197, 160, 89, 0.45);
	}

	/* WORKSPACE GRID */
	.editor-workspace {
		display: grid;
		grid-template-columns: 1fr 480px;
		height: calc(100vh - 64px);
		overflow: hidden;
	}

	/* SIDEBAR FORM CONTAINER */
	.editor-sidebar {
		display: flex;
		flex-direction: column;
		height: 100%;
		background: #ffffff;
		border-right: 1px solid #e5dcce;
		overflow: hidden;
	}

	/* SIDEBAR TABS */
	.sidebar-tabs {
		display: flex;
		background: #f9f6f0;
		border-bottom: 1px solid #e8e0d2;
		overflow-x: auto;
		scrollbar-width: thin;
		flex-shrink: 0;
	}

	.tab-btn {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.85rem 1.1rem;
		background: none;
		border: none;
		font-size: 0.82rem;
		font-weight: 600;
		color: #6b6358;
		cursor: pointer;
		white-space: nowrap;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.tab-btn i {
		font-size: 1rem;
	}

	.tab-btn:hover {
		color: #c5a059;
		background: rgba(197, 160, 89, 0.05);
	}

	.tab-btn.active {
		color: #a88439;
		background: #ffffff;
		border-bottom-color: #c5a059;
		font-weight: 700;
	}

	.sidebar-form-container {
		flex: 1;
		overflow-y: auto;
		padding: 2rem;
	}

	.pane-header {
		margin-bottom: 1.8rem;
		border-bottom: 1px solid #f0e7db;
		padding-bottom: 1rem;
	}

	.pane-header h3 {
		font-family: 'Cinzel', serif;
		font-size: 1.35rem;
		color: #1a1918;
		margin: 0 0 0.35rem;
	}

	.pane-header p {
		font-size: 0.86rem;
		color: #7a7065;
		margin: 0;
	}

	/* FORM STYLES */
	.form-section-box {
		background: #fcfbf9;
		border: 1px solid #ede4d6;
		border-radius: 16px;
		padding: 1.5rem;
	}

	.box-title {
		font-family: 'Cinzel', serif;
		font-size: 1.05rem;
		color: #2a251e;
		margin: 0 0 1.2rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.box-title i {
		color: #c5a059;
	}

	.groom-title i {
		color: #2563eb;
	}

	.bride-title i {
		color: #db2777;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 1.1rem;
	}

	.form-group:last-child {
		margin-bottom: 0;
	}

	.form-group label {
		font-size: 0.82rem;
		font-weight: 600;
		color: #3b352e;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem 0.95rem;
		border-radius: 10px;
		border: 1px solid #dcd1be;
		background: #ffffff;
		font-size: 0.88rem;
		font-family: inherit;
		color: #222;
		outline: none;
		transition: all 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		border-color: #c5a059;
		box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
	}

	.form-row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.checkbox-row {
		margin-bottom: 0.5rem;
	}

	.switch-label {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: #2a251e;
		cursor: pointer;
	}

	.btn-submit-action {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #c5a059;
		color: #ffffff;
		border: none;
		padding: 0.75rem 1.4rem;
		border-radius: 12px;
		font-size: 0.86rem;
		font-weight: 700;
		cursor: pointer;
		margin-top: 1rem;
		transition: all 0.2s ease;
	}

	.btn-submit-action:hover {
		background: #8c6a27;
	}

	/* TEMPLATE PICKER CARDS */
	.template-cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: 1.2rem;
	}

	.tpl-option-card {
		background: #ffffff;
		border: 2px solid #e5dccf;
		border-radius: 16px;
		overflow: hidden;
		cursor: pointer;
		padding: 0;
		text-align: left;
		transition: all 0.25s ease;
	}

	.tpl-option-card:hover {
		border-color: #c5a059;
		transform: translateY(-3px);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
	}

	.tpl-option-card.is-selected {
		border-color: #c5a059;
		box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.25);
	}

	.tpl-thumb-wrap {
		position: relative;
		height: 120px;
		overflow: hidden;
	}

	.tpl-thumb {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.selected-badge {
		position: absolute;
		top: 8px;
		right: 8px;
		background: #c5a059;
		color: #ffffff;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
		display: flex;
		align-items: center;
		gap: 0.3rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
		z-index: 6;
	}

	.tier-corner-badge {
		position: absolute;
		top: 8px;
		left: 8px;
		font-size: 0.68rem;
		font-weight: 800;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
		z-index: 5;
	}

	.tier-corner-badge.tier-free {
		background: rgba(255, 255, 255, 0.95);
		color: #15803d;
		border: 1px solid rgba(22, 163, 74, 0.3);
	}

	.tier-corner-badge.tier-pro {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		border: 1px solid rgba(170, 124, 17, 0.4);
	}

	.tier-corner-badge.tier-vip {
		background: linear-gradient(135deg, #9e1b32 0%, #c4334f 50%, #dfb15b 100%);
		color: #ffffff;
		border: 1px solid rgba(223, 177, 91, 0.6);
		box-shadow: 0 2px 10px rgba(158, 27, 50, 0.4);
	}

	.tpl-locked-overlay {
		position: absolute;
		inset: 0;
		background: rgba(15, 12, 10, 0.65);
		backdrop-filter: blur(2px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		color: #ffffff;
		font-size: 0.72rem;
		font-weight: 700;
		z-index: 4;
		transition: background 0.2s ease;
	}

	.tpl-option-card:hover .tpl-locked-overlay {
		background: rgba(15, 12, 10, 0.78);
	}

	.locked-icon-circle {
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		color: #ffffff;
	}

	.locked-icon-circle.vip-lock {
		background: rgba(158, 27, 50, 0.4);
		border-color: rgba(223, 177, 91, 0.8);
		color: #ffd978;
	}

	.topbar-user-status {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #f7f3ec;
		border: 1px solid #ebdcc8;
		border-radius: 20px;
		padding: 0.25rem 0.75rem;
	}

	.user-name-small {
		font-size: 0.75rem;
		font-weight: 700;
		color: #2b2212;
		max-width: 100px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.badge-vip {
		font-size: 0.65rem;
		font-weight: 800;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		padding: 0.15rem 0.5rem;
		border-radius: 12px;
	}

	.badge-free {
		font-size: 0.65rem;
		font-weight: 700;
		background: #e5e7eb;
		color: #4b5563;
		padding: 0.15rem 0.45rem;
		border-radius: 12px;
	}

	.btn-upgrade-topbar {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		border: none;
		font-size: 0.68rem;
		font-weight: 800;
		padding: 0.25rem 0.65rem;
		border-radius: 12px;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(197, 160, 89, 0.4);
		transition: all 0.2s ease;
	}

	.btn-upgrade-topbar:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 10px rgba(197, 160, 89, 0.55);
	}

	.tpl-info {
		padding: 0.9rem;
	}

	.tpl-title {
		font-family: 'Cinzel', serif;
		font-size: 0.88rem;
		font-weight: 700;
		color: #1a1918;
		margin-bottom: 0.2rem;
	}

	.tpl-tag {
		font-size: 0.7rem;
		color: #a88439;
		font-weight: 600;
		display: block;
		margin-bottom: 0.6rem;
	}

	.tpl-colors {
		display: flex;
		gap: 0.35rem;
	}

	.color-dot {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.15);
	}

	/* SAMPLE COVERS */
	.sample-covers-row {
		margin-top: 0.8rem;
	}

	.sample-covers-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.4rem;
	}

	.btn-sample-cover {
		font-size: 0.75rem;
		background: #eee7dc;
		border: 1px solid #d9ccb9;
		padding: 0.3rem 0.65rem;
		border-radius: 12px;
		cursor: pointer;
		font-weight: 600;
	}

	.btn-sample-cover:hover {
		background: #c5a059;
		color: #ffffff;
	}

	/* ITEMS LIST (Cerita & Kado) */
	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.8rem;
	}

	.item-card {
		background: #fbf9f6;
		border: 1px solid #e7ded2;
		border-radius: 12px;
		padding: 1rem;
	}

	.item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.badge-year,
	.badge-bank {
		font-size: 0.72rem;
		font-weight: 700;
		background: rgba(197, 160, 89, 0.15);
		color: #8c6a27;
		padding: 0.2rem 0.6rem;
		border-radius: 8px;
	}

	.btn-delete-item {
		background: none;
		border: none;
		color: #999;
		font-size: 1rem;
		cursor: pointer;
		padding: 0.2rem;
	}

	.btn-delete-item:hover {
		color: #dc2626;
	}

	.item-title {
		font-size: 0.92rem;
		font-weight: 700;
		margin: 0 0 0.3rem;
		color: #222;
	}

	.item-text {
		font-size: 0.82rem;
		color: #666;
		margin: 0;
		line-height: 1.5;
	}

	.rek-num {
		font-family: 'Courier New', monospace;
		font-size: 1.15rem;
		font-weight: 700;
		color: #8c6a27;
		margin: 0.2rem 0;
	}

	.rek-an {
		font-size: 0.8rem;
		color: #555;
	}

	/* GALLERY PREVIEW */
	.gallery-manager-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
		gap: 0.8rem;
	}

	.gallery-preview-card {
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid #ded5c5;
		background: #ffffff;
	}

	.gallery-preview-img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
	}

	.gallery-preview-info {
		padding: 0.4rem 0.6rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.72rem;
	}

	.preview-caption {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 90px;
	}

	.btn-delete-photo {
		border: none;
		background: none;
		color: #999;
		cursor: pointer;
		font-size: 0.85rem;
	}

	.btn-delete-photo:hover {
		color: #dc2626;
	}

	/* GUEST LIST & WA */
	.box-header-flex {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	.guest-count-badge {
		font-size: 0.75rem;
		font-weight: 700;
		background: #eef2ff;
		color: #4338ca;
		padding: 0.25rem 0.7rem;
		border-radius: 20px;
	}

	.guest-cards-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.guest-card-item {
		background: #ffffff;
		border: 1px solid #e7ded2;
		border-radius: 12px;
		padding: 0.85rem 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.guest-meta {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.guest-name {
		font-size: 0.92rem;
		color: #1f1b16;
	}

	.guest-phone {
		font-size: 0.75rem;
		color: #16a34a;
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}

	.guest-actions {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.btn-guest-action {
		border: 1px solid #dcd1be;
		background: #fdfbf8;
		color: #444;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 0.35rem 0.65rem;
		border-radius: 8px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		transition: all 0.2s ease;
	}

	.btn-guest-action:hover {
		background: #c5a059;
		color: #ffffff;
		border-color: #c5a059;
	}

	.btn-wa-action {
		background: #f0fdf4;
		border-color: #bbf7d0;
		color: #15803d;
	}

	.btn-wa-action:hover {
		background: #16a34a;
		color: #ffffff;
		border-color: #16a34a;
	}

	.btn-wa-send {
		background: #16a34a;
		color: #ffffff;
		border-color: #16a34a;
	}

	.btn-wa-send:hover {
		background: #15803d;
	}

	/* RIGHT PREVIEW COLUMN */
	.editor-preview {
		background: #232220;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
		overflow-y: auto;
	}

	.simulator-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		width: 100%;
		max-width: 440px;
	}

	.simulator-toolbar {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.85rem;
		color: #c8c0b5;
		font-size: 0.78rem;
		gap: 0.5rem;
	}

	.simulator-status {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-weight: 600;
		white-space: nowrap;
	}

	.pulse-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #22c55e;
		box-shadow: 0 0 8px #22c55e;
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0% {
			opacity: 0.6;
		}
		50% {
			opacity: 1;
		}
		100% {
			opacity: 0.6;
		}
	}

	.simulator-guest-selector {
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.simulator-guest-selector input {
		background: rgba(255, 255, 255, 0.12);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
		border-radius: 8px;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		width: 120px;
		outline: none;
	}

	.simulator-actions {
		display: flex;
		gap: 0.4rem;
	}

	.btn-sim-tool {
		width: 30px;
		height: 30px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.85rem;
		text-decoration: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-sim-tool:hover {
		background: #c5a059;
		color: #12100e;
	}

	/* SMARTPHONE FRAME */
	.phone-mockup-frame {
		width: 100%;
		max-width: 420px;
		height: 820px;
		background: #000000;
		border-radius: 46px;
		border: 10px solid #2d2c2a;
		box-shadow:
			0 25px 60px rgba(0, 0, 0, 0.55),
			0 0 0 2px rgba(255, 255, 255, 0.08);
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.phone-speaker-notch {
		position: absolute;
		top: 10px;
		left: 50%;
		transform: translateX(-50%);
		width: 110px;
		height: 20px;
		background: #181818;
		border-radius: 12px;
		z-index: 2500;
	}

	.phone-screen-viewport {
		flex: 1;
		width: 100%;
		height: 100%;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		background: #faf7f2;
	}

	/* MODAL */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 5000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.modal-dialog {
		background: #ffffff;
		border-radius: 20px;
		max-width: 620px;
		width: 100%;
		box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
		overflow: hidden;
	}

	.modal-header {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #eee;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.modal-header h4 {
		margin: 0;
		font-family: 'Cinzel', serif;
		font-size: 1.15rem;
	}

	.btn-close-modal {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #888;
	}

	.modal-body {
		padding: 1.5rem;
	}

	.modal-info {
		font-size: 0.85rem;
		color: #666;
		margin: 0 0 1rem;
		line-height: 1.5;
	}

	.json-editor-area {
		width: 100%;
		font-family: 'Courier New', Courier, monospace;
		font-size: 0.78rem;
		padding: 0.8rem;
		border: 1px solid #ccc;
		border-radius: 10px;
		background: #f8f8f8;
		outline: none;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		background: #fbfbfb;
		border-top: 1px solid #eee;
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
	}

	.btn {
		padding: 0.6rem 1.2rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
	}

	.btn-secondary {
		background: #e5e5e5;
		color: #333;
	}

	.btn-primary {
		background: #c5a059;
		color: #ffffff;
	}

	/* TOAST BAR */
	.toast-bar {
		position: fixed;
		bottom: 24px;
		right: 24px;
		background: #1c1917;
		color: #ffffff;
		padding: 0.75rem 1.4rem;
		border-radius: 30px;
		font-size: 0.84rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 6000;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
		animation: slideUp 0.3s ease;
	}

	.toast-bar i {
		color: #22c55e;
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* RESPONSIVE MEDIA QUERIES */
	@media (max-width: 1080px) {
		.editor-workspace {
			grid-template-columns: 1fr;
		}

		.mobile-view-toggle {
			display: flex;
		}

		.show-on-mobile {
			display: flex !important;
		}

		.hide-on-mobile {
			display: none !important;
		}

		.d-none-tablet {
			display: none;
		}
	}

	@media (max-width: 600px) {
		.editor-topbar {
			padding: 0 1rem;
		}

		.d-none-mobile {
			display: none;
		}

		.form-row-2 {
			grid-template-columns: 1fr;
		}

		.sidebar-form-container {
			padding: 1.25rem 1rem;
		}
	}
</style>
