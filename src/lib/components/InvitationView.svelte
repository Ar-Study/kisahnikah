<script>
	import { TEMPLATES } from '$lib/weddingStore.svelte.js';
	import ForeverTownView from './ForeverTownView.svelte';
	import PixelGameWorldView from './PixelGameWorldView.svelte';

	/**
	 * @type {{
	 *   weddingData: any,
	 *   guestName?: string,
	 *   isSimulator?: boolean
	 * }}
	 */
	let { weddingData, guestName = 'Tamu Undangan', isSimulator = false } = $props();

	// Cover state
	let isCoverOpened = $state(false);

	// Audio state
	let audioElement = $state(null);
	let isMusicPlaying = $state(false);

	// Lightbox state
	let selectedImage = $state(null);

	// Active tab/section for bottom nav
	let activeSection = $state('sec-home');

	// Toast state for copy
	let toastMessage = $state('');
	let toastVisible = $state(false);

	// RSVP Form state
	let rsvpNama = $state('');
	let rsvpKehadiran = $state('hadir');
	let rsvpJumlah = $state(1);
	let rsvpUcapan = $state('');
	let rsvpSuccess = $state(false);

	// Wish likes state
	let wishLikes = $state({});

	function handleLikeWish(wishId) {
		wishLikes[wishId] = (wishLikes[wishId] || 0) + 1;
		showToast('❤️ Terima kasih atas kiriman apresiasi doanya!');
	}

	// Dynamic countdown timer
	let days = $state('00');
	let hours = $state('00');
	let minutes = $state('00');
	let seconds = $state('00');

	// Get active template config
	let currentTemplate = $derived(
		TEMPLATES.find((t) => t.id === weddingData.templateId) || TEMPLATES[0]
	);

	// Dedicated rundown by culture & tier
	let rundownList = $derived.by(() => {
		if (currentTemplate.id === 'javanese-heritage') {
			return [
				{ jam: '08:00 - 09:00', acara: 'Upacara Siraman & Pasang Bleketepe', desc: 'Pembersihan diri lahir & batin calon pengantin diiringi restu sesepuh', icon: 'bi-droplet-half' },
				{ jam: '09:00 - 10:00', acara: 'Akad Nikah / Ijab Qabul Sakral', desc: 'Ikrar janji suci di hadapan penghulu, wali nikah, & saksi keraton', icon: 'bi-gem' },
				{ jam: '10:00 - 11:00', acara: 'Upacara Panggih & Balangan Gantal', desc: 'Pertemuan kedua mempelai adat Jawa Keraton dengan lempar sirih & injak telur', icon: 'bi-flower1' },
				{ jam: '11:00 - 12:00', acara: 'Sungkeman & Dhahar Kembul', desc: 'Sungkeman memohon restu orang tua & suap-suapan simbol kerukunan', icon: 'bi-heart-fill' },
				{ jam: '12:00 - 14:00', acara: 'Resepsi Pahargyan & Ramah Tamah', desc: 'Pemberian ucapan selamat & jamuan prasmanan ala Keraton', icon: 'bi-cup-hot' }
			];
		}
		if (currentTemplate.id === 'sundanese-parahyangan') {
			return [
				{ jam: '08:00 - 09:30', acara: 'Akad Nikah & Ijab Qabul Sakral', desc: 'Penyatuan dua keluarga sunda dipandu penghulu & doa para kasepuhan', icon: 'bi-gem' },
				{ jam: '09:30 - 10:15', acara: 'Upacara Sawer Panganten', desc: 'Petuah hidup bertabur beras kuning, koin, kunyit, & permen keberkahan', icon: 'bi-flower2' },
				{ jam: '10:15 - 11:00', acara: 'Meuleum Harupat & Nincak Endog', desc: 'Simbol kebijaksanaan kepala keluarga memadamkan amarah & kesucian', icon: 'bi-fire' },
				{ jam: '11:00 - 11:30', acara: 'Huap Lingkung & Pabetot Bakakak', desc: 'Saling menyuapi nasi kuning & lambang saling berbagi rezeki berdua', icon: 'bi-heart-fill' },
				{ jam: '11:30 - 14:00', acara: 'Resepsi Ramah Tamah Parahyangan', desc: 'Jamuan makan prasmanan diiringi alunan degung kacapi suling sunda', icon: 'bi-cup-hot' }
			];
		}
		if (currentTemplate.id === 'royal-velvet') {
			return [
				{ jam: '10:00 - 11:30', acara: 'The Royal Solemnization', desc: 'Pertukaran cincin kawin emas & pengucapan janji setia seumur hidup', icon: 'bi-crown-fill' },
				{ jam: '11:30 - 12:30', acara: 'Royal Welcome & Welcome Toast', desc: 'Penyambutan tamu kehormatan & sajian welcome drink ballroom istana', icon: 'bi-cup-straw' },
				{ jam: '12:30 - 14:00', acara: 'Imperial Grand Banquet', desc: 'Jamuan makan siang mewah bertabur hidangan kerajaan diiringi string ensemble', icon: 'bi-music-note-beamed' },
				{ jam: '14:00 - 15:00', acara: 'First Waltz & Photo Gala', desc: 'Dansa pertama kedua mempelai & sesi dokumentasi karpet merah', icon: 'bi-stars' }
			];
		}
		return weddingData.rundown || [
			{ jam: '08:00 - 09:30', acara: 'Akad Nikah / Ijab Qabul', desc: 'Prosesi ijab qabul sakral disaksikan keluarga inti', icon: 'bi-gem' },
			{ jam: '09:30 - 10:30', acara: 'Upacara Adat & Sungkeman', desc: 'Ungkapan bakti & restu kepada kedua orang tua', icon: 'bi-flower1' },
			{ jam: '11:00 - 13:00', acara: 'Resepsi & Ramah Tamah', desc: 'Penyambutan tamu undangan & jamuan prasmanan', icon: 'bi-cup-hot' },
			{ jam: '13:00 - 14:00', acara: 'Sesi Foto & Penutupan', desc: 'Foto bersama sahabat & keluarga besar', icon: 'bi-camera' }
		];
	});

	// Tailored atmospheric cover photo for each template
	let effectiveCoverImage = $derived(
		weddingData.customCoverImage || currentTemplate.previewImage || weddingData.coverImage
	);

	// Initialize countdown interval
	$effect(() => {
		const targetStr =
			weddingData?.acara?.resepsi?.tanggal || weddingData?.acara?.akad?.tanggal || '2026-12-12';
		const targetTime = new Date(`${targetStr}T10:00:00`).getTime();

		function calculateCountdown() {
			const now = new Date().getTime();
			const distance = targetTime - now;

			if (distance <= 0) {
				days = '00';
				hours = '00';
				minutes = '00';
				seconds = '00';
				return;
			}

			days = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
			hours = String(
				Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
			).padStart(2, '0');
			minutes = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
			seconds = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
		}

		calculateCountdown();
		const interval = setInterval(calculateCountdown, 1000);

		return () => clearInterval(interval);
	});

	// Open invitation action
	function handleOpenInvitation() {
		isCoverOpened = true;
		if (weddingData?.music?.enabled && audioElement) {
			audioElement
				.play()
				.then(() => {
					isMusicPlaying = true;
				})
				.catch((err) => {
					console.log('Audio autoplay prevented by browser policy:', err);
				});
		}
	}

	// Toggle music action
	function toggleMusic() {
		if (!audioElement) return;
		if (isMusicPlaying) {
			audioElement.pause();
			isMusicPlaying = false;
		} else {
			audioElement
				.play()
				.then(() => {
					isMusicPlaying = true;
				})
				.catch((e) => console.log('Audio playback error:', e));
		}
	}

	// Copy to clipboard helper with toast
	function copyText(text, label = 'Teks') {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(() => {
				showToast(`${label} berhasil disalin!`);
			});
		} else {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			showToast(`${label} berhasil disalin!`);
		}
	}

	function showToast(msg) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 2500);
	}

	// Scroll to section helper
	function scrollToSection(id) {
		activeSection = id;
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	// Google calendar link generator
	function getGoogleCalendarUrl() {
		const title = encodeURIComponent(
			`Pernikahan ${weddingData.mempelai.pria.namaPanggilan} & ${weddingData.mempelai.wanita.namaPanggilan}`
		);
		const details = encodeURIComponent(
			`Menghadiri resepsi pernikahan ${weddingData.mempelai.pria.namaLengkap} & ${weddingData.mempelai.wanita.namaLengkap}. Lokasi: ${weddingData.acara.resepsi.tempat}`
		);
		const location = encodeURIComponent(
			`${weddingData.acara.resepsi.tempat}, ${weddingData.acara.resepsi.alamat}`
		);
		const dateStr = (weddingData.acara.resepsi.tanggal || '2026-12-12').replace(/-/g, '');
		const startTime = (weddingData.acara.resepsi.waktuMulai || '11:00').replace(':', '') + '00';
		const endTime = (weddingData.acara.resepsi.waktuSelesai || '14:00').replace(':', '') + '00';

		return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateStr}T${startTime}/${dateStr}T${endTime}`;
	}

	// Handle Submit RSVP locally
	function handleRsvpSubmit(e) {
		e.preventDefault();
		if (!rsvpNama.trim()) return;

		const newComment = {
			id: Date.now(),
			nama: rsvpNama.trim(),
			kehadiran: rsvpKehadiran,
			jumlah: Number(rsvpJumlah) || 1,
			ucapan: rsvpUcapan.trim() || 'Semoga menjadi keluarga sakinah, mawaddah, warahmah.',
			waktu: 'Baru saja'
		};

		if (weddingData.rsvps) {
			weddingData.rsvps = [newComment, ...weddingData.rsvps];
		}

		rsvpSuccess = true;
		showToast('RSVP & Ucapan Anda berhasil dikirim!');

		// Reset form
		rsvpNama = '';
		rsvpUcapan = '';
		setTimeout(() => {
			rsvpSuccess = false;
		}, 4000);
	}
</script>

{#if currentTemplate.id === 'forever-town'}
	<ForeverTownView {weddingData} {guestName} {isSimulator} />
{:else if currentTemplate.id === 'pixel-game-world'}
	<PixelGameWorldView {weddingData} {guestName} {isSimulator} />
{:else}
	<div
		class="invitation-container tpl-{currentTemplate.id} tpl-tier-{currentTemplate.tier || 'free'} {isSimulator ? 'is-simulator' : 'is-fullscreen'}"
	style="
		--primary: {currentTemplate.primaryColor};
		--secondary: {currentTemplate.secondaryColor};
		--bg: {currentTemplate.bgColor};
		--text: {currentTemplate.textColor};
		--card: {currentTemplate.cardBg};
		--font-title: {currentTemplate.fontTitle};
		--font-heading: {currentTemplate.fontHeading};
		--font-body: {currentTemplate.fontBody};
	"
>
	<!-- Hidden Audio Element -->
	{#if weddingData?.music?.enabled && weddingData?.music?.url}
		<audio bind:this={audioElement} src={weddingData.music.url} loop preload="auto"></audio>
	{/if}

	<!-- 1. CINEMATIC COVER SCREEN OVERLAY -->
	<div
		class="cover-screen {isCoverOpened ? 'cover-opened' : ''}"
		style="background-image: linear-gradient(rgba(15, 12, 10, 0.65), rgba(15, 12, 10, 0.88)), url('{effectiveCoverImage}');"
	>
		<div class="cover-ornament-frame"></div>

		<div class="cover-content">
			<div class="cover-eyebrow">
				{#if currentTemplate.id === 'javanese-heritage'}
					<span class="eyebrow-accent">⚜️</span>
					<span>PAWIWAHAN ADAT JAWA</span>
					<span class="eyebrow-accent">⚜️</span>
				{:else if currentTemplate.id === 'islamic-moroccan'}
					<i class="bi bi-moon-stars-fill"></i>
					<span>WALIMATUL 'URS</span>
					<i class="bi bi-moon-stars-fill"></i>
				{:else if currentTemplate.id === 'royal-velvet'}
					<span class="eyebrow-accent">👑</span>
					<span>THE ROYAL WEDDING OF</span>
					<span class="eyebrow-accent">👑</span>
				{:else if currentTemplate.id === 'sundanese-parahyangan'}
					<span class="eyebrow-accent">🪷</span>
					<span>PANGANTEN ADAT SUNDA</span>
					<span class="eyebrow-accent">🪷</span>
				{:else}
					<i class="bi bi-heart-fill"></i>
					<span>The Wedding Celebration Of</span>
					<i class="bi bi-heart-fill"></i>
				{/if}
			</div>

			<h1 class="cover-names">
				{weddingData.mempelai.pria.namaPanggilan}
				<span class="and-symbol">&</span>
				{weddingData.mempelai.wanita.namaPanggilan}
			</h1>

			<div class="cover-guest-card">
				{#if currentTemplate.tier === 'vip'}
					<div class="vip-guest-pill">
						<i class="bi bi-crown-fill"></i>
						<span>TAMU KEHORMATAN VIP</span>
					</div>
				{/if}
				<p class="to-label">Kepada Yth. Bapak/Ibu/Saudara/i:</p>
				<div class="guest-name-pill">{guestName}</div>
				<p class="to-note">Mohon maaf bila ada kesalahan penulisan nama/gelar</p>
			</div>

			{#if currentTemplate.id === 'royal-velvet'}
				<button
					type="button"
					class="wax-seal-btn"
					onclick={handleOpenInvitation}
					id="btnBukaUndangan"
					title="Buka Surat Segel Kerajaan"
				>
					<div class="wax-seal-outer">
						<div class="wax-seal-inner">
							<span class="wax-crown">👑</span>
							<span class="wax-initials">KN</span>
							<span class="wax-text">BUKA UNDANGAN</span>
						</div>
					</div>
				</button>
			{:else}
				<button
					type="button"
					class="btn-open-invitation"
					onclick={handleOpenInvitation}
					id="btnBukaUndangan"
				>
					<i class="bi bi-envelope-open-heart"></i>
					<span>Buka Undangan</span>
				</button>
			{/if}
		</div>
	</div>

	<!-- FLOATING AUDIO MUSIC CONTROL -->
	{#if weddingData?.music?.enabled && isCoverOpened}
		<button
			type="button"
			class="audio-floating-btn {isMusicPlaying ? 'is-playing' : ''}"
			onclick={toggleMusic}
			title={isMusicPlaying ? 'Jeda Musik' : 'Putar Musik'}
			aria-label="Toggle Musik"
		>
			<i class="bi {isMusicPlaying ? 'bi-disc' : 'bi-pause-circle'}"></i>
		</button>
	{/if}

	<!-- MAIN INVITATION CONTENT -->
	<main class="invitation-body">
		<!-- SECTION: HOME / HERO -->
		<section class="section-block hero-section" id="sec-home">
			<div class="hero-header-badge">UNDANGAN PERNIKAHAN</div>
			<p class="hero-date-badge">
				<i class="bi bi-calendar-heart"></i>
				{weddingData.acara.akad.tanggal}
			</p>
			<h2 class="hero-names">
				{weddingData.mempelai.pria.namaPanggilan} & {weddingData.mempelai.wanita.namaPanggilan}
			</h2>

			<!-- Quote / Ayat Card -->
			<div class="luxury-card quote-card">
				<div class="quote-icon"><i class="bi bi-quote"></i></div>
				<p class="quote-text">"{weddingData.kutipan.teks}"</p>
				<div class="ornament-divider">
					<span class="line"></span>
					<span class="diamond"></span>
					<span class="line"></span>
				</div>
				<h4 class="quote-author">{weddingData.kutipan.sumber}</h4>
			</div>
		</section>

		<!-- SECTION: MEMPELAI (COUPLE) -->
		<section class="section-block" id="sec-mempelai">
			<div class="section-title-wrap">
				<span class="section-subtitle">Pasangan Pengantin</span>
				<h3 class="section-title">Mempelai Bahagia</h3>
				<div class="ornament-divider">
					<span class="line"></span>
					<span class="diamond"></span>
					<span class="line"></span>
				</div>
			</div>

			<div class="salam-card">
				{#if currentTemplate.id === 'islamic-moroccan'}
					<div class="arabic-bismillah">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
				{:else if currentTemplate.id === 'javanese-heritage'}
					<div class="cultural-badge-header">
						<span class="cultural-icon">⚜️</span>
						<span>SERAT TRISNO KERATON</span>
					</div>
				{:else if currentTemplate.id === 'royal-velvet'}
					<div class="cultural-badge-header royal-header">
						<span class="cultural-icon">👑</span>
						<span>ROYAL IMPERIAL INVITATION</span>
					</div>
				{:else if currentTemplate.id === 'sundanese-parahyangan'}
					<div class="cultural-badge-header">
						<span class="cultural-icon">🪷</span>
						<span>WILUJENG SUMPING — KASIH PARAHYANGAN</span>
					</div>
				{/if}
				<p class="salam-text">{weddingData.kutipan.salam}</p>
				<p class="salam-desc">{weddingData.kutipan.pesan}</p>
			</div>

			<!-- Groom Card -->
			<div class="luxury-card couple-card">
				<div class="avatar-ring">
					<img
						src={weddingData.mempelai.pria.foto}
						alt={weddingData.mempelai.pria.namaLengkap}
						class="couple-avatar"
					/>
				</div>
				<h4 class="couple-fullname">{weddingData.mempelai.pria.namaLengkap}</h4>
				<p class="couple-relation">
					{weddingData.mempelai.pria.anakKe}<br />
					dari Bapak <strong>{weddingData.mempelai.pria.ayah}</strong><br />
					& Ibu <strong>{weddingData.mempelai.pria.ibu}</strong>
				</p>
				{#if weddingData.mempelai.pria.instagram}
					<a
						href="https://instagram.com/{weddingData.mempelai.pria.instagram}"
						target="_blank"
						rel="noopener noreferrer"
						class="btn-social"
					>
						<i class="bi bi-instagram"></i>
						<span>@{weddingData.mempelai.pria.instagram}</span>
					</a>
				{/if}
			</div>

			<div class="couple-and-divider">
				<span class="script-and">&</span>
			</div>

			<!-- Bride Card -->
			<div class="luxury-card couple-card">
				<div class="avatar-ring">
					<img
						src={weddingData.mempelai.wanita.foto}
						alt={weddingData.mempelai.wanita.namaLengkap}
						class="couple-avatar"
					/>
				</div>
				<h4 class="couple-fullname">{weddingData.mempelai.wanita.namaLengkap}</h4>
				<p class="couple-relation">
					{weddingData.mempelai.wanita.anakKe}<br />
					dari Bapak <strong>{weddingData.mempelai.wanita.ayah}</strong><br />
					& Ibu <strong>{weddingData.mempelai.wanita.ibu}</strong>
				</p>
				{#if weddingData.mempelai.wanita.instagram}
					<a
						href="https://instagram.com/{weddingData.mempelai.wanita.instagram}"
						target="_blank"
						rel="noopener noreferrer"
						class="btn-social"
					>
						<i class="bi bi-instagram"></i>
						<span>@{weddingData.mempelai.wanita.instagram}</span>
					</a>
				{/if}
			</div>
		</section>

		<!-- SECTION: ACARA & COUNTDOWN -->
		<section class="section-block" id="sec-acara">
			<div class="section-title-wrap">
				<span class="section-subtitle">Save The Date</span>
				<h3 class="section-title">Rangkaian Acara</h3>
				<div class="ornament-divider">
					<span class="line"></span>
					<span class="diamond"></span>
					<span class="line"></span>
				</div>
			</div>

			<!-- Countdown Box -->
			<div class="luxury-card countdown-card">
				<div class="countdown-eyebrow">
					<i class="bi bi-hourglass-split"></i>
					<span>MENGHITUNG HARI BAHAGIA</span>
				</div>
				<div class="countdown-grid">
					<div class="cd-item">
						<span class="cd-number">{days}</span>
						<span class="cd-label">HARI</span>
					</div>
					<span class="cd-colon">:</span>
					<div class="cd-item">
						<span class="cd-number">{hours}</span>
						<span class="cd-label">JAM</span>
					</div>
					<span class="cd-colon">:</span>
					<div class="cd-item">
						<span class="cd-number">{minutes}</span>
						<span class="cd-label">MENIT</span>
					</div>
					<span class="cd-colon">:</span>
					<div class="cd-item">
						<span class="cd-number">{seconds}</span>
						<span class="cd-label">DETIK</span>
					</div>
				</div>
				{#if currentTemplate.tier !== 'free'}
					<a
						href={getGoogleCalendarUrl()}
						target="_blank"
						rel="noopener noreferrer"
						class="btn-calendar"
					>
						<i class="bi bi-calendar2-plus"></i>
						<span>Ingatkan di Google Calendar</span>
					</a>
				{/if}
			</div>

			<!-- Akad Nikah Card -->
			<div class="luxury-card event-card">
				<div class="event-icon-badge"><i class="bi bi-heart-fill"></i></div>
				<h4 class="event-title">{weddingData.acara.akad.judul}</h4>
				<div class="event-detail-row">
					<i class="bi bi-calendar3"></i>
					<span>{weddingData.acara.akad.tanggal}</span>
				</div>
				<div class="event-detail-row">
					<i class="bi bi-clock"></i>
					<span>
						Pukul {weddingData.acara.akad.waktuMulai} - {weddingData.acara.akad.waktuSelesai}
						{weddingData.acara.akad.zonaWaktu}
					</span>
				</div>
				<div class="event-detail-row">
					<i class="bi bi-geo-alt-fill"></i>
					<div class="loc-wrap">
						<strong>{weddingData.acara.akad.tempat}</strong>
						<p class="loc-address">{weddingData.acara.akad.alamat}</p>
					</div>
				</div>
				{#if weddingData.acara.akad.mapsUrl}
					<a
						href={weddingData.acara.akad.mapsUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="btn-maps"
					>
						<i class="bi bi-pin-map"></i>
						<span>Petunjuk Arah Maps</span>
					</a>
				{/if}
			</div>

			<!-- Resepsi Pernikahan Card -->
			<div class="luxury-card event-card">
				<div class="event-icon-badge"><i class="bi bi-balloon-heart-fill"></i></div>
				<h4 class="event-title">{weddingData.acara.resepsi.judul}</h4>
				<div class="event-detail-row">
					<i class="bi bi-calendar3"></i>
					<span>{weddingData.acara.resepsi.tanggal}</span>
				</div>
				<div class="event-detail-row">
					<i class="bi bi-clock"></i>
					<span>
						Pukul {weddingData.acara.resepsi.waktuMulai} - {weddingData.acara.resepsi.waktuSelesai}
						{weddingData.acara.resepsi.zonaWaktu}
					</span>
				</div>
				<div class="event-detail-row">
					<i class="bi bi-geo-alt-fill"></i>
					<div class="loc-wrap">
						<strong>{weddingData.acara.resepsi.tempat}</strong>
						<p class="loc-address">{weddingData.acara.resepsi.alamat}</p>
					</div>
				</div>
				{#if weddingData.acara.resepsi.mapsUrl}
					<a
						href={weddingData.acara.resepsi.mapsUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="btn-maps"
					>
						<i class="bi bi-pin-map"></i>
						<span>Petunjuk Arah Maps</span>
					</a>
				{/if}
			</div>
		</section>

		<!-- SECTION: SUSUNAN ACARA / RUNDOWN (VIP & CULTURAL HERITAGE) -->
		{#if currentTemplate.tier === 'vip' || currentTemplate.id === 'javanese-heritage' || currentTemplate.id === 'sundanese-parahyangan'}
			<section class="section-block" id="sec-rundown">
				<div class="section-title-wrap">
					<span class="section-subtitle">
						{#if currentTemplate.id === 'javanese-heritage'}
							Tata Cara Adat Jawa
						{:else if currentTemplate.id === 'sundanese-parahyangan'}
							Runtuyan Adat Sunda
						{:else if currentTemplate.id === 'royal-velvet'}
							Royal Timeline
						{:else}
							Susunan Acara
						{/if}
					</span>
					<h3 class="section-title">
						{#if currentTemplate.id === 'javanese-heritage'}
							Susunan Prosesi Adat
						{:else if currentTemplate.id === 'sundanese-parahyangan'}
							Runtuyan Upacara Adat
						{:else if currentTemplate.id === 'royal-velvet'}
							The Royal Banquet Timeline
						{:else}
							Rundown Hari Bahagia
						{/if}
					</h3>
					<div class="ornament-divider">
						<span class="line"></span>
						<span class="diamond"></span>
						<span class="line"></span>
					</div>
				</div>

				<div class="luxury-card rundown-card">
					<div class="rundown-list">
						{#each rundownList as item}
							<div class="rundown-row">
								<div class="rundown-time-badge">
									<i class="bi {item.icon || 'bi-clock'}"></i>
									<span>{item.jam}</span>
								</div>
								<div class="rundown-details">
									<h5 class="rundown-item-title">{item.acara}</h5>
									<p class="rundown-item-desc">{item.desc}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<!-- SECTION: ADAB & ETIKA WALIMATUL 'URS (ISLAMIC MOROCCAN) -->
		{#if currentTemplate.id === 'islamic-moroccan'}
			<section class="section-block" id="sec-adab">
				<div class="section-title-wrap">
					<span class="section-subtitle">Sunnah & Keberkahan</span>
					<h3 class="section-title">Adab Walimatul 'Urs</h3>
					<div class="ornament-divider">
						<span class="line"></span>
						<span class="diamond"></span>
						<span class="line"></span>
					</div>
				</div>

				<div class="adab-grid">
					<div class="adab-item-card">
						<div class="adab-icon">🤲</div>
						<h5>Mendoakan Kebaikan</h5>
						<p>Mendoakan kedua mempelai dengan doa keberkahan syar'i.</p>
					</div>
					<div class="adab-item-card">
						<div class="adab-icon">🧕</div>
						<h5>Berbusana Santun</h5>
						<p>Mengenakan pakaian yang rapi, sopan, dan menutup aurat.</p>
					</div>
					<div class="adab-item-card">
						<div class="adab-icon">🥗</div>
						<h5>Adab Menikmati Jamuan</h5>
						<p>Makan dan minum sambil duduk serta menggunakan tangan kanan.</p>
					</div>
					<div class="adab-item-card">
						<div class="adab-icon">🕊️</div>
						<h5>Silaturahmi Ikhlas</h5>
						<p>Menjaga ukhuwah dan kerukunan sesama tamu undangan.</p>
					</div>
				</div>
			</section>
		{/if}

		<!-- SECTION: DRESS CODE (PREMIUM & VIP) -->
		{#if currentTemplate.tier !== 'free'}
			<section class="section-block" id="sec-dresscode">
				<div class="section-title-wrap">
					<span class="section-subtitle">Attire Guide</span>
					<h3 class="section-title">Panduan Busana (Dress Code)</h3>
					<div class="ornament-divider">
						<span class="line"></span>
						<span class="diamond"></span>
						<span class="line"></span>
					</div>
				</div>

				<div class="luxury-card dresscode-card">
					<p class="dresscode-desc">
						Demi keselarasan dokumentasi dan keindahan momen, kami menyarankan para tamu mengenakan busana bernuansa:
					</p>
					<div class="dresscode-palette-grid">
						{#each weddingData.dresscode?.warna || [
							{ nama: 'Champagne Gold', hex: '#C5A059' },
							{ nama: 'Sage Green', hex: '#4A6B52' },
							{ nama: 'Terracotta', hex: '#C2593F' },
							{ nama: 'Batik Soga', hex: '#5C381E' }
						] as color}
							<div class="palette-swatch-item">
								<div class="swatch-bubble" style="background-color: {color.hex};"></div>
								<span class="swatch-title">{color.nama}</span>
							</div>
						{/each}
					</div>
				</div>
			</section>
		{/if}

		<!-- SECTION: LIVE STREAMING (PREMIUM PRO & VIP) -->
		{#if currentTemplate.tier !== 'free'}
			<section class="section-block" id="sec-streaming">
				<div class="section-title-wrap">
					<span class="section-subtitle">Siaran Virtual</span>
					<h3 class="section-title">Live Streaming Acara</h3>
					<div class="ornament-divider">
						<span class="line"></span>
						<span class="diamond"></span>
						<span class="line"></span>
					</div>
				</div>

				<div class="luxury-card streaming-card">
					<div class="streaming-video-wrapper">
						<iframe
							src="https://www.youtube-nocookie.com/embed/jfKfPfyJRdk"
							title="Live Streaming Pernikahan"
							frameborder="0"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
							allowfullscreen
						></iframe>
					</div>
					<div class="streaming-info">
						<div class="live-indicator">
							<span class="live-dot"></span>
							<span>YOUTUBE LIVE</span>
						</div>
						<p class="streaming-desc">
							Bagi keluarga dan rekan yang berhalangan hadir langsung, Anda dapat menyaksikan momen sakral pernikahan kami secara virtual.
						</p>
						<a
							href="https://youtube.com/live"
							target="_blank"
							rel="noopener noreferrer"
							class="btn-live-stream"
						>
							<i class="bi bi-play-btn-fill"></i>
							<span>Buka Siaran Langsung</span>
						</a>
					</div>
				</div>
			</section>
		{/if}

		<!-- SECTION: KISAH CINTA (LOVE STORY - PRO & VIP) -->
		{#if currentTemplate.tier !== 'free' && weddingData?.cerita && weddingData.cerita.length > 0}
			<section class="section-block" id="sec-kisah">
				<div class="section-title-wrap">
					<span class="section-subtitle">Our Love Story</span>
					<h3 class="section-title">Kisah Cinta Kami</h3>
					<div class="ornament-divider">
						<span class="line"></span>
						<span class="diamond"></span>
						<span class="line"></span>
					</div>
				</div>

				<div class="timeline-container">
					{#each weddingData.cerita as item}
						<div class="timeline-item">
							<div class="timeline-dot"><i class="bi bi-heart-fill"></i></div>
							<div class="timeline-card">
								<span class="timeline-year">{item.tahun}</span>
								<h5 class="timeline-title">{item.judul}</h5>
								<p class="timeline-desc">{item.isi}</p>
							</div>
						</div>
					{/each}
				</div>
			</section>
		{/if}

		<!-- SECTION: GALERI FOTO -->
		<section class="section-block" id="sec-galeri">
			<div class="section-title-wrap">
				<span class="section-subtitle">Prewedding Moments</span>
				<h3 class="section-title">Galeri Kebersamaan</h3>
				<div class="ornament-divider">
					<span class="line"></span>
					<span class="diamond"></span>
					<span class="line"></span>
				</div>
			</div>

			{#if currentTemplate.tier === 'free'}
				<!-- Free Tier: Single Featured Photo -->
				<div class="luxury-card free-photo-card">
					<img
						src={weddingData.galeri?.[0]?.url || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800'}
						alt="Foto Kebersamaan"
						class="free-single-img"
					/>
					<p class="free-photo-caption">
						"Mencintai bukan tentang saling memandang, melainkan bersama-sama memandang ke arah yang sama."
					</p>
				</div>
			{:else}
				<!-- Pro & VIP Tier: Full Interactive Grid -->
				<div class="gallery-grid">
					{#each weddingData.galeri as foto}
						<button
							type="button"
							class="gallery-item-btn"
							onclick={() => (selectedImage = foto.url)}
							aria-label="Lihat Foto"
						>
							<img src={foto.url} alt={foto.caption || 'Foto Prewedding'} loading="lazy" />
							<div class="gallery-zoom-overlay">
								<i class="bi bi-arrows-fullscreen"></i>
							</div>
						</button>
					{/each}
				</div>
			{/if}
		</section>

		<!-- SECTION: KADO DIGITAL (GIFT) -->
		<section class="section-block" id="sec-kado">
			<div class="section-title-wrap">
				<span class="section-subtitle">Wedding Gift</span>
				<h3 class="section-title">
					{#if currentTemplate.id === 'javanese-heritage'}
						Titip Hadiah & Tanda Asih
					{:else}
						Tanda Kasih
					{/if}
				</h3>
				<div class="ornament-divider">
					<span class="line"></span>
					<span class="diamond"></span>
					<span class="line"></span>
				</div>
			</div>

			{#if currentTemplate.tier === 'free'}
				<!-- Free Tier Gift Card (Doa Restu) -->
				<div class="luxury-card free-tier-gift-card">
					<div class="gift-heart-icon"><i class="bi bi-heart-fill"></i></div>
					<h4 class="gift-free-title">Doa Restu Anda Adalah Kado Terindah</h4>
					<p class="gift-free-text">
						Kehadiran dan doa restu yang tulus dari Bapak/Ibu/Saudara/i sekalian merupakan anugerah yang tak ternilai bagi kami dalam mengawali mahligai rumah tangga ini.
					</p>
					<button type="button" class="btn-goto-rsvp" onclick={() => scrollToSection('sec-rsvp')}>
						<i class="bi bi-chat-heart"></i>
						<span>Kirim Doa Restu</span>
					</button>
				</div>
			{:else}
				<!-- Pro & VIP Bank Transfer Cards -->
				<p class="gift-intro">{weddingData.kado.deskripsi}</p>

				<div class="bank-cards-grid">
					{#each weddingData.kado.rekening as rek}
						<div class="luxury-card bank-card">
							<div class="bank-card-header">
								<span class="bank-brand-name">{rek.bank}</span>
								<i class="bi {rek.icon || 'bi-credit-card'} bank-type-icon"></i>
							</div>
							<div class="bank-account-number">{rek.noRek}</div>
							<div class="bank-holder-name">a.n. <strong>{rek.atasNama}</strong></div>
							<button
								type="button"
								class="btn-copy-rekening"
								onclick={() => copyText(rek.noRek, `Nomor rekening ${rek.bank}`)}
							>
								<i class="bi bi-clipboard"></i>
								<span>Salin No. Rekening</span>
							</button>
						</div>
					{/each}
				</div>

				<!-- VIP Exclusive: Kirim Kado Fisik -->
				{#if currentTemplate.tier === 'vip' && weddingData.kado.alamatKado}
					<div class="luxury-card address-card vip-gift-card">
						<div class="address-header">
							<i class="bi bi-box2-heart-fill"></i>
							<h5>Kirim Kado Fisik ke Kediaman</h5>
						</div>
						<p class="address-content">{weddingData.kado.alamatKado}</p>
						<button
							type="button"
							class="btn-copy-address"
							onclick={() => copyText(weddingData.kado.alamatKado, 'Alamat pengiriman')}
						>
							<i class="bi bi-clipboard-check"></i>
							<span>Salin Alamat Lengkap Kurir</span>
						</button>
					</div>
				{/if}
			{/if}
		</section>

		<!-- SECTION: RSVP & BUKU TAMU -->
		<section class="section-block" id="sec-rsvp">
			<div class="section-title-wrap">
				<span class="section-subtitle">Buku Tamu & Doa Restu</span>
				<h3 class="section-title">Konfirmasi Kehadiran</h3>
				<div class="ornament-divider">
					<span class="line"></span>
					<span class="diamond"></span>
					<span class="line"></span>
				</div>
			</div>

			<!-- RSVP Form -->
			<div class="luxury-card rsvp-form-card">
				{#if rsvpSuccess}
					<div class="rsvp-alert-success">
						<i class="bi bi-check-circle-fill"></i>
						<p>Terima kasih! Konfirmasi kehadiran dan ucapan Anda telah tersimpan.</p>
					</div>
				{/if}

				<form onsubmit={handleRsvpSubmit} class="rsvp-form">
					<div class="form-group">
						<label for="rsvp-nama">Nama Tamu / Sahabat</label>
						<input
							type="text"
							id="rsvp-nama"
							bind:value={rsvpNama}
							placeholder="Masukkan nama lengkap Anda..."
							required
						/>
					</div>

					<div class="form-group">
						<label for="rsvp-kehadiran">Konfirmasi Kehadiran</label>
						<select id="rsvp-kehadiran" bind:value={rsvpKehadiran}>
							<option value="hadir">✅ Ya, Saya Akan Hadir</option>
							<option value="tidak_hadir">❌ Maaf, Belum Bisa Hadir</option>
							<option value="ragu">🤔 Masih Ragu / Belum Pasti</option>
						</select>
					</div>

					{#if rsvpKehadiran === 'hadir'}
						<div class="form-group">
							<label for="rsvp-jumlah">Jumlah Tamu</label>
							<select id="rsvp-jumlah" bind:value={rsvpJumlah}>
								<option value={1}>1 Orang</option>
								<option value={2}>2 Orang</option>
								<option value={3}>3 Orang</option>
								<option value={4}>4 Orang</option>
							</select>
						</div>
					{/if}

					<div class="form-group">
						<label for="rsvp-ucapan">Ucapan & Doa Restu</label>
						<textarea
							id="rsvp-ucapan"
							bind:value={rsvpUcapan}
							rows="3"
							placeholder="Tuliskan ucapan dan doa terbaik untuk kedua mempelai..."
							required
						></textarea>
					</div>

					<button type="submit" class="btn-submit-rsvp">
						<i class="bi bi-send-fill"></i>
						<span>Kirim Konfirmasi & Doa</span>
					</button>
				</form>
			</div>

			<!-- Wishes Wall -->
			<div class="wishes-wall-container">
				<div class="wishes-wall-header">
					<h4>Doa & Ucapan Tamu</h4>
					<span class="wishes-count">{weddingData.rsvps?.length || 0} Doa</span>
				</div>

				<div class="wishes-list">
					{#if !weddingData.rsvps || weddingData.rsvps.length === 0}
						<div class="empty-wishes">Belum ada ucapan. Jadilah yang pertama mengirimkan doa!</div>
					{:else}
						{#each weddingData.rsvps as item}
							<div class="wish-item">
								<div class="wish-item-header">
									<strong class="wish-author">{item.nama}</strong>
									<div class="wish-badges-row">
										{#if item.kehadiran === 'hadir'}
											<span class="status-badge badge-hadir">Hadir</span>
										{:else if item.kehadiran === 'tidak_hadir'}
											<span class="status-badge badge-tidak">Tidak Hadir</span>
										{:else}
											<span class="status-badge badge-ragu">Ragu</span>
										{/if}
									</div>
								</div>
								<p class="wish-text">{item.ucapan}</p>
								<div class="wish-footer">
									<span class="wish-time">{item.waktu || 'Tamu Terhormat'}</span>
									{#if currentTemplate.tier === 'vip'}
										<button
											type="button"
											class="btn-like-wish"
											onclick={() => handleLikeWish(item.id)}
											title="Kirim Cinta / Like"
										>
											<i class="bi bi-heart-fill"></i>
											<span>{(item.likes || 0) + (wishLikes[item.id] || 0)}</span>
										</button>
									{/if}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</section>

		<!-- SECTION: CLOSING THANKS -->
		<section class="section-block closing-section">
			<h4 class="closing-title">Terima Kasih</h4>
			<p class="closing-text">
				Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan
				hadir dan memberikan doa restu bagi lembaran baru kehidupan kami.
			</p>
			<h2 class="closing-names">
				{weddingData.mempelai.pria.namaPanggilan} & {weddingData.mempelai.wanita.namaPanggilan}
			</h2>
			<div class="footer-credit">
				<span>Kisah Nikah — Undangan Digital, Cerita Seumur Hidup</span>
			</div>
		</section>
	</main>

	<!-- FLOATING BOTTOM NAVIGATION BAR -->
	{#if isCoverOpened}
		<nav class="invitation-bottom-nav">
			<button
				type="button"
				class="nav-tab-btn {activeSection === 'sec-home' ? 'active' : ''}"
				onclick={() => scrollToSection('sec-home')}
			>
				<i class="bi bi-house-heart"></i>
				<span>Beranda</span>
			</button>
			<button
				type="button"
				class="nav-tab-btn {activeSection === 'sec-mempelai' ? 'active' : ''}"
				onclick={() => scrollToSection('sec-mempelai')}
			>
				<i class="bi bi-people"></i>
				<span>Mempelai</span>
			</button>
			<button
				type="button"
				class="nav-tab-btn {activeSection === 'sec-acara' ? 'active' : ''}"
				onclick={() => scrollToSection('sec-acara')}
			>
				<i class="bi bi-calendar-event"></i>
				<span>Acara</span>
			</button>
			{#if currentTemplate.tier === 'vip' || currentTemplate.id === 'javanese-heritage' || currentTemplate.id === 'sundanese-parahyangan'}
				<button
					type="button"
					class="nav-tab-btn {activeSection === 'sec-rundown' ? 'active' : ''}"
					onclick={() => scrollToSection('sec-rundown')}
				>
					<i class="bi bi-clock-history"></i>
					<span>Rundown</span>
				</button>
			{/if}
			<button
				type="button"
				class="nav-tab-btn {activeSection === 'sec-galeri' ? 'active' : ''}"
				onclick={() => scrollToSection('sec-galeri')}
			>
				<i class="bi bi-images"></i>
				<span>Galeri</span>
			</button>
			<button
				type="button"
				class="nav-tab-btn {activeSection === 'sec-kado' ? 'active' : ''}"
				onclick={() => scrollToSection('sec-kado')}
			>
				<i class="bi bi-gift"></i>
				<span>Kado</span>
			</button>
			<button
				type="button"
				class="nav-tab-btn {activeSection === 'sec-rsvp' ? 'active' : ''}"
				onclick={() => scrollToSection('sec-rsvp')}
			>
				<i class="bi bi-chat-heart"></i>
				<span>RSVP</span>
			</button>
		</nav>
	{/if}

	<!-- LIGHTBOX MODAL -->
	{#if selectedImage}
		<div
			class="lightbox-overlay"
			onclick={() => (selectedImage = null)}
			onkeydown={(e) => e.key === 'Escape' && (selectedImage = null)}
			tabindex="-1"
			role="dialog"
			aria-modal="true"
			aria-label="Tampilan Foto Penuh"
		>
			<div class="lightbox-dialog">
				<img src={selectedImage} alt="Fullscreen View" class="lightbox-img" />
				<button
					type="button"
					class="btn-close-lightbox"
					onclick={() => (selectedImage = null)}
					aria-label="Tutup foto"
				>
					<i class="bi bi-x-lg"></i>
				</button>
			</div>
		</div>
	{/if}

	<!-- TOAST NOTIFICATION -->
	{#if toastVisible}
		<div class="toast-popup">
			<i class="bi bi-check-circle-fill"></i>
			<span>{toastMessage}</span>
		</div>
	{/if}
</div>
{/if}

<style>
	/* CSS Variables configured from Theme */
	.invitation-container {
		font-family: var(--font-body);
		background-color: var(--bg);
		color: var(--text);
		position: relative;
		min-height: 100vh;
		overflow-x: hidden;
		width: 100%;
		margin: 0 auto;
	}

	.is-simulator {
		max-width: 440px;
		min-height: 780px;
		border-radius: 36px;
		box-shadow: 0 15px 45px rgba(0, 0, 0, 0.25);
		border: 8px solid #202024;
	}

	.is-fullscreen {
		max-width: 480px;
		box-shadow: 0 0 50px rgba(0, 0, 0, 0.2);
	}

	/* 1. COVER SCREEN */
	.cover-screen {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 480px;
		height: 100vh;
		background-size: cover;
		background-position: center;
		z-index: 2000;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		color: #ffffff;
		text-align: center;
		padding: 2rem 1.5rem;
		transition: transform 0.95s cubic-bezier(0.77, 0, 0.175, 1);
		overflow: hidden;
	}

	.is-simulator .cover-screen {
		position: absolute;
		max-width: 100%;
		height: 100%;
		border-radius: 28px;
	}

	.cover-screen.cover-opened {
		transform: translate(-50%, -100%);
	}

	.cover-ornament-frame {
		position: absolute;
		top: 20px;
		left: 20px;
		right: 20px;
		bottom: 20px;
		border: 1px solid rgba(212, 175, 55, 0.4);
		border-radius: 16px;
		pointer-events: none;
	}

	.cover-content {
		position: relative;
		z-index: 2;
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 90%;
	}

	.cover-eyebrow {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-heading);
		font-size: 0.72rem;
		letter-spacing: 3px;
		text-transform: uppercase;
		color: #f4ead3;
		margin-bottom: 1.2rem;
	}

	.cover-eyebrow i {
		font-size: 0.65rem;
		color: var(--primary);
	}

	.cover-names {
		font-family: var(--font-title);
		font-size: clamp(3.2rem, 12vw, 4.4rem);
		line-height: 1.15;
		margin: 0 0 1.8rem;
		color: #ffffff;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
	}

	.and-symbol {
		display: block;
		font-size: 2.2rem;
		color: var(--primary);
	}

	.cover-guest-card {
		background: rgba(255, 255, 255, 0.12);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 18px;
		padding: 1rem 1.4rem;
		margin-bottom: 2rem;
		width: 100%;
		max-width: 320px;
	}

	.to-label {
		font-size: 0.76rem;
		color: rgba(255, 255, 255, 0.85);
		margin: 0 0 0.35rem;
	}

	.guest-name-pill {
		font-family: var(--font-heading);
		font-size: 1.2rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.5px;
	}

	.to-note {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.65);
		margin: 0.35rem 0 0;
	}

	.btn-open-invitation {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		background: linear-gradient(135deg, var(--primary) 0%, #fff7d6 50%, var(--secondary) 100%);
		color: #1a1a1a;
		border: none;
		padding: 0.85rem 2rem;
		border-radius: 35px;
		font-family: var(--font-heading);
		font-size: 0.86rem;
		font-weight: 700;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.35);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-open-invitation:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
	}

	/* FLOATING AUDIO TOGGLE */
	.audio-floating-btn {
		position: fixed;
		bottom: 82px;
		right: calc(50% - 220px);
		z-index: 1500;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--card);
		border: 2px solid var(--primary);
		color: var(--primary);
		font-size: 1.35rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.is-simulator .audio-floating-btn {
		position: absolute;
		right: 18px;
		bottom: 80px;
	}

	@media (max-width: 480px) {
		.audio-floating-btn {
			right: 18px;
		}
	}

	.audio-floating-btn.is-playing {
		animation: spinVinyl 4s linear infinite;
	}

	@keyframes spinVinyl {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* MAIN INVITATION BODY */
	.invitation-body {
		padding: 2.5rem 1.4rem 6rem;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	.section-block {
		position: relative;
	}

	.section-title-wrap {
		text-align: center;
		margin-bottom: 2rem;
	}

	.section-subtitle {
		font-family: var(--font-heading);
		font-size: 0.72rem;
		letter-spacing: 3px;
		text-transform: uppercase;
		color: var(--primary);
		display: block;
		margin-bottom: 0.35rem;
		font-weight: 600;
	}

	.section-title {
		font-family: var(--font-heading);
		font-size: 1.6rem;
		letter-spacing: 1px;
		color: var(--text);
		margin: 0 0 0.5rem;
	}

	.ornament-divider {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		margin-top: 0.5rem;
	}

	.ornament-divider .line {
		width: 40px;
		height: 1px;
		background: linear-gradient(90deg, transparent, var(--primary), transparent);
	}

	.ornament-divider .diamond {
		width: 6px;
		height: 6px;
		background: var(--primary);
		transform: rotate(45deg);
	}

	/* LUXURY CARD */
	.luxury-card {
		background: var(--card);
		border-radius: 20px;
		padding: 1.8rem 1.4rem;
		border: 1px solid rgba(197, 160, 89, 0.22);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
		backdrop-filter: blur(8px);
	}

	/* HERO SECTION */
	.hero-section {
		text-align: center;
		padding-top: 1rem;
	}

	.hero-header-badge {
		display: inline-block;
		font-family: var(--font-heading);
		font-size: 0.7rem;
		letter-spacing: 3px;
		color: var(--primary);
		font-weight: 700;
		margin-bottom: 0.4rem;
	}

	.hero-date-badge {
		font-size: 0.8rem;
		color: var(--secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		margin-bottom: 1.5rem;
	}

	.hero-names {
		font-family: var(--font-title);
		font-size: 3.4rem;
		color: var(--primary);
		line-height: 1.15;
		margin-bottom: 2rem;
	}

	.quote-card {
		text-align: center;
	}

	.quote-icon {
		font-size: 2rem;
		color: var(--primary);
		line-height: 1;
		margin-bottom: 0.5rem;
		opacity: 0.8;
	}

	.quote-text {
		font-size: 0.96rem;
		line-height: 1.7;
		font-style: italic;
		color: var(--text);
		margin-bottom: 1rem;
	}

	.quote-author {
		font-family: var(--font-heading);
		font-size: 0.82rem;
		letter-spacing: 1.5px;
		color: var(--primary);
		text-transform: uppercase;
		margin-top: 0.8rem;
	}

	/* COUPLE SECTION */
	.salam-card {
		text-align: center;
		margin-bottom: 2rem;
		padding: 0 0.5rem;
	}

	.salam-text {
		font-family: var(--font-heading);
		font-weight: 700;
		color: var(--primary);
		font-size: 1.1rem;
		margin-bottom: 0.5rem;
	}

	.salam-desc {
		font-size: 0.86rem;
		line-height: 1.6;
		color: var(--text);
		opacity: 0.85;
	}

	.couple-card {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.avatar-ring {
		width: 140px;
		height: 140px;
		border-radius: 50%;
		padding: 4px;
		background: linear-gradient(135deg, var(--primary) 0%, #fff7d6 50%, var(--secondary) 100%);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
		margin-bottom: 1.2rem;
	}

	.couple-avatar {
		width: 100%;
		height: 100%;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid #ffffff;
	}

	.couple-fullname {
		font-family: var(--font-heading);
		font-size: 1.28rem;
		font-weight: 700;
		color: var(--text);
		margin: 0 0 0.5rem;
	}

	.couple-relation {
		font-size: 0.86rem;
		line-height: 1.6;
		color: var(--text);
		opacity: 0.85;
		margin: 0 0 1rem;
	}

	.btn-social {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.4rem 1rem;
		border-radius: 20px;
		background: rgba(197, 160, 89, 0.12);
		color: var(--primary);
		font-size: 0.78rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.btn-social:hover {
		background: var(--primary);
		color: #ffffff;
	}

	.couple-and-divider {
		text-align: center;
		margin: 1rem 0;
	}

	.script-and {
		font-family: var(--font-title);
		font-size: 3.2rem;
		color: var(--primary);
	}

	/* COUNTDOWN & ACARA */
	.countdown-card {
		text-align: center;
		margin-bottom: 1.5rem;
	}

	.countdown-eyebrow {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 2px;
		color: var(--primary);
		margin-bottom: 1.2rem;
	}

	.countdown-grid {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
	}

	.cd-item {
		background: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(197, 160, 89, 0.35);
		border-radius: 12px;
		padding: 0.75rem 0.5rem;
		min-width: 62px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
	}

	.cd-number {
		font-family: var(--font-heading);
		font-size: 1.45rem;
		font-weight: 800;
		color: var(--secondary);
		display: block;
		line-height: 1.1;
	}

	.cd-label {
		font-size: 0.62rem;
		letter-spacing: 1px;
		font-weight: 700;
		color: var(--text);
		opacity: 0.7;
	}

	.cd-colon {
		font-size: 1.3rem;
		font-weight: 700;
		color: var(--primary);
	}

	.btn-calendar {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: rgba(197, 160, 89, 0.14);
		color: var(--primary);
		border: 1px solid var(--primary);
		padding: 0.6rem 1.2rem;
		border-radius: 25px;
		font-size: 0.78rem;
		font-weight: 700;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.btn-calendar:hover {
		background: var(--primary);
		color: #ffffff;
	}

	.event-card {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.event-icon-badge {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: rgba(197, 160, 89, 0.15);
		color: var(--primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
		margin-bottom: 0.8rem;
	}

	.event-title {
		font-family: var(--font-heading);
		font-size: 1.3rem;
		color: var(--primary);
		margin: 0 0 1.2rem;
	}

	.event-detail-row {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		font-size: 0.88rem;
		margin-bottom: 0.8rem;
		text-align: left;
		width: 100%;
		max-width: 320px;
	}

	.event-detail-row i {
		color: var(--primary);
		font-size: 1rem;
		margin-top: 0.15rem;
	}

	.loc-wrap strong {
		display: block;
		color: var(--text);
	}

	.loc-address {
		font-size: 0.8rem;
		color: var(--text);
		opacity: 0.8;
		margin: 0.2rem 0 0;
	}

	.btn-maps {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		background: var(--primary);
		color: #ffffff;
		padding: 0.65rem 1.4rem;
		border-radius: 25px;
		font-size: 0.8rem;
		font-weight: 600;
		text-decoration: none;
		margin-top: 0.8rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
		transition: all 0.25s ease;
	}

	.btn-maps:hover {
		transform: translateY(-2px);
		background: var(--secondary);
	}

	/* TIMELINE KISAH CINTA */
	.timeline-container {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		position: relative;
		padding-left: 1.5rem;
	}

	.timeline-container::before {
		content: '';
		position: absolute;
		top: 15px;
		bottom: 15px;
		left: 7px;
		width: 2px;
		background: var(--primary);
		opacity: 0.3;
	}

	.timeline-item {
		position: relative;
	}

	.timeline-dot {
		position: absolute;
		left: -1.5rem;
		top: 0.8rem;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--bg);
		border: 2px solid var(--primary);
		color: var(--primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.55rem;
	}

	.timeline-card {
		background: var(--card);
		border-radius: 16px;
		padding: 1.2rem;
		border: 1px solid rgba(197, 160, 89, 0.2);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
	}

	.timeline-year {
		display: inline-block;
		font-family: var(--font-heading);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 1px;
		color: var(--primary);
		margin-bottom: 0.3rem;
	}

	.timeline-title {
		font-family: var(--font-heading);
		font-size: 1.05rem;
		color: var(--text);
		margin: 0 0 0.5rem;
	}

	.timeline-desc {
		font-size: 0.84rem;
		line-height: 1.6;
		color: var(--text);
		opacity: 0.85;
		margin: 0;
		font-style: italic;
	}

	/* GALERI */
	.gallery-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.8rem;
	}

	.gallery-item-btn {
		aspect-ratio: 1;
		border-radius: 14px;
		overflow: hidden;
		border: 2px solid #ffffff;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
		cursor: pointer;
		position: relative;
		padding: 0;
		background: none;
	}

	.gallery-item-btn img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.4s ease;
	}

	.gallery-item-btn:hover img {
		transform: scale(1.08);
	}

	.gallery-zoom-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		font-size: 1.2rem;
		opacity: 0;
		transition: opacity 0.2s ease;
	}

	.gallery-item-btn:hover .gallery-zoom-overlay {
		opacity: 1;
	}

	/* KADO DIGITAL */
	.gift-intro {
		font-size: 0.88rem;
		line-height: 1.65;
		text-align: center;
		color: var(--text);
		opacity: 0.85;
		margin-bottom: 1.8rem;
	}

	.bank-cards-grid {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		margin-bottom: 1.5rem;
	}

	.bank-card {
		text-align: center;
		padding: 1.5rem;
		border: 1px dashed var(--primary);
	}

	.bank-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.8rem;
	}

	.bank-brand-name {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--text);
	}

	.bank-type-icon {
		font-size: 1.2rem;
		color: var(--primary);
	}

	.bank-account-number {
		font-family: 'Courier New', Courier, monospace;
		font-size: 1.35rem;
		font-weight: 800;
		letter-spacing: 2px;
		color: var(--secondary);
		margin-bottom: 0.4rem;
	}

	.bank-holder-name {
		font-size: 0.82rem;
		color: var(--text);
		opacity: 0.85;
		margin-bottom: 1.2rem;
	}

	.btn-copy-rekening,
	.btn-copy-address {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		background: rgba(197, 160, 89, 0.14);
		color: var(--primary);
		border: 1px solid var(--primary);
		padding: 0.55rem 1.2rem;
		border-radius: 20px;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-copy-rekening:hover,
	.btn-copy-address:hover {
		background: var(--primary);
		color: #ffffff;
	}

	.address-card {
		text-align: center;
		padding: 1.5rem;
	}

	.address-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		color: var(--primary);
		margin-bottom: 0.6rem;
	}

	.address-header h5 {
		font-family: var(--font-heading);
		font-size: 1rem;
		margin: 0;
	}

	.address-content {
		font-size: 0.84rem;
		line-height: 1.6;
		color: var(--text);
		opacity: 0.85;
		margin-bottom: 1rem;
	}

	/* RSVP & WISHES */
	.rsvp-form-card {
		margin-bottom: 2rem;
	}

	.rsvp-alert-success {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		background: #e6f4ea;
		color: #137333;
		padding: 0.8rem 1rem;
		border-radius: 12px;
		font-size: 0.84rem;
		margin-bottom: 1.2rem;
	}

	.rsvp-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		text-align: left;
	}

	.form-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text);
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.75rem 1rem;
		border-radius: 12px;
		border: 1px solid rgba(197, 160, 89, 0.3);
		background: rgba(255, 255, 255, 0.9);
		font-size: 0.86rem;
		font-family: var(--font-body);
		color: #222;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		border-color: var(--primary);
	}

	.btn-submit-rsvp {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: var(--primary);
		color: #ffffff;
		border: none;
		padding: 0.85rem;
		border-radius: 25px;
		font-weight: 700;
		font-size: 0.88rem;
		cursor: pointer;
		margin-top: 0.5rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.12);
		transition: all 0.25s ease;
	}

	.btn-submit-rsvp:hover {
		background: var(--secondary);
		transform: translateY(-2px);
	}

	.wishes-wall-container {
		background: var(--card);
		border-radius: 20px;
		padding: 1.5rem;
		border: 1px solid rgba(197, 160, 89, 0.2);
	}

	.wishes-wall-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.2rem;
		padding-bottom: 0.8rem;
		border-bottom: 1px solid rgba(197, 160, 89, 0.2);
	}

	.wishes-wall-header h4 {
		font-family: var(--font-heading);
		font-size: 1.05rem;
		margin: 0;
		color: var(--text);
	}

	.wishes-count {
		font-size: 0.75rem;
		font-weight: 700;
		background: rgba(197, 160, 89, 0.15);
		color: var(--primary);
		padding: 0.25rem 0.65rem;
		border-radius: 12px;
	}

	.wishes-list {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		max-height: 380px;
		overflow-y: auto;
		padding-right: 4px;
	}

	.empty-wishes {
		font-size: 0.85rem;
		color: var(--text);
		opacity: 0.7;
		text-align: center;
		padding: 1.5rem 0;
	}

	.wish-item {
		background: rgba(255, 255, 255, 0.6);
		border-radius: 12px;
		padding: 1rem;
		border: 1px solid rgba(197, 160, 89, 0.15);
	}

	.wish-item-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 0.4rem;
	}

	.wish-author {
		font-size: 0.88rem;
		color: var(--text);
	}

	.status-badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 0.2rem 0.55rem;
		border-radius: 10px;
	}

	.badge-hadir {
		background: #e6f4ea;
		color: #137333;
	}

	.badge-tidak {
		background: #fce8e6;
		color: #c5221f;
	}

	.badge-ragu {
		background: #fef7e0;
		color: #b06000;
	}

	.wish-text {
		font-size: 0.82rem;
		line-height: 1.55;
		color: var(--text);
		opacity: 0.9;
		margin: 0 0 0.35rem;
		word-break: break-word;
	}

	.wish-time {
		font-size: 0.68rem;
		color: var(--text);
		opacity: 0.6;
	}

	/* CLOSING */
	.closing-section {
		text-align: center;
		padding: 2rem 0 1rem;
	}

	.closing-title {
		font-family: var(--font-heading);
		font-size: 1.3rem;
		color: var(--primary);
		margin: 0 0 0.8rem;
	}

	.closing-text {
		font-size: 0.86rem;
		line-height: 1.65;
		color: var(--text);
		opacity: 0.85;
		margin-bottom: 1.5rem;
	}

	.closing-names {
		font-family: var(--font-title);
		font-size: 3rem;
		color: var(--primary);
		margin-bottom: 1.5rem;
	}

	.footer-credit {
		font-size: 0.72rem;
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--primary);
		opacity: 0.7;
	}

	/* FLOATING BOTTOM NAV */
	.invitation-bottom-nav {
		position: fixed;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 480px;
		height: 64px;
		background: var(--card);
		backdrop-filter: blur(14px);
		border-top: 1px solid rgba(197, 160, 89, 0.25);
		display: flex;
		align-items: center;
		justify-content: space-around;
		z-index: 1200;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
	}

	.is-simulator .invitation-bottom-nav {
		position: absolute;
		max-width: 100%;
		border-bottom-left-radius: 28px;
		border-bottom-right-radius: 28px;
	}

	.nav-tab-btn {
		background: none;
		border: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
		color: var(--text);
		opacity: 0.6;
		font-size: 0.65rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0.4rem;
		transition: all 0.2s ease;
	}

	.nav-tab-btn i {
		font-size: 1.1rem;
	}

	.nav-tab-btn.active,
	.nav-tab-btn:hover {
		color: var(--primary);
		opacity: 1;
		transform: translateY(-2px);
	}

	/* LIGHTBOX */
	.lightbox-overlay {
		position: fixed;
		inset: 0;
		background: rgba(10, 8, 7, 0.95);
		z-index: 3000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.lightbox-dialog {
		position: relative;
		max-width: 90%;
		max-height: 85vh;
	}

	.lightbox-img {
		max-width: 100%;
		max-height: 85vh;
		border-radius: 12px;
		border: 2px solid var(--primary);
		box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
	}

	.btn-close-lightbox {
		position: absolute;
		top: -40px;
		right: 0;
		background: none;
		border: none;
		color: #ffffff;
		font-size: 1.8rem;
		cursor: pointer;
	}

	/* TOAST */
	.toast-popup {
		position: fixed;
		bottom: 85px;
		left: 50%;
		transform: translateX(-50%);
		background: #1e1e1e;
		color: #ffffff;
		padding: 0.7rem 1.4rem;
		border-radius: 30px;
		font-size: 0.84rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		z-index: 4000;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
		animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.toast-popup i {
		color: #22c55e;
	}

	@keyframes popIn {
		from {
			opacity: 0;
			transform: translate(-50%, 15px);
		}
		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	/* TEMPLATE SPECIFIC ACCENTS & CULTURAL DECORATIONS */
	.eyebrow-accent {
		font-size: 0.9rem;
	}

	.arabic-bismillah {
		font-family: 'Amiri', 'Traditional Arabic', Georgia, serif;
		font-size: 1.45rem;
		color: var(--primary);
		margin-bottom: 0.85rem;
		letter-spacing: 2px;
		line-height: 1.4;
	}

	.cultural-badge-header {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		font-family: 'Cinzel', serif;
		font-size: 0.72rem;
		letter-spacing: 2px;
		font-weight: 700;
		color: var(--primary);
		margin-bottom: 0.9rem;
		padding: 0.3rem 0.85rem;
		border-radius: 20px;
		background: rgba(197, 160, 89, 0.1);
		border: 1px solid rgba(197, 160, 89, 0.25);
	}

	.cultural-badge-header.royal-header {
		background: rgba(223, 177, 91, 0.15);
		border-color: rgba(223, 177, 91, 0.45);
		color: #dfb15b;
	}

	/* ISLAMIC MOROCCAN: Rounded Mosque Arch Shape */
	.tpl-islamic-moroccan .luxury-card {
		border-radius: 36px 36px 20px 20px;
		border: 1px solid rgba(197, 160, 89, 0.3);
		box-shadow: 0 8px 30px rgba(44, 94, 67, 0.08);
	}

	/* JAVANESE HERITAGE: Soga Brown & Keraton Gold */
	.tpl-javanese-heritage .cover-ornament-frame {
		border: 2px solid #c49746;
		box-shadow: inset 0 0 20px rgba(196, 151, 70, 0.25);
	}

	.tpl-javanese-heritage .luxury-card {
		border: 1px solid rgba(196, 151, 70, 0.35);
		border-radius: 20px;
		box-shadow: 0 8px 25px rgba(92, 56, 30, 0.06);
	}

	/* ROYAL VELVET: 3D Gold Foil on Velvet */
	.tpl-royal-velvet .luxury-card {
		border: 1.5px solid rgba(223, 177, 91, 0.55);
		box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6), 0 0 15px rgba(223, 177, 91, 0.12);
	}

	.tpl-royal-velvet .btn-open-invitation {
		box-shadow: 0 6px 25px rgba(223, 177, 91, 0.45);
	}

	/* SUNDANESE PARAHYANGAN */
	.tpl-sundanese-parahyangan .luxury-card {
		border: 1px solid rgba(212, 175, 55, 0.3);
		border-radius: 24px;
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.05);
	}

	/* BOTANICAL SAGE: Minimalist Natural */
	.tpl-botanical-sage .luxury-card {
		border: 1px solid rgba(74, 107, 82, 0.25);
		border-radius: 22px;
		box-shadow: 0 8px 25px rgba(74, 107, 82, 0.07);
	}

	/* VIP COVER BADGE & 3D WAX SEAL */
	.vip-guest-pill {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: linear-gradient(135deg, #9e1b32, #dfb15b);
		color: #ffffff;
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 1px;
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		margin-bottom: 0.6rem;
		box-shadow: 0 2px 10px rgba(158, 27, 50, 0.5);
	}

	.wax-seal-btn {
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		outline: none;
		transition: transform 0.3s ease;
	}

	.wax-seal-btn:hover {
		transform: scale(1.06);
	}

	.wax-seal-outer {
		width: 100px;
		height: 100px;
		border-radius: 50%;
		background: radial-gradient(circle at 35% 35%, #e63946, #9b111e 60%, #590d15);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.6), inset 0 2px 4px rgba(255, 255, 255, 0.4), inset 0 -4px 8px rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 3px solid rgba(223, 177, 91, 0.7);
		animation: pulseGlow 2.5s ease-in-out infinite alternate;
	}

	.wax-seal-inner {
		width: 82px;
		height: 82px;
		border-radius: 50%;
		border: 1.5px dashed rgba(223, 177, 91, 0.85);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #ffd978;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
	}

	.wax-crown {
		font-size: 1.1rem;
		line-height: 1;
	}

	.wax-monogram {
		font-family: 'Cinzel', serif;
		font-size: 1.25rem;
		font-weight: 800;
		letter-spacing: 2px;
		line-height: 1.2;
	}

	.wax-text {
		font-size: 0.48rem;
		font-weight: 800;
		letter-spacing: 1px;
		opacity: 0.9;
	}

	@keyframes pulseGlow {
		from { box-shadow: 0 6px 20px rgba(155, 17, 30, 0.5); }
		to { box-shadow: 0 10px 32px rgba(223, 177, 91, 0.6); }
	}

	/* RUNDOWN STYLES */
	.rundown-card {
		padding: 1.6rem 1.2rem;
	}

	.rundown-list {
		display: flex;
		flex-direction: column;
		gap: 1.2rem;
		position: relative;
	}

	.rundown-row {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		position: relative;
	}

	.rundown-time-badge {
		background: rgba(197, 160, 89, 0.15);
		border: 1px solid rgba(197, 160, 89, 0.35);
		color: var(--primary);
		padding: 0.4rem 0.75rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		white-space: nowrap;
		flex-shrink: 0;
	}

	.rundown-details {
		flex: 1;
	}

	.rundown-item-title {
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text);
		margin: 0 0 0.25rem;
	}

	.rundown-item-desc {
		font-size: 0.8rem;
		color: var(--text);
		opacity: 0.8;
		margin: 0;
		line-height: 1.5;
	}

	/* ADAB WALIMATUL 'URS */
	.adab-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.85rem;
	}

	.adab-item-card {
		background: var(--card);
		border: 1px solid rgba(197, 160, 89, 0.28);
		border-radius: 16px;
		padding: 1.1rem 0.9rem;
		text-align: center;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
	}

	.adab-icon {
		font-size: 1.8rem;
		margin-bottom: 0.4rem;
	}

	.adab-item-card h5 {
		font-family: var(--font-heading);
		font-size: 0.85rem;
		color: var(--text);
		margin: 0 0 0.35rem;
		font-weight: 700;
	}

	.adab-item-card p {
		font-size: 0.72rem;
		color: var(--text);
		opacity: 0.75;
		margin: 0;
		line-height: 1.45;
	}

	/* DRESS CODE */
	.dresscode-card {
		text-align: center;
	}

	.dresscode-desc {
		font-size: 0.84rem;
		line-height: 1.6;
		color: var(--text);
		opacity: 0.85;
		margin: 0 0 1.2rem;
	}

	.dresscode-palette-grid {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 1rem;
	}

	.palette-swatch-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.4rem;
	}

	.swatch-bubble {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		border: 2px solid #ffffff;
		transition: transform 0.2s ease;
	}

	.swatch-bubble:hover {
		transform: scale(1.1);
	}

	.swatch-title {
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text);
	}

	/* LIVE STREAMING */
	.streaming-card {
		overflow: hidden;
		padding: 0;
	}

	.streaming-video-wrapper {
		position: relative;
		padding-bottom: 56.25%;
		height: 0;
		background: #000000;
	}

	.streaming-video-wrapper iframe {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
	}

	.streaming-info {
		padding: 1.4rem;
		text-align: center;
	}

	.live-indicator {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: rgba(220, 38, 38, 0.15);
		border: 1px solid rgba(220, 38, 38, 0.35);
		color: #dc2626;
		font-size: 0.68rem;
		font-weight: 800;
		padding: 0.25rem 0.65rem;
		border-radius: 20px;
		margin-bottom: 0.8rem;
	}

	.live-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #dc2626;
		animation: pulseRed 1.5s infinite;
	}

	@keyframes pulseRed {
		0% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(1.3); }
		100% { opacity: 1; transform: scale(1); }
	}

	.streaming-desc {
		font-size: 0.82rem;
		line-height: 1.6;
		color: var(--text);
		opacity: 0.85;
		margin: 0 0 1.1rem;
	}

	.btn-live-stream {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: #dc2626;
		color: #ffffff;
		padding: 0.65rem 1.4rem;
		border-radius: 30px;
		font-size: 0.82rem;
		font-weight: 700;
		text-decoration: none;
		box-shadow: 0 4px 15px rgba(220, 38, 38, 0.35);
		transition: all 0.2s ease;
	}

	.btn-live-stream:hover {
		background: #b91c1c;
		transform: translateY(-2px);
	}

	/* FREE TIER GIFT & PHOTO CARDS */
	.free-tier-gift-card,
	.free-photo-card {
		text-align: center;
		padding: 2rem 1.5rem;
	}

	.gift-heart-icon {
		font-size: 2.5rem;
		color: var(--primary);
		margin-bottom: 0.6rem;
	}

	.gift-free-title {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		color: var(--text);
		margin: 0 0 0.8rem;
	}

	.gift-free-text {
		font-size: 0.84rem;
		line-height: 1.7;
		color: var(--text);
		opacity: 0.85;
		margin: 0 0 1.4rem;
	}

	.btn-goto-rsvp {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		background: var(--primary);
		color: #ffffff;
		border: none;
		padding: 0.65rem 1.4rem;
		border-radius: 30px;
		font-size: 0.82rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
	}

	.free-single-img {
		width: 100%;
		height: 280px;
		object-fit: cover;
		border-radius: 16px;
		margin-bottom: 1rem;
	}

	.free-photo-caption {
		font-size: 0.82rem;
		font-style: italic;
		color: var(--text);
		opacity: 0.8;
		margin: 0;
	}

	/* VIP GIFT CARD */
	.vip-gift-card {
		border: 1.5px solid rgba(223, 177, 91, 0.6);
		box-shadow: 0 6px 20px rgba(223, 177, 91, 0.15);
	}

	/* WISHES LIKES */
	.wish-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 0.4rem;
		padding-top: 0.4rem;
		border-top: 1px dashed rgba(197, 160, 89, 0.2);
	}

	.btn-like-wish {
		background: rgba(220, 38, 38, 0.08);
		border: 1px solid rgba(220, 38, 38, 0.3);
		color: #dc2626;
		padding: 0.2rem 0.55rem;
		border-radius: 15px;
		font-size: 0.72rem;
		font-weight: 700;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-like-wish:hover {
		background: #dc2626;
		color: #ffffff;
		transform: scale(1.05);
	}
</style>
