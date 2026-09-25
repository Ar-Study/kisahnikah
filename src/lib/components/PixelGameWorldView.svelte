<script>
	import { onMount, onDestroy } from 'svelte';

	/**
	 * @type {{
	 *   weddingData: any,
	 *   guestName?: string,
	 *   isSimulator?: boolean
	 * }}
	 */
	let { weddingData, guestName = 'Tamu Undangan', isSimulator = false } = $props();

	// View mode: 'game' (Interactive side-scroller) | 'scroll' (Classic retro scrollable invitation)
	let viewMode = $state('game');

	// Game state
	let hasStarted = $state(false);
	let isFemale = $state(false);
	let playerName = $state(guestName || 'Tamu Undangan');

	// Movement & World progress state (0 to 100%)
	let scrollPercent = $state(0);
	let isMoving = $state(false);
	let isFacingBack = $state(false); // false = right, true = left

	// Container refs
	let containerEl = $state(null);
	let audioElement = $state(null);
	let isMusicPlaying = $state(false);

	// Quest completion tracking
	let questMailbox = $state(false);
	let questParkInfo = $state(false);
	let questCrew = $state(false);
	let questCouple = $state(false);

	let completedQuestsCount = $derived(
		(questMailbox ? 1 : 0) + (questParkInfo ? 1 : 0) + (questCrew ? 1 : 0) + (questCouple ? 1 : 0)
	);

	// Active modal dialogs: null | 'mailbox' | 'parkinfo' | 'crew' | 'gift' | 'couple' | 'wish'
	let activeModal = $state(null);

	// Toast state
	let toastMessage = $state('');
	let toastVisible = $state(false);

	function showToast(msg) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 3200);
	}

	// Copy Helper
	function copyText(text, label = 'Teks') {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text).then(() => {
				showToast(`✓ ${label} berhasil disalin!`);
			});
		} else {
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			showToast(`✓ ${label} berhasil disalin!`);
		}
	}

	// RSVP Form state
	let rsvpNama = $state(guestName || '');
	let rsvpKehadiran = $state('hadir');
	let rsvpJumlah = $state(1);
	let rsvpUcapan = $state('');
	let rsvpSuccess = $state(false);

	// Wish likes state
	let wishLikes = $state({});
	function handleLikeWish(id) {
		wishLikes[id] = (wishLikes[id] || 0) + 1;
		showToast('❤️ Terima kasih atas doa restunya!');
	}

	function handleRsvpSubmit(e) {
		e.preventDefault();
		if (!rsvpNama.trim()) return;

		const newComment = {
			id: Date.now(),
			nama: rsvpNama.trim(),
			kehadiran: rsvpKehadiran,
			jumlah: Number(rsvpJumlah) || 1,
			ucapan: rsvpUcapan.trim() || 'Selamat berbahagia, semoga langgeng hingga keabadian!',
			waktu: 'Baru saja'
		};

		if (!weddingData.rsvps) weddingData.rsvps = [];
		weddingData.rsvps = [newComment, ...weddingData.rsvps];
		rsvpSuccess = true;
		showToast('✓ Doa & konfirmasi RSVP berhasil dikirim!');
		setTimeout(() => {
			rsvpSuccess = false;
		}, 4000);
	}

	// Google Calendar Generator
	function getGoogleCalendarUrl() {
		const groom = weddingData?.mempelai?.pria?.namaPanggilan || 'Rama';
		const bride = weddingData?.mempelai?.wanita?.namaPanggilan || 'Sari';
		const title = encodeURIComponent(`Pernikahan ${groom} & ${bride} (Pixel Game World)`);
		const details = encodeURIComponent(
			`Menghadiri resepsi pernikahan ${groom} & ${bride}. Lokasi: ${weddingData?.acara?.resepsi?.tempat || 'Taman Janji'}.`
		);
		const location = encodeURIComponent(
			`${weddingData?.acara?.resepsi?.tempat || 'Taman Janji'}, ${weddingData?.acara?.resepsi?.alamat || 'Ubud, Bali'}`
		);
		const dateStr = (weddingData?.acara?.resepsi?.tanggal || '2027-06-19').replace(/-/g, '');
		return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dateStr}T160000/${dateStr}T210000`;
	}

	// Audio toggle
	function toggleMusic() {
		if (!audioElement) return;
		if (isMusicPlaying) {
			audioElement.pause();
			isMusicPlaying = false;
		} else {
			audioElement.play().then(() => {
				isMusicPlaying = true;
			}).catch(err => console.log('Audio playback prevented:', err));
		}
	}

	// Open modal action
	function openModal(id) {
		activeModal = id;
		if (id === 'mailbox') questMailbox = true;
		if (id === 'parkinfo') questParkInfo = true;
		if (id === 'crew') questCrew = true;
		if (id === 'couple') questCouple = true;
	}

	function closeModal() {
		activeModal = null;
	}

	// Continuous movement via arrow hold
	let moveInterval = null;
	let moveStopTimeout = null;

	function startWalk(direction) {
		if (moveInterval) clearInterval(moveInterval);
		isMoving = true;
		isFacingBack = direction < 0;

		const step = () => {
			scrollPercent = Math.max(0, Math.min(100, scrollPercent + direction * 0.8));
			checkMilestoneTriggers();
		};

		step();
		moveInterval = setInterval(step, 40);
	}

	function stopWalk() {
		if (moveInterval) {
			clearInterval(moveInterval);
			moveInterval = null;
		}
		clearTimeout(moveStopTimeout);
		moveStopTimeout = setTimeout(() => {
			isMoving = false;
		}, 150);
	}

	// Wheel and Touch Drag
	function handleWheel(e) {
		if (!hasStarted || activeModal || viewMode !== 'game') return;
		e.preventDefault();
		const delta = (e.deltaY || e.deltaX) > 0 ? 1 : -1;
		isMoving = true;
		isFacingBack = delta < 0;
		scrollPercent = Math.max(0, Math.min(100, scrollPercent + delta * 1.4));
		checkMilestoneTriggers();

		clearTimeout(moveStopTimeout);
		moveStopTimeout = setTimeout(() => {
			isMoving = false;
		}, 180);
	}

	// Touch drag
	let touchStartX = 0;
	let touchStartY = 0;

	function handleTouchStart(e) {
		if (e.touches.length === 1) {
			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;
		}
	}

	function handleTouchMove(e) {
		if (!hasStarted || activeModal || viewMode !== 'game' || e.touches.length !== 1) return;
		const diffX = touchStartX - e.touches[0].clientX;
		const diffY = touchStartY - e.touches[0].clientY;
		const dominantDiff = Math.abs(diffX) > Math.abs(diffY) ? diffX : diffY;

		if (Math.abs(dominantDiff) > 8) {
			const dir = dominantDiff > 0 ? 1 : -1;
			isMoving = true;
			isFacingBack = dir < 0;
			scrollPercent = Math.max(0, Math.min(100, scrollPercent + dir * 0.9));
			checkMilestoneTriggers();

			touchStartX = e.touches[0].clientX;
			touchStartY = e.touches[0].clientY;

			clearTimeout(moveStopTimeout);
			moveStopTimeout = setTimeout(() => {
				isMoving = false;
			}, 180);
		}
	}

	// Check if near landmarks
	let isNearMailbox = $derived(scrollPercent >= 8 && scrollPercent <= 22);
	let isNearCat = $derived(scrollPercent >= 20 && scrollPercent <= 30);
	let isNearParkInfo = $derived(scrollPercent >= 28 && scrollPercent <= 42);
	let isNearCrew = $derived(scrollPercent >= 48 && scrollPercent <= 62);
	let isNearGift = $derived(scrollPercent >= 63 && scrollPercent <= 76);
	let isNearCouple = $derived(scrollPercent >= 78 && scrollPercent <= 94);
	let isNearWish = $derived(scrollPercent >= 88);

	function checkMilestoneTriggers() {
		if (scrollPercent >= 85 && !questCouple) {
			questCouple = true;
		}
	}

	// Action button text when near an object
	let nearbyAction = $derived.by(() => {
		if (isNearMailbox) return { label: 'Buka Mailbox', action: () => openModal('mailbox') };
		if (isNearParkInfo) return { label: 'Lihat Papan Info', action: () => openModal('parkinfo') };
		if (isNearCrew) return { label: 'Tanya Crew', action: () => openModal('crew') };
		if (isNearGift) return { label: 'Kirim Hadiah', action: () => openModal('gift') };
		if (isNearCouple) return { label: 'Sapa Pengantin', action: () => openModal('couple') };
		if (isNearWish) return { label: 'Tulis Doa & Ucapan', action: () => openModal('wish') };
		return null;
	});

	// Keyboard controls
	function handleKeyDown(e) {
		if (!hasStarted || activeModal || viewMode !== 'game') return;
		if (e.code === 'ArrowRight' || e.code === 'KeyD') {
			startWalk(1);
		} else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
			startWalk(-1);
		} else if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') {
			if (nearbyAction) {
				e.preventDefault();
				nearbyAction.action();
			}
		}
	}

	function handleKeyUp(e) {
		if (['ArrowRight', 'KeyD', 'ArrowLeft', 'KeyA'].includes(e.code)) {
			stopWalk();
		}
	}

	function handleStartAdventure() {
		hasStarted = true;
		if (!playerName.trim()) playerName = guestName || 'Petualang';
		if (weddingData?.music?.enabled && audioElement && !isMusicPlaying) {
			audioElement.play().then(() => {
				isMusicPlaying = true;
			}).catch(() => {});
		}
		showToast(`Selamat datang di Pixel Game World, ${playerName}! 🎮`);
	}

	// Parallax transform calculations
	// landgame width = 6864, moves based on scrollPercent
	let terrainShift = $derived(`-${scrollPercent * 0.85}%`);
	let bgParallaxShift = $derived(`-${scrollPercent * 0.25}%`);
	let characterSlopeUp = $derived(scrollPercent > 43 && scrollPercent < 56);

	// Date strings
	let weddingDateStr = $derived.by(() => {
		const raw = weddingData?.acara?.resepsi?.tanggal || weddingData?.acara?.akad?.tanggal || '2027-06-19';
		const parts = raw.split('-');
		if (parts.length === 3) {
			return `${parts[2]} . ${parts[1]} . ${parts[0]}`;
		}
		return '19 . 06 . 2027';
	});

	onMount(() => {
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
	});

	onDestroy(() => {
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);
		if (moveInterval) clearInterval(moveInterval);
		if (audioElement) audioElement.pause();
	});
</script>

<!-- HIDDEN AUDIO ELEMENT -->
<audio
	bind:this={audioElement}
	src="/templates/pixel-game-world/bgm.mp3"
	loop
	preload="auto"
></audio>

<!-- TOAST ALERT -->
{#if toastVisible}
	<div class="pgw-toast" role="alert">
		<span>{toastMessage}</span>
	</div>
{/if}

<div
	class="pgw-root {isSimulator ? 'is-simulator-box' : ''} {viewMode === 'scroll' ? 'is-scroll-mode' : 'is-game-mode'}"
	bind:this={containerEl}
	onwheel={handleWheel}
	ontouchstart={handleTouchStart}
	ontouchmove={handleTouchMove}
>
	<!-- TOP RETRO BAR / HEADER -->
	<header class="pgw-top-bar">
		<div class="pgw-brand">
			<span class="pgw-gem">🎮</span>
			<span class="pgw-town-title">PIXEL GAME WORLD</span>
			<span class="pgw-badge-pill">2D PLATFORMER</span>
		</div>

		<div class="pgw-bar-actions">
			<!-- GENDER SWITCHER -->
			<button
				type="button"
				class="pgw-btn-gender"
				onclick={() => {
					isFemale = !isFemale;
					showToast(`Karakter diganti ke: ${isFemale ? '👧 Wanita' : '👦 Pria'}`);
				}}
				title="Ganti Karakter Pria / Wanita"
			>
				{isFemale ? '👧 Karakter: Putri' : '👦 Karakter: Pangeran'}
			</button>

			<!-- VIEW MODE SWITCHER -->
			<button
				type="button"
				class="pgw-btn-mode"
				onclick={() => {
					viewMode = viewMode === 'game' ? 'scroll' : 'game';
					showToast(`Beralih ke ${viewMode === 'game' ? '🎮 Mode Interaktif Game' : '📜 Mode Baca Undangan'}`);
				}}
			>
				{#if viewMode === 'game'}
					<i class="bi bi-file-text-fill me-1"></i> Mode Scroll
				{:else}
					<i class="bi bi-controller me-1"></i> Mode Game
				{/if}
			</button>

			<!-- BGM AUDIO TOGGLE -->
			<button
				type="button"
				class="pgw-btn-audio {isMusicPlaying ? 'is-playing' : ''}"
				onclick={toggleMusic}
				title={isMusicPlaying ? 'Matikan Musik' : 'Putar Musik'}
			>
				{#if isMusicPlaying}
					<span class="pgw-music-wave">🎵</span>
				{:else}
					<span class="pgw-music-muted">🔇</span>
				{/if}
			</button>
		</div>
	</header>

	<!-- ============================================== -->
	<!-- MODE 1: INTERACTIVE 2D PLATFORMER GAME WORLD   -->
	<!-- ============================================== -->
	{#if viewMode === 'game'}
		<div class="pgw-game-viewport">
			<!-- PARALLAX BACKGROUND (SKY, HILLS & CLOUDS) -->
			<div class="pgw-bg-parallax" style="transform: translateX({bgParallaxShift});">
				<img src="/templates/pixel-game-world/bg.png" alt="Langit Pixel" class="pgw-bg-img" />
			</div>

			<!-- MAIN TERRAIN LANDSCAPE (WIDE HILLY FIELD) -->
			<div class="pgw-landscape-track" style="transform: translateX({terrainShift});">
				<div class="pgw-terrain-wrap">
					<!-- Ground graphic -->
					<img src="/templates/pixel-game-world/landgame.png" alt="Arena Permainan" class="pgw-gameland-img" />

					<!-- INTERACTIVE OBJECTS POSITIONED ALONG THE TERRAIN -->

					<!-- 1. HOPPING CHICK (NEAR START) -->
					<div class="pgw-object pgw-chick">
						<img src="/templates/pixel-game-world/chick.png" alt="Anak Ayam" class="pgw-chick-img" />
					</div>

					<!-- 2. MAILBOX (15% OF WORLD) -->
					<div
						class="pgw-object pgw-mailbox {isNearMailbox ? 'is-active' : ''}"
						onclick={() => openModal('mailbox')}
					>
						<img src="/templates/pixel-game-world/dialog.png" alt="Buka" class="pgw-object-bubble {isNearMailbox ? 'is-visible' : ''}" />
						<img src="/templates/pixel-game-world/mailbox.png" alt="Kotak Surat" class="pgw-mailbox-img" />
					</div>

					<!-- 3. PURRING CAT (24% OF WORLD) -->
					<div class="pgw-object pgw-cat {isNearCat ? 'is-active' : ''}">
						<img src="/templates/pixel-game-world/cat_dialog.png" alt="Meow" class="pgw-object-bubble {isNearCat ? 'is-visible' : ''}" />
						<img src="/templates/pixel-game-world/cat.png" alt="Kucing Lucu" class="pgw-cat-img" />
					</div>

					<!-- 4. PARK NOTICE / PAPAN INFO (31.5% OF WORLD) -->
					<div
						class="pgw-object pgw-parknotice {isNearParkInfo ? 'is-active' : ''}"
						onclick={() => openModal('parkinfo')}
					>
						<img src="/templates/pixel-game-world/dialog.png" alt="Buka" class="pgw-object-bubble {isNearParkInfo ? 'is-visible' : ''}" />
						<img src="/templates/pixel-game-world/dove.gif" alt="Burung Merpati" class="pgw-dove-gif" />
						<img src="/templates/pixel-game-world/parkinfo.png" alt="Papan Informasi Acara" class="pgw-parkinfo-img" />
					</div>

					<!-- 5. WEDDING CREW / GUIDE (54% OF WORLD) -->
					<div
						class="pgw-object pgw-crew {isNearCrew ? 'is-active' : ''}"
						onclick={() => openModal('crew')}
					>
						<img src="/templates/pixel-game-world/crew-sign.png" alt="Crew Petunjuk" class="pgw-crew-sign {isNearCrew ? 'is-visible' : ''}" />
						<img src="/templates/pixel-game-world/crew.png" alt="Kru Pernikahan" class="pgw-crew-img" />
					</div>

					<!-- 6. GIFT CORNER (67% OF WORLD) -->
					<div
						class="pgw-object pgw-gift {isNearGift ? 'is-active' : ''}"
						onclick={() => openModal('gift')}
					>
						<img src="/templates/pixel-game-world/dialog.png" alt="Kado" class="pgw-object-bubble {isNearGift ? 'is-visible' : ''}" />
						<img src="/templates/pixel-game-world/gift.png" alt="Sudut Kado Hadiah" class="pgw-gift-img" />
					</div>

					<!-- 7. WEDDING SIGNPOST (76% OF WORLD) -->
					<div class="pgw-object pgw-wedding-sign">
						<div class="pgw-sign-text">
							<span>{weddingData?.mempelai?.pria?.namaPanggilan || 'Rama'}</span>
							<span>&</span>
							<span>{weddingData?.mempelai?.wanita?.namaPanggilan || 'Sari'}</span>
							<small>{weddingDateStr}</small>
						</div>
						<img src="/templates/pixel-game-world/wedding_sign.png" alt="Plang Pernikahan" class="pgw-sign-img" />
					</div>

					<!-- 8. BRIDE & GROOM COUPLE (83.5% OF WORLD) -->
					<div
						class="pgw-object pgw-couple {isNearCouple ? 'is-active' : ''}"
						onclick={() => openModal('couple')}
					>
						<div class="pgw-couple-bubble {isNearCouple ? 'is-visible' : ''}">
							Hi! thank you for coming ❤️
						</div>
						<img src="/templates/pixel-game-world/couple.png" alt="Pengantin Rama & Sari" class="pgw-couple-img" />
					</div>

					<!-- 9. FLOATING WISH LIST PREVIEWS (92% - 100% OF WORLD) -->
					<div
						class="pgw-object pgw-wish-list {isNearWish ? 'is-visible' : ''}"
						onclick={() => openModal('wish')}
					>
						<div class="pgw-wish-title">PAPAN DOA TAMU 💬</div>
						{#if weddingData?.rsvps?.length}
							{#each weddingData.rsvps.slice(0, 3) as w}
								<div class="pgw-wish-mini-card">
									<b>{w.nama}</b>
									<p>"{w.ucapan}"</p>
								</div>
							{/each}
						{:else}
							<div class="pgw-wish-mini-card">
								<b>Tamu Pertama</b>
								<p>"Semoga Rama & Sari langgeng bahagia selamanya!"</p>
							</div>
						{/if}
						<button type="button" class="pgw-btn-pixel-sm mt-1">KIRIM DOA & RSVP</button>
					</div>
				</div>
			</div>

			<!-- PLAYER AVATAR (FIXED HORIZONTALLY, ANIMATING WALK/STAND) -->
			<div
				class="pgw-character {isFemale ? 'is-female' : 'is-male'} {isMoving ? 'is-walking' : 'is-idle'} {isFacingBack ? 'is-back' : 'is-forward'} {characterSlopeUp ? 'is-slope-up' : ''}"
			>
				<div class="pgw-char-nametag">{playerName.slice(0, 10)}</div>
				{#if !isFemale}
					<img src="/templates/pixel-game-world/m_character.png" alt="Karakter Pria" class="pgw-char-sprite pgw-sprite-stand" />
					<img src="/templates/pixel-game-world/m_character_walkanimation.gif" alt="Karakter Berjalan" class="pgw-char-sprite pgw-sprite-walk" />
				{:else}
					<img src="/templates/pixel-game-world/character_female.png" alt="Karakter Wanita" class="pgw-char-sprite pgw-sprite-stand" />
					<img src="/templates/pixel-game-world/characterwalk_female.gif" alt="Karakter Berjalan" class="pgw-char-sprite pgw-sprite-walk" />
				{/if}
			</div>

			<!-- TOP TITLE & WEDDING NAMES OVERLAY -->
			<div class="pgw-title-banner {hasStarted ? 'is-mini-title' : 'is-hero-title'}">
				<p class="pgw-eyebrow-text">THE WEDDING OF</p>
				<h1 class="pgw-banner-names">
					<span>{weddingData?.mempelai?.pria?.namaPanggilan || 'Rama'}</span>
					<span class="pgw-love-icon"><img src="/templates/pixel-game-world/love.png" alt="Love" /></span>
					<span>{weddingData?.mempelai?.wanita?.namaPanggilan || 'Sari'}</span>
				</h1>
				<p class="pgw-date-text">{weddingDateStr}</p>
			</div>

			<!-- QUEST PROGRESS HUD (TOP LEFT) -->
			<div class="pgw-quest-hud {hasStarted ? 'is-visible' : ''}">
				<div class="pgw-quest-title">
					<span>MISI PERNIKAHAN</span>
					<span class="pgw-quest-count">{completedQuestsCount}/4</span>
				</div>
				<ul class="pgw-quest-list">
					<li class="pgw-quest-item {questMailbox ? 'is-done' : ''}" onclick={() => openModal('mailbox')}>
						<img src="/templates/pixel-game-world/warn-trp.png" alt="" class="pgw-quest-bullet" />
						<span>{questMailbox ? '✓' : '○'} Buka Mailbox</span>
					</li>
					<li class="pgw-quest-item {questParkInfo ? 'is-done' : ''}" onclick={() => openModal('parkinfo')}>
						<img src="/templates/pixel-game-world/warn-trp.png" alt="" class="pgw-quest-bullet" />
						<span>{questParkInfo ? '✓' : '○'} Lihat Papan Info</span>
					</li>
					<li class="pgw-quest-item {questCrew ? 'is-done' : ''}" onclick={() => openModal('crew')}>
						<img src="/templates/pixel-game-world/warn-trp.png" alt="" class="pgw-quest-bullet" />
						<span>{questCrew ? '✓' : '○'} Berbicara ke Crew</span>
					</li>
					<li class="pgw-quest-item {questCouple ? 'is-done' : ''}" onclick={() => openModal('couple')}>
						<img src="/templates/pixel-game-world/warn-trp.png" alt="" class="pgw-quest-bullet" />
						<span>{questCouple ? '✓' : '○'} Temui Pengantin</span>
					</li>
				</ul>
			</div>

			<!-- WORLD PROGRESS BAR (BOTTOM CENTER) -->
			<div class="pgw-progress-track">
				<div class="pgw-progress-fill" style="width: {scrollPercent}%;"></div>
				<span class="pgw-progress-text">{Math.round(scrollPercent)}% Menjelajah</span>
			</div>

			<!-- ACTION BUTTON (BOTTOM CENTER IF NEAR OBJECT) -->
			{#if nearbyAction}
				<div class="pgw-action-popup">
					<button type="button" class="pgw-btn-action-interact" onclick={nearbyAction.action}>
						<span class="pgw-action-badge">A</span>
						<span class="pgw-action-label">{nearbyAction.label}</span>
					</button>
				</div>
			{/if}

			<!-- ON-SCREEN ARROW CONTROLS (LEFT & RIGHT NAVIGATION) -->
			<div class="pgw-navigation-controls">
				<button
					type="button"
					class="pgw-arrow-btn pgw-arrow-left"
					onpointerdown={(e) => { e.preventDefault(); startWalk(-1); }}
					onpointerup={stopWalk}
					onpointercancel={stopWalk}
					onpointerleave={stopWalk}
					aria-label="Jalan ke Kiri"
				>
					<img src="/templates/pixel-game-world/arrow-left.png" alt="Kiri" />
				</button>

				<button
					type="button"
					class="pgw-arrow-btn pgw-arrow-right"
					onpointerdown={(e) => { e.preventDefault(); startWalk(1); }}
					onpointerup={stopWalk}
					onpointercancel={stopWalk}
					onpointerleave={stopWalk}
					aria-label="Jalan ke Kanan"
				>
					<img src="/templates/pixel-game-world/arrow-right.png" alt="Kanan" />
				</button>
			</div>

			<!-- DESKTOP KEYBOARD CONTROLS HINT -->
			<div class="pgw-desktop-hints">
				<span class="pgw-hint-chip">
					<kbd class="pgw-kbd">A / D</kbd> atau <kbd class="pgw-kbd">← →</kbd> Jalan
				</span>
				<span class="pgw-hint-chip">
					<kbd class="pgw-kbd">Scroll Wheel</kbd> Melangkah
				</span>
				<span class="pgw-hint-chip">
					<kbd class="pgw-kbd">Spasi</kbd> / <kbd class="pgw-kbd">E</kbd> Interaksi
				</span>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODE 2: CLASSIC SCROLLABLE RETRO INVITATION     -->
	<!-- ============================================== -->
	{#if viewMode === 'scroll'}
		<div class="pgw-scroll-container">
			<!-- HERO BANNER -->
			<section class="pgw-scroll-card pgw-hero-card">
				<span class="pgw-pixel-tag">PIXEL GAME WORLD WEDDING</span>
				<h1 class="pgw-scroll-title">
					{weddingData?.mempelai?.pria?.namaPanggilan || 'Rama'}
					<img src="/templates/pixel-game-world/love.png" alt="Love" class="pgw-love-inline" />
					{weddingData?.mempelai?.wanita?.namaPanggilan || 'Sari'}
				</h1>
				<p class="pgw-scroll-date">{weddingDateStr}</p>
				<p class="pgw-scroll-quote">
					"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang."
					<br /><small>(QS. Ar-Rum: 21)</small>
				</p>
				<button
					type="button"
					class="pgw-btn-pixel mt-3"
					onclick={() => {
						viewMode = 'game';
						showToast('Masuk ke mode petualangan platformer! 🎮');
					}}
				>
					<i class="bi bi-controller me-2"></i> JELAJAHI PETUALANGAN GAME
				</button>
			</section>

			<!-- BRIDE & GROOM PROFILE -->
			<section class="pgw-scroll-card">
				<div class="pgw-card-header">
					<span>Dua Mempelai Yang Berbahagia</span>
				</div>
				<div class="pgw-card-body pgw-couple-grid">
					<!-- GROOM -->
					<div class="pgw-person-box">
						<img
							src={weddingData?.mempelai?.pria?.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400'}
							alt="Mempelai Pria"
							class="pgw-person-img"
						/>
						<h3>{weddingData?.mempelai?.pria?.namaLengkap || 'Rama Pratama, S.Kom.'}</h3>
						<p>Putra tercinta dari {weddingData?.mempelai?.pria?.ayah || 'Bapak Pratama'} & {weddingData?.mempelai?.pria?.ibu || 'Ibu Ratih'}</p>
					</div>

					<div class="pgw-couple-mid-icon">
						<img src="/templates/pixel-game-world/love.png" alt="Love" />
					</div>

					<!-- BRIDE -->
					<div class="pgw-person-box">
						<img
							src={weddingData?.mempelai?.wanita?.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400'}
							alt="Mempelai Wanita"
							class="pgw-person-img"
						/>
						<h3>{weddingData?.mempelai?.wanita?.namaLengkap || 'Sari Dewi, S.Ds.'}</h3>
						<p>Putri tercinta dari {weddingData?.mempelai?.wanita?.ayah || 'Bapak Santoso'} & {weddingData?.mempelai?.wanita?.ibu || 'Ibu Wulandari'}</p>
					</div>
				</div>
			</section>

			<!-- EVENTS / SCHEDULE -->
			<section class="pgw-scroll-card">
				<div class="pgw-card-header">
					<span>Papan Info · Waktu & Tempat Acara</span>
				</div>
				<div class="pgw-card-body">
					<div class="pgw-events-grid">
						<div class="pgw-event-item">
							<h4 class="pgw-event-badge">AKAD NIKAH</h4>
							<p class="pgw-event-time">⏰ 08.00 - 10.00 WIB</p>
							<p class="pgw-event-loc">🏛️ {weddingData?.acara?.akad?.tempat || 'Masjid Agung Baiturrahman'}</p>
							<p class="pgw-event-addr">{weddingData?.acara?.akad?.alamat || 'Jl. Jenderal Sudirman No. 12'}</p>
						</div>

						<div class="pgw-event-item">
							<h4 class="pgw-event-badge">RESEPSI PERNIKAHAN</h4>
							<p class="pgw-event-time">⏰ 11.00 - 14.00 WIB</p>
							<p class="pgw-event-loc">🏛️ {weddingData?.acara?.resepsi?.tempat || 'Gedung Pertemuan Graha Kencana'}</p>
							<p class="pgw-event-addr">{weddingData?.acara?.resepsi?.alamat || 'Jl. Pemuda No. 45'}</p>
						</div>
					</div>

					<div class="text-center mt-3">
						<a href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer" class="pgw-btn-pixel">
							<i class="bi bi-calendar-event me-2"></i> SIMPAN KE KALENDER GOOGLE
						</a>
					</div>
				</div>
			</section>

			<!-- DIGITAL GIFT / AMPLOP -->
			<section class="pgw-scroll-card">
				<div class="pgw-card-header">
					<span>Kotak Hadiah & Amplop Digital</span>
				</div>
				<div class="pgw-card-body text-center">
					<p class="pgw-lead-text">
						Doa restu Anda merupakan karunia terindah bagi kami. Bagi keluarga dan sahabat yang ingin memberikan tanda kasih secara digital:
					</p>
					<div class="pgw-bank-box mt-3">
						<div class="pgw-bank-name">BANK CENTRAL ASIA (BCA)</div>
						<div class="pgw-bank-num">5210987654</div>
						<div class="pgw-bank-holder">a.n. RAMA PRATAMA</div>
						<button
							type="button"
							class="pgw-btn-copy mt-2"
							onclick={() => copyText('5210987654', 'Nomor Rekening BCA')}
						>
							SALIN NOMOR REKENING
						</button>
					</div>
				</div>
			</section>

			<!-- RSVP & WISHES -->
			<section class="pgw-scroll-card">
				<div class="pgw-card-header">
					<span>Papan Doa & Konfirmasi Kehadiran (RSVP)</span>
				</div>
				<div class="pgw-card-body">
					<form onsubmit={handleRsvpSubmit} class="pgw-rsvp-form">
						<div class="pgw-form-group">
							<label for="pgw-rsvp-name">NAMA ANDA</label>
							<input id="pgw-rsvp-name" type="text" bind:value={rsvpNama} required placeholder="Masukkan nama Anda..." />
						</div>

						<div class="pgw-form-group">
							<label for="pgw-rsvp-status">KEHADIRAN</label>
							<select id="pgw-rsvp-status" bind:value={rsvpKehadiran}>
								<option value="hadir">Iya, Saya Akan Hadir</option>
								<option value="tidak_hadir">Maaf, Belum Bisa Hadir</option>
							</select>
						</div>

						<div class="pgw-form-group">
							<label for="pgw-rsvp-wish">DOA & UCAPAN</label>
							<textarea id="pgw-rsvp-wish" rows="3" bind:value={rsvpUcapan} placeholder="Tuliskan ucapan selamat dan doa untuk mempelai..."></textarea>
						</div>

						<button type="submit" class="pgw-btn-pixel w-100">
							<i class="bi bi-send-fill me-1"></i> KIRIM DOA & KONFIRMASI
						</button>

						{#if rsvpSuccess}
							<div class="pgw-alert-success mt-2">
								✓ Terima kasih atas ucapan dan doa restunya!
							</div>
						{/if}
					</form>

					<!-- WISHES LIST -->
					<div class="pgw-wishes-list mt-4">
						<h4>DOA DARI SAHABAT & KELUARGA</h4>
						{#if weddingData?.rsvps?.length}
							{#each weddingData.rsvps as wish}
								<div class="pgw-wish-item">
									<div class="pgw-wish-header">
										<b>{wish.nama}</b>
										<span class="pgw-wish-status {wish.kehadiran === 'hadir' ? 'is-attending' : ''}">
											{wish.kehadiran === 'hadir' ? '✓ Hadir' : 'Berhalangan'}
										</span>
									</div>
									<p class="pgw-wish-text">{wish.ucapan}</p>
									<div class="pgw-wish-footer">
										<small>{wish.waktu || 'Baru saja'}</small>
										<button
											type="button"
											class="pgw-btn-like"
											onclick={() => handleLikeWish(wish.id)}
										>
											❤️ {(wishLikes[wish.id] || 0) > 0 ? wishLikes[wish.id] : ''}
										</button>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</section>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- WELCOME MODAL / CHARACTER SELECT (ON START)   -->
	<!-- ============================================== -->
	{#if !hasStarted}
		<div class="pgw-modal-scrim">
			<div class="pgw-dialog-wrap pgw-start-modal">
				<h2 class="pgw-modal-title">KAMU DIUNDANG, PETUALANG!</h2>
				<p class="pgw-lead-text">
					Selamat datang di <b>Pixel Game World</b>! Pilih tampilan karakter kamu untuk memulai petualangan pernikahan 2D ini:
				</p>

				<!-- CHOOSE CHARACTER GENDER -->
				<div class="pgw-gender-selector">
					<button
						type="button"
						class="pgw-gender-card {!isFemale ? 'is-selected' : ''}"
						onclick={() => (isFemale = false)}
					>
						<img src="/templates/pixel-game-world/m_character.png" alt="Pria" class="pgw-gender-sprite" />
						<span>Pangeran (Pria)</span>
					</button>

					<button
						type="button"
						class="pgw-gender-card {isFemale ? 'is-selected' : ''}"
						onclick={() => (isFemale = true)}
					>
						<img src="/templates/pixel-game-world/character_female.png" alt="Wanita" class="pgw-gender-sprite" />
						<span>Putri (Wanita)</span>
					</button>
				</div>

				<!-- ENTER GUEST NAME -->
				<div class="pgw-form-group mt-3 text-start">
					<label for="pgw-guest-input">NAMA TAMU PETUALANG:</label>
					<input
						id="pgw-guest-input"
						type="text"
						class="pgw-input-pixel"
						bind:value={playerName}
						maxlength="20"
						placeholder="Nama kamu..."
					/>
				</div>

				<button
					type="button"
					class="pgw-btn-pixel pgw-btn-pulse w-100 mt-3"
					onclick={handleStartAdventure}
				>
					MULAI PETUALANGAN (START) ⚔️
				</button>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODAL 1: MAILBOX / PARCHMENT LETTER SCROLL     -->
	<!-- ============================================== -->
	{#if activeModal === 'mailbox'}
		<div class="pgw-modal-scrim" onclick={closeModal}>
			<div class="pgw-mailbox-scroll-modal" onclick={(e) => e.stopPropagation()}>
				<img src="/templates/pixel-game-world/map_scroll.png" alt="Gulungan Kertas" class="pgw-scroll-bg-img" />
				<div class="pgw-scroll-content">
					<p class="pgw-scroll-dear">Kepada Yth. Bapak/Ibu/Saudara/i</p>
					<h3 class="pgw-scroll-guest">{playerName}</h3>
					<div class="pgw-scroll-divider"></div>
					<p class="pgw-scroll-quote">
						"Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya."
						<br /><small>(QS. Ar-Rum: 21)</small>
					</p>
					<p class="pgw-scroll-couple">
						{weddingData?.mempelai?.pria?.namaPanggilan || 'Rama'} & {weddingData?.mempelai?.wanita?.namaPanggilan || 'Sari'}
					</p>
					<p class="pgw-scroll-date-text">{weddingDateStr}</p>

					<button type="button" class="pgw-btn-pixel" onclick={closeModal}>
						OK, SAYA MENGERTI 👍
					</button>
				</div>
				<button type="button" class="pgw-close-btn" onclick={closeModal}>✕</button>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODAL 2: PAPAN INFO / RUNDOWN ACARA            -->
	<!-- ============================================== -->
	{#if activeModal === 'parkinfo'}
		<div class="pgw-modal-scrim" onclick={closeModal}>
			<div class="pgw-dialog-wrap pgw-info-modal" onclick={(e) => e.stopPropagation()}>
				<button type="button" class="pgw-close-btn" onclick={closeModal}>✕</button>
				<h3 class="pgw-modal-title">PAPAN INFORMASI ACARA</h3>
				<p class="pgw-lead-text">Detail waktu dan tempat pelaksanaan pernikahan kami:</p>

				<div class="pgw-modal-event-box">
					<div class="pgw-modal-badge">AKAD NIKAH</div>
					<p>📅 <b>Hari/Tanggal:</b> {weddingData?.acara?.akad?.tanggal || 'Sabtu, 19 Juni 2027'}</p>
					<p>⏰ <b>Waktu:</b> {weddingData?.acara?.akad?.waktuMulai || '08.00'} - Selesai</p>
					<p>🏛️ <b>Tempat:</b> {weddingData?.acara?.akad?.tempat || 'Masjid Agung Baiturrahman'}</p>
					<p>📍 <b>Alamat:</b> {weddingData?.acara?.akad?.alamat || 'Jl. Jenderal Sudirman No. 12'}</p>
				</div>

				<div class="pgw-modal-event-box mt-3">
					<div class="pgw-modal-badge">RESEPSI PERNIKAHAN</div>
					<p>📅 <b>Hari/Tanggal:</b> {weddingData?.acara?.resepsi?.tanggal || 'Sabtu, 19 Juni 2027'}</p>
					<p>⏰ <b>Waktu:</b> {weddingData?.acara?.resepsi?.waktuMulai || '11.00'} - {weddingData?.acara?.resepsi?.waktuSelesai || '14.00'}</p>
					<p>🏛️ <b>Tempat:</b> {weddingData?.acara?.resepsi?.tempat || 'Gedung Pertemuan Graha Kencana'}</p>
					<p>📍 <b>Alamat:</b> {weddingData?.acara?.resepsi?.alamat || 'Jl. Pemuda No. 45'}</p>
				</div>

				<div class="text-center mt-3">
					<a href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer" class="pgw-btn-pixel">
						SIMPAN KE KALENDER GOOGLE
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODAL 3: CREW GUIDE / WEDDING ORGANIZER        -->
	<!-- ============================================== -->
	{#if activeModal === 'crew'}
		<div class="pgw-modal-scrim" onclick={closeModal}>
			<div class="pgw-dialog-wrap pgw-crew-modal" onclick={(e) => e.stopPropagation()}>
				<button type="button" class="pgw-close-btn" onclick={closeModal}>✕</button>
				<div class="pgw-crew-header">
					<img src="/templates/pixel-game-world/crew.png" alt="Crew Avatar" class="pgw-crew-avatar-img" />
					<div>
						<h3 class="pgw-modal-title mb-1">PANDUAN DARI CREW</h3>
						<small>Wedding Organizer Guide & Information</small>
					</div>
				</div>

				<div class="pgw-crew-tips mt-3">
					<div class="pgw-tip-item">
						<span class="pgw-tip-icon">🚗</span>
						<div>
							<b>Lokasi & Area Parkir</b>
							<p>Tersedia kantong parkir luas dan aman di basement gedung dan halaman timur.</p>
						</div>
					</div>

					<div class="pgw-tip-item">
						<span class="pgw-tip-icon">👗</span>
						<div>
							<b>Dress Code Rekomendasi</b>
							<p>Nuansa warna Earthy, Sage, Cream, atau Batik Nusantara.</p>
						</div>
					</div>

					<div class="pgw-tip-item">
						<span class="pgw-tip-icon">📍</span>
						<div>
							<b>Peta Navigasi Lokasi</b>
							<p>Gunakan Google Maps untuk rute perjalanan tercepat menuju gedung.</p>
						</div>
					</div>
				</div>

				<div class="text-center mt-3">
					<a
						href="https://maps.google.com/?q={encodeURIComponent(weddingData?.acara?.resepsi?.tempat || 'Gedung Pertemuan Graha Kencana')}"
						target="_blank"
						rel="noreferrer"
						class="pgw-btn-pixel"
					>
						BUKA PETUNJUK GOOGLE MAPS
					</a>
				</div>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODAL 4: GIFT CORNER / AMPLOP DIGITAL          -->
	<!-- ============================================== -->
	{#if activeModal === 'gift'}
		<div class="pgw-modal-scrim" onclick={closeModal}>
			<div class="pgw-dialog-wrap pgw-gift-modal" onclick={(e) => e.stopPropagation()}>
				<button type="button" class="pgw-close-btn" onclick={closeModal}>✕</button>
				<h3 class="pgw-modal-title">SUDUT KADO & AMPLOP DIGITAL</h3>
				<p class="pgw-lead-text">
					Kehadiran dan doa restu Anda adalah hadiah terindah. Bagi yang ingin berbagi tanda kasih secara cashless:
				</p>

				<div class="pgw-bank-box mt-3">
					<div class="pgw-bank-name">BANK CENTRAL ASIA (BCA)</div>
					<div class="pgw-bank-num">5210987654</div>
					<div class="pgw-bank-holder">a.n. RAMA PRATAMA</div>
					<button
						type="button"
						class="pgw-btn-copy mt-2"
						onclick={() => copyText('5210987654', 'Nomor Rekening BCA')}
					>
						SALIN NOMOR REKENING
					</button>
				</div>

				<div class="pgw-bank-box mt-3">
					<div class="pgw-bank-name">BANK MANDIRI</div>
					<div class="pgw-bank-num">1370012345678</div>
					<div class="pgw-bank-holder">a.n. SARI DEWI</div>
					<button
						type="button"
						class="pgw-btn-copy mt-2"
						onclick={() => copyText('1370012345678', 'Nomor Rekening Mandiri')}
					>
						SALIN NOMOR REKENING
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODAL 5: PENGANTIN / COUPLE STAGE & STORY      -->
	<!-- ============================================== -->
	{#if activeModal === 'couple'}
		<div class="pgw-modal-scrim" onclick={closeModal}>
			<div class="pgw-dialog-wrap pgw-couple-modal" onclick={(e) => e.stopPropagation()}>
				<button type="button" class="pgw-close-btn" onclick={closeModal}>✕</button>
				<div class="text-center mb-3">
					<img src="/templates/pixel-game-world/couple.png" alt="Pengantin" class="pgw-modal-couple-img" />
					<h3 class="pgw-modal-title mt-2">SELAMAT DATANG DI PELAMINAN!</h3>
					<p class="pgw-lead-text">"Terima kasih sudah menempuh perjalanan hingga ke titik ini."</p>
				</div>

				<div class="pgw-couple-info-card">
					<h4>RAMA & SARI</h4>
					<p>Dua insan yang dipertemukan oleh takdir, dipersatukan oleh cinta, dan kini melangkah bersama menuju masa depan yang penuh berkah.</p>
				</div>

				<div class="text-center mt-3">
					<button
						type="button"
						class="pgw-btn-pixel"
						onclick={() => {
							closeModal();
							openModal('wish');
						}}
					>
						TITIP DOA & PESAN KESAN ✍️
					</button>
				</div>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODAL 6: WISH & RSVP BOARD                     -->
	<!-- ============================================== -->
	{#if activeModal === 'wish'}
		<div class="pgw-modal-scrim" onclick={closeModal}>
			<div class="pgw-dialog-wrap pgw-wish-modal" onclick={(e) => e.stopPropagation()}>
				<button type="button" class="pgw-close-btn" onclick={closeModal}>✕</button>
				<h3 class="pgw-modal-title">PAPAN DOA & BUKU TAMU</h3>
				<p class="pgw-lead-text">Tuliskan doa terbaikmu untuk mengabadikan momen ini:</p>

				<form onsubmit={handleRsvpSubmit} class="pgw-rsvp-form mt-3">
					<div class="pgw-form-group">
						<label for="pgw-modal-name">NAMA LENGKAP:</label>
						<input id="pgw-modal-name" type="text" bind:value={rsvpNama} required placeholder="Nama Anda..." />
					</div>

					<div class="pgw-form-group">
						<label for="pgw-modal-att">KONFIRMASI KEHADIRAN:</label>
						<select id="pgw-modal-att" bind:value={rsvpKehadiran}>
							<option value="hadir">Iya, Aku Hadir</option>
							<option value="tidak_hadir">Maaf, Belum Bisa Hadir</option>
						</select>
					</div>

					<div class="pgw-form-group">
						<label for="pgw-modal-wish">DOA / PESAN KESAN:</label>
						<textarea id="pgw-modal-wish" rows="3" bind:value={rsvpUcapan} placeholder="Tulis doa restu..."></textarea>
					</div>

					<button type="submit" class="pgw-btn-pixel w-100">
						KIRIM DOA & KONFIRMASI
					</button>
				</form>
			</div>
		</div>
	{/if}
</div>

<style>
	/* ROOT CONTAINER & LAYOUT */
	.pgw-root {
		width: 100%;
		flex: 1 1 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		background: #87b4e2;
		font-family: 'Space Mono', monospace, sans-serif;
		color: #2d2d2d;
		position: relative;
		overflow-x: hidden;
		user-select: none;
	}

	.pgw-root.is-game-mode {
		height: 100%;
		overflow: hidden;
	}

	.pgw-root.is-scroll-mode {
		display: block;
		height: auto;
		min-height: 100vh;
		overflow-y: auto;
		background: #dff0f7;
	}

	.is-simulator-box {
		min-height: 100%;
		height: 100%;
	}

	/* TOP RETRO BAR */
	.pgw-top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		background: #ffffff;
		border-bottom: 3px solid #2d2d2d;
		box-shadow: 0 4px 0 rgba(0, 0, 0, 0.15);
		position: sticky;
		top: 0;
		z-index: 50;
	}

	.pgw-brand {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pgw-gem {
		font-size: 1.2rem;
	}

	.pgw-town-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.75rem;
		color: #2d2d2d;
		font-weight: 700;
	}

	.pgw-badge-pill {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
		background: #6abc3a;
		color: #ffffff;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.pgw-bar-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.pgw-btn-gender,
	.pgw-btn-mode {
		background: #fdfde3;
		border: 2px solid #2d2d2d;
		color: #2d2d2d;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.58rem;
		padding: 6px 10px;
		border-radius: 4px;
		cursor: pointer;
		box-shadow: 2px 2px 0 #2d2d2d;
		transition: transform 0.1s;
	}

	.pgw-btn-gender:active,
	.pgw-btn-mode:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 #2d2d2d;
	}

	.pgw-btn-audio {
		background: #ffffff;
		border: 2px solid #2d2d2d;
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 0.95rem;
		box-shadow: 2px 2px 0 #2d2d2d;
	}

	.pgw-btn-audio.is-playing {
		animation: spinPulse 3s linear infinite;
	}

	@keyframes spinPulse {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* GAME VIEWPORT (FULLSCREEN & 2D SIDE-SCROLLER) */
	.pgw-game-viewport {
		position: relative;
		width: 100%;
		flex: 1 1 0;
		min-height: 0;
		height: 100%;
		background: #87b4e2;
		overflow: hidden;
	}

	/* PARALLAX SKY BACKGROUND */
	.pgw-bg-parallax {
		position: absolute;
		inset: 0;
		width: 140%;
		height: 100%;
		pointer-events: none;
		will-change: transform;
		transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
	}

	.pgw-bg-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		image-rendering: pixelated;
	}

	/* TERRAIN LANDSCAPE TRACK */
	.pgw-landscape-track {
		position: absolute;
		bottom: 0;
		left: 0;
		height: 100%;
		width: 6864px;
		display: flex;
		align-items: flex-end;
		will-change: transform;
		transition: transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94);
		pointer-events: auto;
	}

	.pgw-terrain-wrap {
		position: relative;
		width: 6864px;
		height: 100%;
		display: flex;
		align-items: flex-end;
	}

	.pgw-gameland-img {
		width: 6864px;
		height: auto;
		max-height: 82vh;
		display: block;
		image-rendering: pixelated;
		pointer-events: none;
	}

	/* INTERACTIVE OBJECTS POSITIONED ALONG THE LANDSCAPE */
	.pgw-object {
		position: absolute;
		cursor: pointer;
		touch-action: none;
		transition: transform 0.2s, filter 0.2s;
	}

	.pgw-object:hover {
		transform: scale(1.06);
	}

	.pgw-object.is-active img {
		filter: drop-shadow(0 0 8px rgba(255, 255, 180, 0.9)) drop-shadow(0 0 14px rgba(255, 230, 100, 0.6));
	}

	/* Chick */
	.pgw-chick {
		left: 4%;
		bottom: 12vh;
		animation: chickHop 4s infinite linear;
	}
	.pgw-chick-img {
		width: 42px;
		image-rendering: pixelated;
	}
	@keyframes chickHop {
		0%, 100% { transform: translateY(0) scaleX(1); }
		25% { transform: translateY(-12px) scaleX(1); }
		50% { transform: translateY(0) scaleX(-1); }
		75% { transform: translateY(-12px) scaleX(-1); }
	}

	/* Mailbox */
	.pgw-mailbox {
		left: 15%;
		bottom: 14vh;
	}
	.pgw-mailbox-img {
		width: 90px;
		image-rendering: pixelated;
	}

	/* Cat */
	.pgw-cat {
		left: 24%;
		bottom: 13vh;
		animation: catSway 5s infinite ease-in-out;
	}
	.pgw-cat-img {
		width: 75px;
		image-rendering: pixelated;
	}
	@keyframes catSway {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-6px); }
	}

	/* Park Notice */
	.pgw-parknotice {
		left: 32%;
		bottom: 14vh;
	}
	.pgw-parkinfo-img {
		width: 150px;
		image-rendering: pixelated;
	}
	.pgw-dove-gif {
		position: absolute;
		top: -24px;
		left: 20px;
		width: 38px;
		image-rendering: pixelated;
	}

	/* Crew */
	.pgw-crew {
		left: 54%;
		bottom: 14vh;
	}
	.pgw-crew-img {
		width: 85px;
		image-rendering: pixelated;
	}
	.pgw-crew-sign {
		position: absolute;
		top: -30px;
		left: -10px;
		width: 60px;
		opacity: 0;
		transition: opacity 0.3s;
	}
	.pgw-crew-sign.is-visible {
		opacity: 1;
	}

	/* Gift */
	.pgw-gift {
		left: 67%;
		bottom: 14vh;
	}
	.pgw-gift-img {
		width: 110px;
		image-rendering: pixelated;
	}

	/* Wedding Sign */
	.pgw-wedding-sign {
		left: 76%;
		bottom: 14vh;
		text-align: center;
	}
	.pgw-sign-img {
		width: 140px;
		image-rendering: pixelated;
	}
	.pgw-sign-text {
		position: absolute;
		top: 15px;
		width: 100%;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.55rem;
		line-height: 1.4;
		color: #2d2d2d;
	}
	.pgw-sign-text small {
		display: block;
		font-size: 0.45rem;
		margin-top: 2px;
	}

	/* Couple */
	.pgw-couple {
		left: 83.5%;
		bottom: 14vh;
		text-align: center;
	}
	.pgw-couple-img {
		width: 120px;
		image-rendering: pixelated;
	}
	.pgw-couple-bubble {
		position: absolute;
		top: -40px;
		left: 50%;
		transform: translateX(-50%);
		background: #ffffff;
		border: 2px solid #2d2d2d;
		box-shadow: 2px 2px 0 #2d2d2d;
		padding: 4px 8px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
		white-space: nowrap;
		opacity: 0;
		transition: opacity 0.3s;
	}
	.pgw-couple-bubble.is-visible {
		opacity: 1;
	}

	/* Wish Board on Ground */
	.pgw-wish-list {
		left: 92%;
		bottom: 14vh;
		background: rgba(255, 255, 255, 0.95);
		border: 3px solid #2d2d2d;
		box-shadow: 4px 4px 0 #2d2d2d;
		padding: 10px;
		border-radius: 6px;
		width: 220px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
	}
	.pgw-wish-title {
		font-size: 0.55rem;
		margin-bottom: 6px;
		color: #5a8d38;
	}
	.pgw-wish-mini-card {
		background: #fdfde3;
		border: 1px solid #2d2d2d;
		padding: 4px;
		margin-bottom: 4px;
		border-radius: 3px;
	}
	.pgw-wish-mini-card p {
		font-size: 0.45rem;
		margin: 2px 0 0 0;
		color: #444;
	}

	/* Generic Bubble */
	.pgw-object-bubble {
		position: absolute;
		top: -30px;
		left: 50%;
		transform: translateX(-50%);
		width: 44px;
		opacity: 0;
		transition: opacity 0.3s, transform 0.3s;
	}
	.pgw-object-bubble.is-visible {
		opacity: 1;
		transform: translateX(-50%) translateY(-6px);
	}

	/* PLAYER AVATAR (CENTERED HORIZONTALLY, WALKING) */
	.pgw-character {
		position: absolute;
		left: 38vw;
		bottom: 11vh;
		z-index: 20;
		pointer-events: none;
		transition: bottom 0.2s, transform 0.15s;
	}

	.pgw-character.is-slope-up {
		bottom: 14vh;
	}

	.pgw-character.is-forward img {
		transform: scaleX(1);
	}

	.pgw-character.is-back img {
		transform: scaleX(-1);
	}

	.pgw-char-nametag {
		position: absolute;
		top: -18px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(45, 45, 45, 0.85);
		color: #ffffff;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.48rem;
		padding: 2px 6px;
		border-radius: 4px;
		white-space: nowrap;
	}

	.pgw-char-sprite {
		width: 88px;
		height: auto;
		display: block;
		image-rendering: pixelated;
	}

	.pgw-sprite-stand {
		display: block;
	}
	.pgw-sprite-walk {
		display: none;
	}

	.pgw-character.is-walking .pgw-sprite-stand {
		display: none;
	}
	.pgw-character.is-walking .pgw-sprite-walk {
		display: block;
	}

	/* TITLE BANNER */
	.pgw-title-banner {
		position: absolute;
		top: 14px;
		left: 50%;
		transform: translateX(-50%);
		text-align: center;
		z-index: 30;
		pointer-events: none;
		transition: all 0.3s ease;
	}

	.pgw-title-banner.is-hero-title {
		top: 18%;
		transform: translateX(-50%) scale(1.15);
	}

	.pgw-eyebrow-text {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		color: #ffffff;
		text-shadow: 2px 2px 0 #2d2d2d;
		margin-bottom: 4px;
	}

	.pgw-banner-names {
		font-family: 'Press Start 2P', monospace;
		font-size: 1.15rem;
		color: #ffffff;
		text-shadow: 3px 3px 0 #2d2d2d;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		margin: 0;
	}

	.pgw-love-icon img {
		width: 32px;
		height: 32px;
		image-rendering: pixelated;
	}

	.pgw-date-text {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		color: #fdfde3;
		text-shadow: 2px 2px 0 #2d2d2d;
		margin-top: 4px;
	}

	/* QUEST HUD */
	.pgw-quest-hud {
		position: absolute;
		top: 20px;
		left: 20px;
		background: rgba(255, 255, 255, 0.94);
		border: 3px solid #2d2d2d;
		box-shadow: 4px 4px 0 #2d2d2d;
		padding: 10px 14px;
		border-radius: 6px;
		z-index: 30;
		max-width: 260px;
	}

	.pgw-quest-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.58rem;
		color: #2d2d2d;
		margin-bottom: 8px;
		border-bottom: 2px dashed #9c9151;
		padding-bottom: 4px;
	}

	.pgw-quest-count {
		background: #6abc3a;
		color: #fff;
		padding: 1px 5px;
		border-radius: 3px;
	}

	.pgw-quest-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.pgw-quest-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
		color: #444;
		line-height: 1.8;
		cursor: pointer;
		transition: color 0.15s;
	}

	.pgw-quest-item:hover {
		color: #000;
	}

	.pgw-quest-item.is-done {
		color: #2d7a22;
		text-decoration: line-through;
	}

	.pgw-quest-bullet {
		width: 12px;
		image-rendering: pixelated;
	}

	/* PROGRESS TRACK AT BOTTOM */
	.pgw-progress-track {
		position: absolute;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		width: min(320px, 80vw);
		height: 14px;
		background: #ffffff;
		border: 2px solid #2d2d2d;
		box-shadow: 2px 2px 0 #2d2d2d;
		border-radius: 7px;
		overflow: hidden;
		z-index: 30;
	}

	.pgw-progress-fill {
		height: 100%;
		background: #6abc3a;
		transition: width 0.2s linear;
	}

	.pgw-progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-family: 'Press Start 2P', monospace;
		font-size: 0.45rem;
		color: #2d2d2d;
		white-space: nowrap;
	}

	/* ACTION BUTTON OVERLAY */
	.pgw-action-popup {
		position: absolute;
		bottom: 42px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 35;
	}

	.pgw-btn-action-interact {
		background: #e0a63c;
		border: 3px solid #2d2d2d;
		box-shadow: 3px 3px 0 #2d2d2d;
		padding: 8px 16px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-family: 'Press Start 2P', monospace;
		animation: pulseBtn 1s infinite alternate;
	}

	@keyframes pulseBtn {
		from { transform: scale(1); }
		to { transform: scale(1.05); }
	}

	.pgw-action-badge {
		background: #b94448;
		color: #fff;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.65rem;
		font-weight: 700;
	}

	.pgw-action-label {
		font-size: 0.6rem;
		color: #2d2d2d;
	}

	/* NAVIGATION CONTROLS (ARROWS) */
	.pgw-navigation-controls {
		position: absolute;
		bottom: 24px;
		width: 100%;
		display: flex;
		justify-content: space-between;
		padding: 0 24px;
		pointer-events: none;
		z-index: 30;
	}

	.pgw-arrow-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		pointer-events: auto;
		transition: transform 0.1s, opacity 0.1s;
		opacity: 0.85;
	}

	.pgw-arrow-btn:active {
		transform: scale(0.92);
		opacity: 1;
	}

	.pgw-arrow-btn img {
		width: 68px;
		image-rendering: pixelated;
		filter: drop-shadow(2px 2px 0 rgba(0, 0, 0, 0.4));
	}

	/* DESKTOP HINTS */
	.pgw-desktop-hints {
		position: absolute;
		bottom: 18px;
		right: 20px;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(255, 255, 255, 0.9);
		border: 2px solid #2d2d2d;
		box-shadow: 2px 2px 0 #2d2d2d;
		padding: 6px 12px;
		border-radius: 6px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
		color: #2d2d2d;
		pointer-events: none;
		z-index: 25;
	}

	.pgw-hint-chip {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.pgw-kbd {
		background: #fdfde3;
		border: 1px solid #2d2d2d;
		border-radius: 3px;
		padding: 2px 4px;
		box-shadow: 1px 1px 0 #2d2d2d;
	}

	@media (max-width: 767px) {
		.pgw-desktop-hints {
			display: none;
		}
		.pgw-quest-hud {
			top: 14px;
			left: 12px;
			padding: 6px 8px;
			font-size: 0.45rem;
			max-width: 200px;
		}
		.pgw-arrow-btn img {
			width: 54px;
		}
	}

	/* MODALS AND POPUPS (PIXEL NES STYLE) */
	.pgw-modal-scrim {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		z-index: 100;
	}

	.pgw-dialog-wrap {
		background: #c9c9b0;
		border: 0;
		box-shadow:
			0 5px #000,
			0 -5px #000,
			5px 0 #000,
			-5px 0 #000,
			0 10px rgba(0, 0, 0, 0.25),
			5px 5px rgba(0, 0, 0, 0.25),
			-5px 5px rgba(0, 0, 0, 0.25),
			inset 0 5px hsla(0, 0%, 100%, 0.25);
		padding: 24px;
		position: relative;
		width: 100%;
		max-width: 520px;
		max-height: 85vh;
		overflow-y: auto;
		font-family: 'Press Start 2P', monospace;
		animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes popIn {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.pgw-close-btn {
		position: absolute;
		top: 12px;
		right: 12px;
		background: #b94448;
		color: #ffffff;
		border: 2px solid #000;
		box-shadow: 2px 2px 0 #000;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.75rem;
		font-weight: 700;
	}

	.pgw-modal-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.85rem;
		color: #2d2d2d;
		line-height: 1.4;
		margin-bottom: 8px;
	}

	.pgw-lead-text {
		font-size: 0.65rem;
		line-height: 1.6;
		color: #444;
		margin-bottom: 14px;
	}

	/* BUTTON PIXEL */
	.pgw-btn-pixel {
		color: #ffffff;
		background-color: #6abc3a;
		padding: 10px 24px;
		font-size: 0.65rem;
		font-family: 'Press Start 2P', monospace;
		border: 0;
		box-shadow:
			0 4px #000,
			0 -4px #000,
			4px 0 #000,
			-4px 0 #000,
			0 8px rgba(0, 0, 0, 0.25),
			4px 4px rgba(0, 0, 0, 0.25),
			-4px 4px rgba(0, 0, 0, 0.25),
			inset 0 4px hsla(0, 0%, 100%, 0.25);
		cursor: pointer;
		display: inline-block;
		text-decoration: none;
		transition: transform 0.1s;
	}

	.pgw-btn-pixel:active {
		transform: translateY(4px);
		box-shadow:
			0 4px #000,
			0 -4px #000,
			4px 0 #000,
			-4px 0 #000,
			inset 0 4px rgba(0, 0, 0, 0.25);
	}

	.pgw-btn-pixel-sm {
		color: #ffffff;
		background-color: #6abc3a;
		padding: 6px 12px;
		font-size: 0.48rem;
		font-family: 'Press Start 2P', monospace;
		border: 0;
		box-shadow: 2px 2px 0 #000;
		cursor: pointer;
	}

	.pgw-btn-copy {
		background: #5a8d38;
		color: #fff;
		border: 2px solid #000;
		box-shadow: 2px 2px 0 #000;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.58rem;
		padding: 8px 14px;
		cursor: pointer;
	}

	/* MAILBOX SCROLL MODAL */
	.pgw-mailbox-scroll-modal {
		position: relative;
		width: 100%;
		max-width: 480px;
		text-align: center;
		animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	.pgw-scroll-bg-img {
		width: 100%;
		height: auto;
		display: block;
	}

	.pgw-scroll-content {
		position: absolute;
		top: 14%;
		left: 14%;
		right: 14%;
		bottom: 12%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: 'Press Start 2P', monospace;
		padding: 10px;
	}

	.pgw-scroll-dear {
		font-size: 0.55rem;
		color: #645a38;
		margin-bottom: 4px;
	}

	.pgw-scroll-guest {
		font-size: 0.85rem;
		color: #b94448;
		margin-bottom: 8px;
	}

	.pgw-scroll-divider {
		width: 60%;
		height: 2px;
		background: #9c9151;
		margin-bottom: 8px;
	}

	.pgw-scroll-quote {
		font-size: 0.48rem;
		line-height: 1.5;
		color: #4a422a;
		margin-bottom: 8px;
	}

	.pgw-scroll-couple {
		font-size: 0.75rem;
		color: #2d2d2d;
		margin-bottom: 4px;
	}

	.pgw-scroll-date-text {
		font-size: 0.52rem;
		color: #645a38;
		margin-bottom: 12px;
	}

	/* GENDER SELECTOR IN START MODAL */
	.pgw-gender-selector {
		display: flex;
		gap: 12px;
		margin: 12px 0;
	}

	.pgw-gender-card {
		flex: 1;
		background: #ffffff;
		border: 3px solid #2d2d2d;
		box-shadow: 3px 3px 0 #2d2d2d;
		padding: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.55rem;
	}

	.pgw-gender-card.is-selected {
		background: #fdfde3;
		border-color: #6abc3a;
		box-shadow: 4px 4px 0 #6abc3a;
	}

	.pgw-gender-sprite {
		width: 48px;
		height: auto;
		image-rendering: pixelated;
	}

	.pgw-input-pixel {
		width: 100%;
		padding: 10px;
		background: #ffffff;
		border: 3px solid #2d2d2d;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		box-sizing: border-box;
	}

	/* EVENT BOX IN INFO MODAL */
	.pgw-modal-event-box {
		background: #ffffff;
		border: 2px solid #2d2d2d;
		box-shadow: 2px 2px 0 #2d2d2d;
		padding: 12px;
		text-align: left;
		font-size: 0.6rem;
		line-height: 1.6;
	}

	.pgw-modal-badge {
		background: #e0a63c;
		color: #2d2d2d;
		padding: 3px 6px;
		display: inline-block;
		margin-bottom: 6px;
		font-weight: 700;
	}

	/* CREW MODAL */
	.pgw-crew-header {
		display: flex;
		align-items: center;
		gap: 12px;
		text-align: left;
	}

	.pgw-crew-avatar-img {
		width: 60px;
		image-rendering: pixelated;
	}

	.pgw-crew-tips {
		display: flex;
		flex-direction: column;
		gap: 10px;
		text-align: left;
	}

	.pgw-tip-item {
		display: flex;
		gap: 10px;
		background: #ffffff;
		border: 2px solid #2d2d2d;
		padding: 8px;
		font-size: 0.58rem;
		line-height: 1.5;
	}

	.pgw-tip-icon {
		font-size: 1.2rem;
	}

	/* BANK BOX */
	.pgw-bank-box {
		background: #ffffff;
		border: 3px solid #2d2d2d;
		box-shadow: 3px 3px 0 #2d2d2d;
		padding: 14px;
		text-align: center;
	}

	.pgw-bank-name {
		font-size: 0.6rem;
		color: #666;
	}

	.pgw-bank-num {
		font-size: 1.05rem;
		color: #b94448;
		margin: 6px 0;
		letter-spacing: 1px;
	}

	.pgw-bank-holder {
		font-size: 0.6rem;
		color: #2d2d2d;
	}

	/* COUPLE MODAL */
	.pgw-modal-couple-img {
		width: 100px;
		image-rendering: pixelated;
	}

	.pgw-couple-info-card {
		background: #ffffff;
		border: 2px solid #2d2d2d;
		padding: 12px;
		font-size: 0.6rem;
		line-height: 1.6;
	}

	/* RSVP FORM IN MODAL */
	.pgw-rsvp-form {
		text-align: left;
	}

	.pgw-form-group {
		margin-bottom: 10px;
	}

	.pgw-form-group label {
		display: block;
		font-size: 0.55rem;
		margin-bottom: 4px;
	}

	.pgw-form-group input,
	.pgw-form-group select,
	.pgw-form-group textarea {
		width: 100%;
		padding: 8px;
		border: 2px solid #2d2d2d;
		font-family: inherit;
		font-size: 0.75rem;
		box-sizing: border-box;
		background: #ffffff;
	}

	.pgw-alert-success {
		background: #d4edda;
		color: #155724;
		border: 2px solid #c3e6cb;
		padding: 8px;
		font-size: 0.6rem;
		text-align: center;
	}

	/* SCROLL MODE INVITATION CARD STYLES */
	.pgw-scroll-container {
		max-width: 680px;
		margin: 0 auto;
		padding: 24px 16px 80px 16px;
	}

	.pgw-scroll-card {
		background: #ffffff;
		border: 4px solid #2d2d2d;
		box-shadow: 6px 6px 0 #2d2d2d;
		border-radius: 8px;
		margin-bottom: 24px;
		overflow: hidden;
	}

	.pgw-hero-card {
		padding: 32px 20px;
		text-align: center;
		background: #fdfde3;
	}

	.pgw-pixel-tag {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.55rem;
		background: #6abc3a;
		color: #ffffff;
		padding: 4px 8px;
		border-radius: 4px;
		display: inline-block;
		margin-bottom: 12px;
	}

	.pgw-scroll-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 1.3rem;
		line-height: 1.4;
		color: #2d2d2d;
		margin-bottom: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	.pgw-love-inline {
		width: 28px;
		height: 28px;
		image-rendering: pixelated;
	}

	.pgw-scroll-date {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.8rem;
		color: #b94448;
		margin-bottom: 14px;
	}

	.pgw-scroll-quote {
		font-size: 0.85rem;
		color: #555;
		line-height: 1.6;
		max-width: 520px;
		margin: 0 auto;
	}

	.pgw-card-header {
		background: #e0a63c;
		border-bottom: 3px solid #2d2d2d;
		padding: 10px 16px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		color: #2d2d2d;
		font-weight: 700;
	}

	.pgw-card-body {
		padding: 20px;
	}

	.pgw-couple-grid {
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 16px;
		flex-wrap: wrap;
	}

	.pgw-person-box {
		text-align: center;
		max-width: 220px;
	}

	.pgw-person-img {
		width: 130px;
		height: 130px;
		object-fit: cover;
		border: 3px solid #2d2d2d;
		box-shadow: 4px 4px 0 #2d2d2d;
		border-radius: 8px;
		margin-bottom: 10px;
	}

	.pgw-person-box h3 {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.72rem;
		color: #2d2d2d;
		margin-bottom: 6px;
	}

	.pgw-person-box p {
		font-size: 0.8rem;
		color: #666;
		line-height: 1.4;
	}

	.pgw-couple-mid-icon img {
		width: 36px;
		image-rendering: pixelated;
	}

	.pgw-events-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}

	@media (max-width: 560px) {
		.pgw-events-grid {
			grid-template-columns: 1fr;
		}
	}

	.pgw-event-item {
		background: #fdfde3;
		border: 2px solid #2d2d2d;
		padding: 14px;
		border-radius: 6px;
	}

	.pgw-event-badge {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.68rem;
		color: #b94448;
		margin-bottom: 8px;
	}

	.pgw-event-time, .pgw-event-loc {
		font-size: 0.85rem;
		margin-bottom: 4px;
	}

	.pgw-event-addr {
		font-size: 0.78rem;
		color: #666;
	}

	/* WISHES IN SCROLL MODE */
	.pgw-wishes-list h4 {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.68rem;
		color: #2d2d2d;
		margin-bottom: 12px;
	}

	.pgw-wish-item {
		background: #fdfde3;
		border: 2px solid #2d2d2d;
		padding: 10px 14px;
		border-radius: 6px;
		margin-bottom: 10px;
	}

	.pgw-wish-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		margin-bottom: 4px;
	}

	.pgw-wish-status {
		font-size: 0.7rem;
		color: #b94448;
	}

	.pgw-wish-status.is-attending {
		color: #28a745;
		font-weight: 700;
	}

	.pgw-wish-text {
		font-size: 0.85rem;
		color: #333;
		margin-bottom: 6px;
	}

	.pgw-wish-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: #666;
	}

	.pgw-btn-like {
		background: none;
		border: 1px solid #ccc;
		border-radius: 12px;
		padding: 2px 8px;
		cursor: pointer;
		font-size: 0.75rem;
	}

	/* TOAST */
	.pgw-toast {
		position: fixed;
		top: 64px;
		left: 50%;
		transform: translateX(-50%);
		background: #2d2d2d;
		color: #ffffff;
		border: 2px solid #e0a63c;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.62rem;
		padding: 10px 18px;
		border-radius: 6px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
		z-index: 200;
		animation: popIn 0.2s;
	}
</style>
