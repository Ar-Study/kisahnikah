<script>
	import { onMount, onDestroy } from 'svelte';
	import '../forever-town.css';

	/**
	 * @type {{
	 *   weddingData: any,
	 *   guestName?: string,
	 *   isSimulator?: boolean
	 * }}
	 */
	let { weddingData, guestName = 'Tamu Undangan', isSimulator = false } = $props();

	// View mode: 'game' (Interactive pixel world) | 'scroll' (Classic retro scrollable invitation)
	let viewMode = $state('game');

	// Canvas and Engine state
	let canvasEl = $state(null);
	let frameEl = $state(null);
	let sceneEl = $state(null);
	let dialogEl = $state(null);

	const CANVAS_WIDTH = 512;
	const CANVAS_HEIGHT = 384;
	const PLAYER_SPEED = 80; // px per second

	// Audio state
	let audioElement = $state(null);
	let isMusicPlaying = $state(false);

	// Character selection state
	let hasStarted = $state(false);
	let showCharSelectModal = $state(true);
	let playerName = $state(guestName || 'Tamu Undangan');
	let playerLook = $state(1); // 1 = guest-boy, 2 = guest-girl
	let playerBuddy = $state(1); // 1 = Daun, 4 = Kerikil, 7 = Bara

	// Toast state
	let toastMessage = $state('');
	let toastVisible = $state(false);

	function showToast(msg) {
		toastMessage = msg;
		toastVisible = true;
		setTimeout(() => {
			toastVisible = false;
		}, 3000);
	}

	// Active modal dialog / place
	// Values: null | 'places' | 'invitation' | 'couple' | 'story' | 'gallery' | 'cafe' | 'details' | 'gift' | 'rsvp' | 'battle'
	let activeModal = $state(null);
	let visitedPlaces = $state(new Set());
	let partyMonsters = $state([]); // Caught wild friends

	// Gallery lightbox state
	let galleryIndex = $state(0);
	let lightboxImage = $state(null);

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
		showToast('❤️ Terima kasih atas kiriman doanya!');
	}

	// Dynamic countdown timer
	let days = $state('00');
	let hours = $state('00');
	let minutes = $state('00');
	let seconds = $state('00');

	$effect(() => {
		const targetStr =
			weddingData?.acara?.resepsi?.tanggal || weddingData?.acara?.akad?.tanggal || '2027-06-19';
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

	// Town landmarks config
	const LANDMARKS = [
		{ id: 'invitation', object: 'pavilion', name: 'Pendopo', subtitle: 'Undangan kami', x: 256, y: 338, pinX: 256, pinY: 290, icon: '🏛️' },
		{ id: 'couple', object: 'couple', name: 'Pengantin', subtitle: 'Rama & Sari', x: 256, y: 204, pinX: 256, pinY: 160, icon: '💍' },
		{ id: 'story', object: 'home', name: 'Rumah kami', subtitle: 'Cerita kami', x: 104, y: 156, pinX: 104, pinY: 72, icon: '🏡' },
		{ id: 'gallery', object: 'tree', name: 'Pohon foto', subtitle: 'Kenangan kecil', x: 434, y: 111, pinX: 440, pinY: 40, icon: '🌳' },
		{ id: 'cafe', object: 'cafe', name: 'Kafe Kita', subtitle: 'Di sini semuanya mulai', x: 376, y: 156, pinX: 376, pinY: 72, icon: '☕' },
		{ id: 'details', object: 'garden', name: 'Taman bunga', subtitle: 'Tanggal & waktunya', x: 176, y: 288, pinX: 176, pinY: 200, icon: '🌸' },
		{ id: 'gift', object: 'gift', name: 'Sudut hadiah', subtitle: 'Kalau kamu mau', x: 386, y: 297, pinX: 386, pinY: 244, icon: '🎁' },
		{ id: 'rsvp', object: 'fountain', name: 'Air mancur', subtitle: 'Titip doa & RSVP', x: 256, y: 234, pinX: 256, pinY: 150, icon: '⛲' }
	];

	// Memories for Love Story
	const MEMORIES = [
		{ year: '2019', title: 'Halo pertama', story: 'Dua orang asing, satu kafe kecil, dan obrolan yang nggak ada yang mau tutup. Waktu itu kami belum tahu ini awal semuanya.' },
		{ year: '2021', title: 'Petualangan favorit', story: 'Ke mana aja, asal sama kamu. Entah sejak kapan, rumah berubah jadi satu orang.' },
		{ year: '2025', title: 'Satu "iya" yang penting', story: 'Pertanyaan kecil jadi janji paling besar. Seribu kali, iya.' }
	];

	// Gallery photos
	let galleryPhotos = $derived(
		weddingData?.galeri?.length
			? weddingData.galeri
			: [
					{ image: '/templates/forever-town/forever-town-desktop.webp', caption: 'Satu sudut. Satu awal.' },
					{ image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=700', caption: 'Ke mana aja, asal sama kamu.' },
					{ image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=700', caption: 'Tempat paling nyaman: bahumu.' },
					{ image: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=700', caption: 'Semua jalan ujungnya ke sini.' }
			  ]
	);

	// Battle System State
	let battleActive = $state(false);
	let battleText = $state('');
	let battleAwaiting = $state(false);
	let battleMenuOptions = $state([]);
	let battleRings = $state(3);
	let battleCakes = $state(2);
	let ringFlying = $state(false);

	let foeMonster = $state({
		name: 'Spriggle',
		level: 5,
		hp: 25,
		maxHp: 25,
		asset: 'monster1',
		sprite: '/templates/forever-town/monster1.png',
		anim: '',
		fainted: false
	});

	let playerBuddyMonster = $state({
		name: 'Daun',
		level: 5,
		hp: 30,
		maxHp: 30,
		asset: 'companion1',
		sprite: '/templates/forever-town/companion1.png',
		anim: '',
		fainted: false
	});

	let foeHpPercent = $derived(Math.max(0, foeMonster.hp / foeMonster.maxHp));
	let playerHpPercent = $derived(Math.max(0, playerBuddyMonster.hp / playerBuddyMonster.maxHp));

	// Player position & movement
	let player = {
		x: 256,
		y: 272,
		dir: 0, // 0 = down, 1 = left, 2 = right, 3 = up
		targetX: null,
		targetY: null
	};

	// Buddy trail position
	let buddyPos = { x: 240, y: 272 };
	let playerHistory = [{ x: 240, y: 272 }, { x: 256, y: 272 }];

	// Bride & Groom NPCs walking around the square
	let coupleNPCs = [
		{ n: 1, x: 256, y: 204, dir: 0, moving: true },
		{ n: 2, x: 276, y: 204, dir: 0, moving: true }
	];
	let coupleAngle = 0;

	// Wild monsters idling in grass
	let wildMonsters = [
		{ id: 'wild-1', name: 'Spriggle', x: 74, y: 110, asset: 'monster1', defeated: false, caught: false, phase: 0 },
		{ id: 'wild-2', name: 'Emberling', x: 440, y: 290, asset: 'monster2', defeated: false, caught: false, phase: 1.5 }
	];

	// Nearest interactable landmark
	let nearestTarget = $state(null);
	let actionPrompt = $derived.by(() => {
		if (!nearestTarget) return 'Buka Jurnal';
		if (nearestTarget.type === 'wild') return `Tanding lawan ${nearestTarget.name}`;
		if (nearestTarget.type === 'couple') return `Sapa Rama & Sari`;
		return `Lihat ${nearestTarget.name}`;
	});

	// Touch controls
	let touchJoystickActive = $state(false);
	let joystickDelta = { x: 0, y: 0 };
	let activeKeys = new Set();

	// Image assets dictionary
	let images = {};
	let isAssetsLoaded = $state(false);

	// Offscreen canvas for cached static terrain
	let bgCanvas = null;
	let animFrameId = null;
	let lastTime = 0;
	let globalTimer = 0;

	// Camera & Viewport tracking state
	let camera = { x: 0, y: 0, scale: 1 };

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

	// Google Calendar Generator
	function getGoogleCalendarUrl() {
		const groom = weddingData?.mempelai?.pria?.namaPanggilan || 'Rama';
		const bride = weddingData?.mempelai?.wanita?.namaPanggilan || 'Sari';
		const title = encodeURIComponent(`Pernikahan ${groom} & ${bride} (Forever Town)`);
		const details = encodeURIComponent(
			`Menghadiri pernikahan suci ${groom} & ${bride}. Lokasi: ${weddingData?.acara?.resepsi?.tempat || 'Taman Janji'}.`
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

	// Start game action from Character Select screen
	function handleStartAdventure() {
		if (!playerName.trim()) playerName = guestName || 'Petualang';
		hasStarted = true;
		showCharSelectModal = false;

		// Update companion info based on choice
		if (playerBuddy === 1) {
			playerBuddyMonster.name = 'Daun';
			playerBuddyMonster.asset = 'companion1';
			playerBuddyMonster.sprite = '/templates/forever-town/companion1.png';
		} else if (playerBuddy === 4) {
			playerBuddyMonster.name = 'Kerikil';
			playerBuddyMonster.asset = 'companion4';
			playerBuddyMonster.sprite = '/templates/forever-town/companion4.png';
		} else {
			playerBuddyMonster.name = 'Bara';
			playerBuddyMonster.asset = 'companion7';
			playerBuddyMonster.sprite = '/templates/forever-town/companion7.png';
		}

		// Play music if enabled
		if (weddingData?.music?.enabled && audioElement && !isMusicPlaying) {
			audioElement.play().then(() => {
				isMusicPlaying = true;
			}).catch(() => {});
		}

		showToast(`Selamat datang di Forever Town, ${playerName}! 🎮`);
	}

	// Open building modal
	function openPlaceModal(placeId) {
		visitedPlaces.add(placeId);
		activeModal = placeId;
		if (dialogEl) {
			try {
				dialogEl.showModal ? dialogEl.showModal() : (dialogEl.open = true);
			} catch (e) {}
		}
	}

	// Close modal
	function closeModal() {
		activeModal = null;
		if (dialogEl && dialogEl.open) {
			try {
				dialogEl.close();
			} catch (e) {}
		}
	}

	// Handle RSVP Submit
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
		showToast('Doa & konfirmasi RSVP berhasil dikirim ke Air Mancur!');
		setTimeout(() => {
			rsvpSuccess = false;
		}, 4000);
	}

	// Trigger wild battle
	function startBattle(monster) {
		foeMonster.name = monster.name;
		foeMonster.asset = monster.asset;
		foeMonster.sprite = `/templates/forever-town/monster${monster.asset === 'monster1' ? '1' : '2'}.png`;
		foeMonster.hp = foeMonster.maxHp;
		foeMonster.fainted = false;
		foeMonster.anim = 'ft-anim-enter-foe';

		playerBuddyMonster.hp = playerBuddyMonster.maxHp;
		playerBuddyMonster.fainted = false;
		playerBuddyMonster.anim = 'ft-anim-enter-you';

		battleActive = true;
		battleText = `${foeMonster.name} liar muncul dari semak-semak!`;
		battleAwaiting = false;

		setTimeout(() => {
			foeMonster.anim = '';
			playerBuddyMonster.anim = '';
			battleText = `Ayo ${playerBuddyMonster.name}! Tunjukkan jurus pernikahan terbaik kita!`;
			setBattleMainMenu();
		}, 1400);
	}

	function setBattleMainMenu() {
		battleMenuOptions = [
			{
				label: 'SERANG',
				note: 'Pilih jurus manis',
				run: showMovesMenu
			},
			{
				label: 'CINCIN',
				note: `${battleRings} cincin`,
				disabled: battleRings <= 0,
				run: throwRing
			},
			{
				label: 'TAS',
				note: `${battleCakes} kue`,
				disabled: battleCakes <= 0,
				run: useCake
			},
			{
				label: 'KABUR',
				note: 'Balik ke alun-alun',
				run: runFromBattle
			}
		];
	}

	function showMovesMenu() {
		battleText = 'Pilih jurus cinta kamu:';
		battleMenuOptions = [
			{
				label: 'PELUK SAYANG',
				note: 'Kekuatan 35 · Akurasi 98%',
				run: () => executeMove('Peluk Sayang', 35, '{a} memeluk {d} penuh kehangatan!')
			},
			{
				label: 'LEDAKAN KONFETI',
				note: 'Kekuatan 50 · Akurasi 90%',
				run: () => executeMove('Ledakan Konfeti', 50, '{a} menembakkan hujan konfeti berkilau ke {d}!')
			},
			{
				label: 'SINAR JANJI',
				note: 'Kekuatan 70 · Akurasi 80%',
				run: () => executeMove('Sinar Janji', 70, '{a} memancarkan kilau janji suci ke {d}!')
			},
			{
				label: '← KEMBALI',
				note: '',
				run: setBattleMainMenu
			}
		];
	}

	async function executeMove(name, power, msg) {
		battleMenuOptions = [];
		playerBuddyMonster.anim = 'ft-anim-lunge-you';
		battleText = `${playerBuddyMonster.name} memakai ${name}!`;

		setTimeout(() => {
			playerBuddyMonster.anim = '';
			foeMonster.anim = 'ft-anim-hurt';
			foeMonster.hp = Math.max(0, foeMonster.hp - power);

			battleText = msg
				.replace('{a}', playerBuddyMonster.name)
				.replace('{d}', foeMonster.name);

			setTimeout(() => {
				foeMonster.anim = '';
				if (foeMonster.hp <= 0) {
					foeMonster.fainted = true;
					foeMonster.anim = 'ft-anim-faint';
					battleText = `${foeMonster.name} pingsan sambil tersenyum bahagia!`;
					partyMonsters = [...partyMonsters, { name: foeMonster.name, asset: foeMonster.asset }];
					setTimeout(() => {
						battleText = `${foeMonster.name} dadah-dadah dan siap nyari kursi paling enak di nikahan! 🎉`;
						battleMenuOptions = [
							{
								label: 'BALIK KE KOTA',
								note: 'Lanjut petualangan',
								run: closeBattle
							}
						];
					}, 1200);
				} else {
					// Foe counterattack
					setTimeout(() => {
						foeMonster.anim = 'ft-anim-lunge-foe';
						battleText = `${foeMonster.name} membalas dengan Lempar Kelopak Bunga!`;
						setTimeout(() => {
							foeMonster.anim = '';
							playerBuddyMonster.anim = 'ft-anim-hurt';
							playerBuddyMonster.hp = Math.max(1, playerBuddyMonster.hp - 15);
							setTimeout(() => {
								playerBuddyMonster.anim = '';
								setBattleMainMenu();
							}, 600);
						}, 600);
					}, 900);
				}
			}, 900);
		}, 600);
	}

	function throwRing() {
		if (battleRings <= 0) return;
		battleRings--;
		battleMenuOptions = [];
		ringFlying = true;
		battleText = `Kamu melempar Cincin Kawin ke arah ${foeMonster.name}!`;

		setTimeout(() => {
			ringFlying = false;
			foeMonster.anim = 'ft-anim-ring-throw';
			setTimeout(() => {
				foeMonster.anim = '';
				foeMonster.fainted = true;
				partyMonsters = [...partyMonsters, { name: foeMonster.name, asset: foeMonster.asset }];
				battleText = `DAPAT! ✨ ${foeMonster.name} resmi bergabung ke rombongan undangan nikahan!`;
				battleMenuOptions = [
					{
						label: 'BALIK KE KOTA',
						note: 'Lanjut jelajah',
						run: closeBattle
					}
				];
			}, 1400);
		}, 700);
	}

	function useCake() {
		if (battleCakes <= 0) return;
		battleCakes--;
		battleMenuOptions = [];
		playerBuddyMonster.hp = playerBuddyMonster.maxHp;
		battleText = `${playerBuddyMonster.name} makan sepotong Kue Pengantin! HP pulih maksimal! 🍰`;
		setTimeout(() => {
			setBattleMainMenu();
		}, 1200);
	}

	function runFromBattle() {
		battleMenuOptions = [];
		battleText = 'Berhasil kabur kembali ke alun-alun kota!';
		setTimeout(() => {
			closeBattle();
		}, 800);
	}

	function closeBattle() {
		battleActive = false;
	}

	// Action button click (interact with nearest target or open places)
	function handleActionButton() {
		if (!nearestTarget) {
			openPlaceModal('places');
			return;
		}
		if (nearestTarget.type === 'wild') {
			startBattle(nearestTarget);
		} else if (nearestTarget.type === 'couple') {
			openPlaceModal('couple');
		} else {
			openPlaceModal(nearestTarget.id);
		}
	}

	// Canvas Terrain builder
	function buildTerrainCanvas(tilesImg) {
		const bg = document.createElement('canvas');
		bg.width = CANVAS_WIDTH;
		bg.height = CANVAS_HEIGHT;
		const ctx = bg.getContext('2d');
		ctx.imageSmoothingEnabled = false;

		// 1. Fill ground tiles (grass / stone path)
		for (let y = 0; y < CANVAS_HEIGHT; y += 16) {
			for (let x = 0; x < CANVAS_WIDTH; x += 16) {
				const isPath =
					(x >= 224 && x < 288) ||
					(y >= 144 && y < 176) ||
					(y >= 288 && y < 320) ||
					(x >= 96 && x < 128 && y >= 128 && y < 320) ||
					(x >= 368 && x < 400 && y >= 128 && y < 320);
				// source tile: (16,0) for stone, (0,0) for grass
				ctx.drawImage(tilesImg, isPath ? 16 : 0, 0, 16, 16, x, y, 16, 16);
			}
		}

		// 2. Outer border hedges
		for (let x = 0; x <= 480; x += 32) {
			ctx.drawImage(tilesImg, 0, 304, 32, 48, x, 0, 32, 48);
			ctx.drawImage(tilesImg, 0, 304, 32, 48, x, 336, 32, 48);
		}
		for (let y = 32; y < 336; y += 32) {
			ctx.drawImage(tilesImg, 0, 304, 32, 48, 0, y, 32, 48);
			ctx.drawImage(tilesImg, 0, 304, 32, 48, 480, y, 32, 48);
		}

		// 3. Buildings: Home (left), Cafe (right), Pavilion (bottom center)
		ctx.drawImage(tilesImg, 480, 144, 80, 80, 64, 64, 80, 80); // House
		ctx.drawImage(tilesImg, 480, 256, 80, 80, 336, 64, 80, 80); // Cafe
		ctx.drawImage(tilesImg, 432, 112, 48, 48, 232, 286, 48, 48); // Pavilion
		ctx.drawImage(tilesImg, 16, 352, 32, 48, 416, 24, 48, 72); // Memory Tree

		// 4. Little decorative trees & flower patches
		const trees = [[40, 150], [176, 50], [224, 45], [445, 145], [36, 246], [176, 300], [312, 304]];
		for (const [tx, ty] of trees) {
			ctx.drawImage(tilesImg, 16, 352, 32, 48, tx, ty, 32, 48);
		}

		return bg;
	}

	// Collision checking
	function checkCollision(x, y) {
		// Arena bounds
		if (x < 36 || x > 476 || y < 52 || y > 336) return true;

		// House hitbox
		if (x >= 64 && x <= 144 && y >= 70 && y <= 144) return true;
		// Cafe hitbox
		if (x >= 336 && x <= 416 && y >= 70 && y <= 144) return true;
		// Fountain hitbox (center)
		if (x >= 232 && x <= 280 && y >= 168 && y <= 216) return true;
		// Pavilion hitbox
		if (x >= 232 && x <= 280 && y >= 290 && y <= 334) return true;

		return false;
	}

	// Raycast walk
	function canWalkTo(fromX, fromY, toX, toY) {
		const steps = Math.max(1, Math.ceil(Math.hypot(toX - fromX, toY - fromY) / 4));
		for (let i = 1; i <= steps; i++) {
			const px = fromX + ((toX - fromX) * i) / steps;
			const py = fromY + ((toY - fromY) * i) / steps;
			if (checkCollision(px, py)) return false;
		}
		return true;
	}

	// Camera calculation and follow
	function updateCamera() {
		if (!frameEl || !sceneEl) return;
		const frameW = frameEl.clientWidth;
		const frameH = frameEl.clientHeight;
		if (!frameW || !frameH) return;

		// Responsive Zoom matching Galleryou Forever Town:
		// On mobile portrait (width < 760px): zoom in 2.8x so characters, buildings, and ground look big, clear, and nostalgic!
		// On desktop screens: fit nicely and scale to cover full width and height with no black bars
		const isMobile = frameW < 760;
		const scale = Math.max(
			frameW / CANVAS_WIDTH,
			frameH / CANVAS_HEIGHT,
			isMobile ? 2.8 : 1.4
		);
		camera.scale = scale;

		const scaledW = CANVAS_WIDTH * camera.scale;
		const scaledH = CANVAS_HEIGHT * camera.scale;
		const targetX = hasStarted ? player.x : 256;
		const targetY = hasStarted ? player.y : 224;

		// Center camera on player with bounded edges
		const camX = Math.max(frameW - scaledW, Math.min(0, frameW / 2 - targetX * camera.scale));
		const camY = Math.max(frameH - scaledH, Math.min(0, frameH * 0.54 - targetY * camera.scale));

		camera.x = Math.round(camX);
		camera.y = Math.round(camY);

		sceneEl.style.transform = `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})`;
	}

	// Tap to move
	function handleCanvasClick(e) {
		if (showCharSelectModal || battleActive || activeModal) return;
		if (!frameEl) return;
		const rect = frameEl.getBoundingClientRect();
		const clickScreenX = e.clientX - rect.left;
		const clickScreenY = e.clientY - rect.top;

		// Map screen coordinate to 512x384 world coordinate
		const worldX = (clickScreenX - camera.x) / camera.scale;
		const worldY = (clickScreenY - camera.y) / camera.scale;

		// Clicked on a landmark pin?
		for (const lm of LANDMARKS) {
			if (Math.hypot(lm.pinX - worldX, lm.pinY - worldY) < 30) {
				openPlaceModal(lm.id);
				return;
			}
		}

		// Move towards click
		player.targetX = Math.round(Math.max(36, Math.min(476, worldX)));
		player.targetY = Math.round(Math.max(52, Math.min(336, worldY)));
	}

	// Keyboard controls
	function handleKeyDown(e) {
		if (showCharSelectModal || battleActive || activeModal) return;
		if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
			activeKeys.add(e.code);
			player.targetX = null;
			player.targetY = null;
		}
		if (e.code === 'Space' || e.code === 'KeyZ') {
			e.preventDefault();
			handleActionButton();
		}
	}

	function handleKeyUp(e) {
		activeKeys.delete(e.code);
	}

	// Main Game Loop
	function gameLoop(time) {
		if (!lastTime) lastTime = time;
		const dt = Math.min((time - lastTime) / 1000, 0.05);
		lastTime = time;
		globalTimer += dt;

		update(dt);
		render();

		animFrameId = requestAnimationFrame(gameLoop);
	}

	function update(dt) {
		if (!hasStarted || battleActive || activeModal) {
			updateCamera();
			return;
		}

		let dx = 0;
		let dy = 0;

		// Check joystick delta
		if (touchJoystickActive) {
			dx = joystickDelta.x;
			dy = joystickDelta.y;
		}

		// Check keyboard
		if (activeKeys.has('ArrowLeft') || activeKeys.has('KeyA')) dx -= 1;
		if (activeKeys.has('ArrowRight') || activeKeys.has('KeyD')) dx += 1;
		if (activeKeys.has('ArrowUp') || activeKeys.has('KeyW')) dy -= 1;
		if (activeKeys.has('ArrowDown') || activeKeys.has('KeyS')) dy += 1;

		// Check tap-to-move target
		if (player.targetX !== null && player.targetY !== null) {
			const dist = Math.hypot(player.targetX - player.x, player.targetY - player.y);
			if (dist < 4) {
				player.targetX = null;
				player.targetY = null;
			} else {
				dx = (player.targetX - player.x) / dist;
				dy = (player.targetY - player.y) / dist;
			}
		}

		// Normalize vector
		const length = Math.hypot(dx, dy);
		let isMoving = false;
		if (length > 0.1) {
			isMoving = true;
			const ndx = (dx / length) * PLAYER_SPEED * dt;
			const ndy = (dy / length) * PLAYER_SPEED * dt;

			// Set direction: 0 = down, 1 = left, 2 = right, 3 = up
			if (Math.abs(dy) > Math.abs(dx)) {
				player.dir = dy < 0 ? 3 : 0;
			} else {
				player.dir = dx < 0 ? 1 : 2;
			}

			// Apply with collision
			const newX = player.x + ndx;
			const newY = player.y + ndy;

			if (!checkCollision(newX, player.y)) player.x = newX;
			if (!checkCollision(player.x, newY)) player.y = newY;

			// Update buddy trail history
			const lastPos = playerHistory[playerHistory.length - 1];
			if (Math.hypot(player.x - lastPos.x, player.y - lastPos.y) > 4) {
				playerHistory.push({ x: player.x, y: player.y });
				if (playerHistory.length > 15) playerHistory.shift();
				const followPoint = playerHistory[0];
				buddyPos.x = followPoint.x;
				buddyPos.y = followPoint.y;
			}
		}

		// Update couple NPCs walking in square
		coupleAngle += dt * 0.4;
		coupleNPCs[0].x = 256 + Math.cos(coupleAngle) * 50;
		coupleNPCs[0].y = 204 + Math.sin(coupleAngle) * 36;
		coupleNPCs[1].x = 256 + Math.cos(coupleAngle - 0.4) * 50;
		coupleNPCs[1].y = 204 + Math.sin(coupleAngle - 0.4) * 36;

		// Detect nearest interactable
		let closest = null;
		let closestDist = 48; // interaction radius

		for (const lm of LANDMARKS) {
			const d = Math.hypot(lm.x - player.x, lm.y - player.y);
			if (d < closestDist) {
				closestDist = d;
				closest = { type: 'landmark', ...lm };
			}
		}

		// Check couple
		const coupleDist = Math.hypot(coupleNPCs[0].x - player.x, coupleNPCs[0].y - player.y);
		if (coupleDist < closestDist) {
			closestDist = coupleDist;
			closest = { type: 'couple', name: 'Rama & Sari' };
		}

		// Check wild monsters
		for (const mon of wildMonsters) {
			if (mon.defeated || mon.caught) continue;
			const md = Math.hypot(mon.x - player.x, mon.y - player.y);
			if (md < closestDist) {
				closestDist = md;
				closest = { type: 'wild', ...mon };
			}
		}

		nearestTarget = closest;
		updateCamera();
	}

	function render() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		ctx.imageSmoothingEnabled = false;

		// 1. Draw cached background
		if (bgCanvas) {
			ctx.drawImage(bgCanvas, 0, 0);
		} else {
			ctx.fillStyle = '#43634e';
			ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		}

		// 2. Animated water fountain in center (232, 168, 48, 48)
		if (images.tiles) {
			ctx.drawImage(images.tiles, 0, 160, 48, 48, 232, 168, 48, 48);
			// Fountain sparkles
			const sparkleFrame = Math.floor(globalTimer * 6) % 3;
			ctx.fillStyle = sparkleFrame === 0 ? '#b8e2f2' : sparkleFrame === 1 ? '#ffffff' : '#7ec8e3';
			ctx.fillRect(254, 180 + sparkleFrame * 2, 4, 4);
			ctx.fillRect(250 + (sparkleFrame % 2) * 8, 186, 3, 3);
		}

		// 3. Hanging memory frames on photo tree
		if (images.memory2 && images.tiles) {
			const sway = Math.sin(globalTimer * 2) * 2;
			ctx.save();
			ctx.translate(434, 48);
			ctx.drawImage(images.memory2, 0, 0, images.memory2.width, images.memory2.height, sway, 0, 14, 16);
			ctx.restore();
		}

		// 4. Wild monsters in grass (bobbing)
		for (const mon of wildMonsters) {
			if (mon.defeated || mon.caught) continue;
			const monImg = images[mon.asset];
			if (monImg) {
				const hop = Math.abs(Math.sin(globalTimer * 3 + mon.phase)) * 4;
				ctx.drawImage(monImg, 0, 0, monImg.width, monImg.height, mon.x - 16, mon.y - 20 - hop, 32, 32);
			}
		}

		// 5. Bride & Groom NPCs
		const groomImg = images['trainer1'];
		const brideImg = images['trainer2'];
		if (groomImg && brideImg) {
			const frame = Math.floor(globalTimer * 5) % 4;
			// 32x32 sprite frame
			ctx.drawImage(groomImg, frame * 32, 0, 32, 32, coupleNPCs[0].x - 16, coupleNPCs[0].y - 28, 32, 32);
			ctx.drawImage(brideImg, frame * 32, 0, 32, 32, coupleNPCs[1].x - 16, coupleNPCs[1].y - 28, 32, 32);
		}

		// 6. Buddy / Companion sprite
		const buddyImg = images[`companion${playerBuddy}`];
		if (buddyImg) {
			const buddyBob = Math.sin(globalTimer * 4) * 2;
			ctx.drawImage(buddyImg, 0, 0, buddyImg.width, buddyImg.height, buddyPos.x - 12, buddyPos.y - 18 + buddyBob, 24, 24);
		}

		// 7. Player Character sprite
		const playerSpriteName = playerLook === 1 ? 'guest-boy' : 'guest-girl';
		const playerImg = images[playerSpriteName];
		if (playerImg) {
			const isMoving = activeKeys.size > 0 || touchJoystickActive || player.targetX !== null;
			const walkFrame = isMoving ? Math.floor(globalTimer * 6) % 4 : 0;
			// Frame: 32x32 grid: x = walkFrame * 32, y = player.dir * 32
			ctx.drawImage(playerImg, walkFrame * 32, player.dir * 32, 32, 32, player.x - 16, player.y - 28, 32, 32);
		}

		// 8. Player name tag
		ctx.fillStyle = 'rgba(34, 64, 75, 0.85)';
		ctx.fillRect(player.x - 28, player.y - 42, 56, 12);
		ctx.fillStyle = '#ffffff';
		ctx.font = '8px "Press Start 2P", monospace';
		ctx.textAlign = 'center';
		ctx.fillText((playerName || 'Tamu').slice(0, 8), player.x, player.y - 33);
	}

	// Preload all assets
	async function loadAllAssets() {
		const assetList = [
			{ key: 'tiles', src: '/templates/forever-town/tileset.png' },
			{ key: 'guest-boy', src: '/templates/forever-town/guest-boy.png' },
			{ key: 'guest-girl', src: '/templates/forever-town/guest-girl.png' },
			{ key: 'companion1', src: '/templates/forever-town/companion1.png' },
			{ key: 'companion4', src: '/templates/forever-town/companion4.png' },
			{ key: 'companion7', src: '/templates/forever-town/companion7.png' },
			{ key: 'trainer1', src: '/templates/forever-town/trainer1.png' },
			{ key: 'trainer2', src: '/templates/forever-town/trainer2.png' },
			{ key: 'couple-javanese', src: '/templates/forever-town/couple-javanese.png' },
			{ key: 'couple-hijab', src: '/templates/forever-town/couple-hijab.png' },
			{ key: 'monster1', src: '/templates/forever-town/monster1.png' },
			{ key: 'monster2', src: '/templates/forever-town/monster2.png' },
			{ key: 'memory2', src: '/templates/forever-town/memory2.png' },
			{ key: 'memory3', src: '/templates/forever-town/memory3.png' }
		];

		await Promise.all(
			assetList.map(
				(item) =>
					new Promise((resolve) => {
						const img = new Image();
						img.onload = () => {
							images[item.key] = img;
							resolve();
						};
						img.onerror = () => {
							console.warn('Failed loading asset:', item.src);
							resolve();
						};
						img.src = item.src;
					})
			)
		);

		if (images.tiles) {
			bgCanvas = buildTerrainCanvas(images.tiles);
		}

		isAssetsLoaded = true;
	}

	let resizeObserver = null;

	onMount(async () => {
		await loadAllAssets();
		window.addEventListener('keydown', handleKeyDown);
		window.addEventListener('keyup', handleKeyUp);
		window.addEventListener('resize', updateCamera);

		if (frameEl && typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(() => {
				updateCamera();
			});
			resizeObserver.observe(frameEl);
		}

		updateCamera();
		animFrameId = requestAnimationFrame(gameLoop);
	});

	onDestroy(() => {
		if (animFrameId) cancelAnimationFrame(animFrameId);
		window.removeEventListener('keydown', handleKeyDown);
		window.removeEventListener('keyup', handleKeyUp);
		window.removeEventListener('resize', updateCamera);
		if (resizeObserver) resizeObserver.disconnect();
		if (audioElement) {
			audioElement.pause();
		}
	});
</script>

<!-- HIDDEN AUDIO ELEMENT -->
<audio
	bind:this={audioElement}
	src={weddingData?.music?.url || 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=romantic-wedding-piano-10065.mp3'}
	loop
	preload="auto"
></audio>

<!-- TOAST ALERT -->
{#if toastVisible}
	<div class="ft-toast" role="alert">
		<span>{toastMessage}</span>
	</div>
{/if}

<div class="ft-root {isSimulator ? 'is-simulator-box' : ''} {viewMode === 'scroll' ? 'is-scroll-mode' : 'is-game-mode'}">
	<!-- TOP RETRO BAR / HEADER -->
	<header class="ft-top-bar">
		<div class="ft-brand">
			<span class="ft-gem">💍</span>
			<span class="ft-town-title">FOREVER TOWN</span>
			<span class="ft-badge-pill">16-BIT WEDDING</span>
		</div>

		<div class="ft-bar-actions">
			<!-- VIEW MODE SWITCHER -->
			<button
				type="button"
				class="ft-btn-mode"
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
				class="ft-btn-audio {isMusicPlaying ? 'is-playing' : ''}"
				onclick={toggleMusic}
				title={isMusicPlaying ? 'Matikan Musik' : 'Putar Musik'}
			>
				{#if isMusicPlaying}
					<span class="ft-music-wave">🎵</span>
				{:else}
					<span class="ft-music-muted">🔇</span>
				{/if}
			</button>
		</div>
	</header>

	<!-- ============================================== -->
	<!-- MODE 1: INTERACTIVE RETRO PIXEL GAME WORLD     -->
	<!-- ============================================== -->
	{#if viewMode === 'game'}
		<div class="ft-game-viewport">
			<!-- MAIN TOWN CANVAS SCENE (FULLSCREEN VIEWPORT) -->
			<div class="ft-frame" bind:this={frameEl} onclick={handleCanvasClick}>
				<div class="ft-scene" bind:this={sceneEl}>
					<canvas
						bind:this={canvasEl}
						class="ft-canvas"
						width={CANVAS_WIDTH}
						height={CANVAS_HEIGHT}
					></canvas>

					<!-- INTERACTIVE OVERLAY PINS (INSIDE SCENE SO THEY SCALE NATURALLY) -->
					{#each LANDMARKS as lm}
						<button
							type="button"
							class="ft-map-pin {visitedPlaces.has(lm.id) ? 'is-visited' : ''}"
							style="left: {(lm.pinX / CANVAS_WIDTH) * 100}%; top: {(lm.pinY / CANVAS_HEIGHT) * 100}%;"
							onclick={(e) => {
								e.stopPropagation();
								openPlaceModal(lm.id);
							}}
						>
							<span class="ft-pin-bubble">
								<span class="ft-pin-icon">{lm.icon}</span>
								<span class="ft-pin-text">{lm.name}</span>
							</span>
							<span class="ft-pin-arrow"></span>
						</button>
					{/each}
				</div>
			</div>

			<!-- FLOATING JOURNAL BUTTON (CENTER BOTTOM) -->
			<div class="ft-journal-center">
				<button
					type="button"
					class="ft-btn-journal"
					onclick={() => openPlaceModal('places')}
				>
					<span class="ft-journal-icon">📜</span>
					<span class="ft-journal-label">JURNAL</span>
				</button>
			</div>

			<!-- ACTION / INTERACT BUTTON (BOTTOM RIGHT) -->
			<div class="ft-hud-overlay">
				<button
					type="button"
					class="ft-btn-action"
					onclick={handleActionButton}
				>
					<span class="ft-action-key">A</span>
					<span class="ft-action-text">{actionPrompt}</span>
				</button>
			</div>

			<!-- TOUCH CONTROLS (D-PAD) FOR MOBILE (BOTTOM LEFT) -->
			<div class="ft-dpad-container">
				<button
					type="button"
					class="ft-dpad-btn ft-dpad-up"
					onpointerdown={() => { activeKeys.add('ArrowUp'); }}
					onpointerup={() => { activeKeys.delete('ArrowUp'); }}
					onpointercancel={() => { activeKeys.delete('ArrowUp'); }}
					onpointerleave={() => { activeKeys.delete('ArrowUp'); }}
				>▲</button>
				<div class="ft-dpad-row">
					<button
						type="button"
						class="ft-dpad-btn ft-dpad-left"
						onpointerdown={() => { activeKeys.add('ArrowLeft'); }}
						onpointerup={() => { activeKeys.delete('ArrowLeft'); }}
						onpointercancel={() => { activeKeys.delete('ArrowLeft'); }}
						onpointerleave={() => { activeKeys.delete('ArrowLeft'); }}
					>◀</button>
					<div class="ft-dpad-center"></div>
					<button
						type="button"
						class="ft-dpad-btn ft-dpad-right"
						onpointerdown={() => { activeKeys.add('ArrowRight'); }}
						onpointerup={() => { activeKeys.delete('ArrowRight'); }}
						onpointercancel={() => { activeKeys.delete('ArrowRight'); }}
						onpointerleave={() => { activeKeys.delete('ArrowRight'); }}
					>▶</button>
				</div>
				<button
					type="button"
					class="ft-dpad-btn ft-dpad-down"
					onpointerdown={() => { activeKeys.add('ArrowDown'); }}
					onpointerup={() => { activeKeys.delete('ArrowDown'); }}
					onpointercancel={() => { activeKeys.delete('ArrowDown'); }}
					onpointerleave={() => { activeKeys.delete('ArrowDown'); }}
				>▼</button>
			</div>

			<!-- DESKTOP KEYBOARD CONTROLS HINT (BOTTOM LEFT ON DESKTOP) -->
			<div class="ft-desktop-hints">
				<span class="ft-hint-chip">
					<kbd class="ft-kbd">WASD</kbd> / <kbd class="ft-kbd">Panah</kbd> Jalan
				</span>
				<span class="ft-hint-chip">
					<kbd class="ft-kbd">Spasi</kbd> / <kbd class="ft-kbd">Z</kbd> Aksi
				</span>
				<span class="ft-hint-chip">
					<span class="ft-hint-icon">🖱️</span> Klik Peta
				</span>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODE 2: CLASSIC SCROLLABLE RETRO INVITATION     -->
	<!-- ============================================== -->
	{#if viewMode === 'scroll'}
		<div class="ft-scroll-container">
			<!-- HERO BANNER -->
			<section class="ft-scroll-hero">
				<div class="ft-hero-inner">
					<div class="ft-pixel-badge">UNDANGAN PERNIKAHAN 16-BIT</div>
					<h1 class="ft-scroll-names">
						{weddingData?.mempelai?.pria?.namaPanggilan || 'Rama'} & {weddingData?.mempelai?.wanita?.namaPanggilan || 'Sari'}
					</h1>
					<p class="ft-scroll-date">
						{weddingData?.acara?.resepsi?.tanggal || 'Sabtu, 19 Juni 2027'} · {weddingData?.acara?.resepsi?.tempat || 'Taman Janji, Ubud, Bali'}
					</p>

					<!-- PIXEL COUNTDOWN -->
					<div class="ft-scroll-countdown">
						<div class="ft-cd-box"><b>{days}</b><span>HARI</span></div>
						<div class="ft-cd-box"><b>{hours}</b><span>JAM</span></div>
						<div class="ft-cd-box"><b>{minutes}</b><span>MENIT</span></div>
						<div class="ft-cd-box"><b>{seconds}</b><span>DETIK</span></div>
					</div>

					<button
						type="button"
						class="ft-btn-primary mt-3"
						onclick={() => {
							viewMode = 'game';
							showToast('Masuk ke mode petualangan game! 🎮');
						}}
					>
						<i class="bi bi-controller me-2"></i> JELAJAHI KOTA FOREVER TOWN
					</button>
				</div>
			</section>

			<!-- BRIDE & GROOM PROFILE -->
			<section class="ft-scroll-section">
				<div class="ft-dialog-card">
					<div class="ft-card-header">
						<span>KETEMU · DUA MEMPELAI</span>
					</div>
					<div class="ft-card-body ft-couple-row">
						<!-- GROOM -->
						<div class="ft-person-card">
							<img
								src={weddingData?.mempelai?.pria?.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400'}
								alt="Mempelai Pria"
								class="ft-person-img"
							/>
							<h3 class="ft-person-name">{weddingData?.mempelai?.pria?.namaLengkap || 'I Made Rama Pratama, S.T.'}</h3>
							<p class="ft-person-desc">
								Putra dari {weddingData?.mempelai?.pria?.ayah || 'Bapak I Nyoman Pratama'} & {weddingData?.mempelai?.pria?.ibu || 'Ibu Ni Ketut Ratih'}
							</p>
							{#if weddingData?.mempelai?.pria?.instagram}
								<a href="https://instagram.com/{weddingData.mempelai.pria.instagram}" target="_blank" rel="noreferrer" class="ft-ig-link">
									<i class="bi bi-instagram me-1"></i> @{weddingData.mempelai.pria.instagram}
								</a>
							{/if}
						</div>

						<div class="ft-couple-heart">❤️</div>

						<!-- BRIDE -->
						<div class="ft-person-card">
							<img
								src={weddingData?.mempelai?.wanita?.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400'}
								alt="Mempelai Wanita"
								class="ft-person-img"
							/>
							<h3 class="ft-person-name">{weddingData?.mempelai?.wanita?.namaLengkap || 'Ni Putu Sari Pradnyani, S.Kom.'}</h3>
							<p class="ft-person-desc">
								Putri dari {weddingData?.mempelai?.wanita?.ayah || 'Bapak I Wayan Pradnyana'} & {weddingData?.mempelai?.wanita?.ibu || 'Ibu Ni Made Purnami'}
							</p>
							{#if weddingData?.mempelai?.wanita?.instagram}
								<a href="https://instagram.com/{weddingData.mempelai.wanita.instagram}" target="_blank" rel="noreferrer" class="ft-ig-link">
									<i class="bi bi-instagram me-1"></i> @{weddingData.mempelai.wanita.instagram}
								</a>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- ACARA & RUNDOWN -->
			<section class="ft-scroll-section">
				<div class="ft-dialog-card">
					<div class="ft-card-header">
						<span>TAMAN BUNGA · AGENDA ACARA</span>
					</div>
					<div class="ft-card-body">
						<div class="ft-events-grid">
							<div class="ft-event-item">
								<h4>AKAD NIKAH</h4>
								<p class="ft-event-time">⏰ {weddingData?.acara?.akad?.waktuMulai || '08:00'} - {weddingData?.acara?.akad?.waktuSelesai || '10:00'} WITA</p>
								<p class="ft-event-loc">📍 {weddingData?.acara?.akad?.tempat || 'Pendopo Utama Taman Janji'}</p>
							</div>
							<div class="ft-event-item">
								<h4>RESEPSI NIKAH</h4>
								<p class="ft-event-time">⏰ {weddingData?.acara?.resepsi?.waktuMulai || '11:00'} - {weddingData?.acara?.resepsi?.waktuSelesai || '14:00'} WITA</p>
								<p class="ft-event-loc">📍 {weddingData?.acara?.resepsi?.tempat || 'Taman Janji, Ubud, Bali'}</p>
							</div>
						</div>

						<div class="ft-event-actions mt-3">
							<a href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer" class="ft-btn-primary">
								<i class="bi bi-calendar-check me-1"></i> SIMPAN KE GOOGLE KALENDER
							</a>
							{#if weddingData?.acara?.resepsi?.petaUrl}
								<a href={weddingData.acara.resepsi.petaUrl} target="_blank" rel="noreferrer" class="ft-btn-secondary ms-2">
									<i class="bi bi-geo-alt me-1"></i> BUKA DI GOOGLE MAPS
								</a>
							{/if}
						</div>
					</div>
				</div>
			</section>

			<!-- DIGITAL GIFT / ANGPAO -->
			<section class="ft-scroll-section">
				<div class="ft-dialog-card">
					<div class="ft-card-header">
						<span>SUDUT HADIAH · TANDA KASIH</span>
					</div>
					<div class="ft-card-body text-center">
						<p class="ft-lead-text">
							Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda ingin memberi hadiah tanda kasih, kami sediakan rekening berikut:
						</p>

						{#if weddingData?.amplopDigital?.penerima?.length}
							{#each weddingData.amplopDigital.penerima as acc}
								<div class="ft-bank-box">
									<div class="ft-bank-name">{acc.bank}</div>
									<div class="ft-bank-num">{acc.nomor}</div>
									<div class="ft-bank-holder">a.n. {acc.nama}</div>
									<button
										type="button"
										class="ft-btn-copy mt-2"
										onclick={() => copyText(acc.nomor, `Nomor Rekening ${acc.bank}`)}
									>
										<i class="bi bi-clipboard me-1"></i> SALIN NOMOR REKENING
									</button>
								</div>
							{/each}
						{:else}
							<div class="ft-bank-box">
								<div class="ft-bank-name">BANK CENTRAL ASIA (BCA)</div>
								<div class="ft-bank-num">1234567890</div>
								<div class="ft-bank-holder">a.n. RAMA & SARI</div>
								<button
									type="button"
									class="ft-btn-copy mt-2"
									onclick={() => copyText('1234567890', 'Nomor Rekening BCA')}
								>
									<i class="bi bi-clipboard me-1"></i> SALIN NOMOR REKENING
								</button>
							</div>
						{/if}
					</div>
				</div>
			</section>

			<!-- RSVP & WISHES -->
			<section class="ft-scroll-section">
				<div class="ft-dialog-card">
					<div class="ft-card-header">
						<span>AIR MANCUR · TITIP DOA & RSVP</span>
					</div>
					<div class="ft-card-body">
						<form onsubmit={handleRsvpSubmit} class="ft-rsvp-form">
							<div class="ft-form-group">
								<label for="ft-rsvp-name">NAMA LENGKAP</label>
								<input id="ft-rsvp-name" type="text" bind:value={rsvpNama} required placeholder="Masukkan nama Anda" />
							</div>

							<div class="ft-form-group">
								<label for="ft-rsvp-att">KEHADIRAN</label>
								<select id="ft-rsvp-att" bind:value={rsvpKehadiran}>
									<option value="hadir">Iya, Saya Akan Hadir</option>
									<option value="tidak_hadir">Maaf, Belum Bisa Hadir</option>
								</select>
							</div>

							<div class="ft-form-group">
								<label for="ft-rsvp-wish">DOA & UCAPAN</label>
								<textarea id="ft-rsvp-wish" rows="3" bind:value={rsvpUcapan} placeholder="Tuliskan doa terbaik untuk kedua mempelai..."></textarea>
							</div>

							<button type="submit" class="ft-btn-primary w-100">
								<i class="bi bi-send-fill me-1"></i> KIRIM DOA & KONFIRMASI
							</button>

							{#if rsvpSuccess}
								<div class="ft-alert-success mt-2">
									✓ Terima kasih atas doa & konfirmasi kehadiran Anda!
								</div>
							{/if}
						</form>

						<!-- WISHES LIST -->
						<div class="ft-wishes-list mt-4">
							<h4>DOA DARI PARA TAMU</h4>
							{#if weddingData?.rsvps?.length}
								{#each weddingData.rsvps as wish}
									<div class="ft-wish-item">
										<div class="ft-wish-header">
											<b>{wish.nama}</b>
											<span class="ft-wish-badge {wish.kehadiran === 'hadir' ? 'is-attending' : ''}">
												{wish.kehadiran === 'hadir' ? '✓ Hadir' : 'Berhalangan'}
											</span>
										</div>
										<p class="ft-wish-content">{wish.ucapan}</p>
										<div class="ft-wish-footer">
											<small>{wish.waktu || 'Baru saja'}</small>
											<button
												type="button"
												class="ft-btn-like"
												onclick={() => handleLikeWish(wish.id)}
											>
												❤️ {(wishLikes[wish.id] || 0) > 0 ? wishLikes[wish.id] : ''}
											</button>
										</div>
									</div>
								{/each}
							{:else}
								<p class="ft-empty-note">Jadilah yang pertama mengirimkan doa untuk Rama & Sari!</p>
							{/if}
						</div>
					</div>
				</div>
			</section>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- CHARACTER SELECTION / WELCOME MODAL            -->
	<!-- ============================================== -->
	{#if showCharSelectModal}
		<div class="ft-scrim">
			<div class="ft-window ft-charselect-modal">
				<div class="ft-window-header">
					<span>KAMU DIUNDANG, PETUALANG!</span>
				</div>
				<div class="ft-window-body">
					<p class="ft-lead-text">
						Ikut ke bab berikutnya yuk! Pilih tampilan dan satu teman jalan. Ada sebuah kota kecil pernikahan yang siap dijelajahi.
					</p>

					<!-- CHOOSE LOOK -->
					<div class="ft-pick-section">
						<label class="ft-pick-title">TAMPILAN KAMU</label>
						<div class="ft-pick-row">
							<button
								type="button"
								class="ft-pick-btn {playerLook === 1 ? 'is-selected' : ''}"
								onclick={() => (playerLook = 1)}
							>
								<div class="ft-sprite-preview" style="background-image: url('/templates/forever-town/guest-boy.png');"></div>
								<span>Trainer Pria</span>
							</button>

							<button
								type="button"
								class="ft-pick-btn {playerLook === 2 ? 'is-selected' : ''}"
								onclick={() => (playerLook = 2)}
							>
								<div class="ft-sprite-preview" style="background-image: url('/templates/forever-town/guest-girl.png');"></div>
								<span>Trainer Wanita</span>
							</button>
						</div>
					</div>

					<!-- CHOOSE COMPANION -->
					<div class="ft-pick-section mt-3">
						<label class="ft-pick-title">TEMAN JALAN KAMU</label>
						<div class="ft-pick-row">
							<button
								type="button"
								class="ft-pick-btn {playerBuddy === 1 ? 'is-selected' : ''}"
								onclick={() => (playerBuddy = 1)}
							>
								<img src="/templates/forever-town/companion1.png" alt="Daun" class="ft-buddy-img" />
								<span>Daun 🍃</span>
							</button>

							<button
								type="button"
								class="ft-pick-btn {playerBuddy === 4 ? 'is-selected' : ''}"
								onclick={() => (playerBuddy = 4)}
							>
								<img src="/templates/forever-town/companion4.png" alt="Kerikil" class="ft-buddy-img" />
								<span>Kerikil 🪨</span>
							</button>

							<button
								type="button"
								class="ft-pick-btn {playerBuddy === 7 ? 'is-selected' : ''}"
								onclick={() => (playerBuddy = 7)}
							>
								<img src="/templates/forever-town/companion7.png" alt="Bara" class="ft-buddy-img" />
								<span>Bara 🔥</span>
							</button>
						</div>
					</div>

					<!-- ENTER NAME -->
					<div class="ft-pick-section mt-3">
						<label for="ft-player-name-input" class="ft-pick-title">KAMI PANGGIL KAMU APA?</label>
						<input
							id="ft-player-name-input"
							type="text"
							class="ft-input-pixel"
							bind:value={playerName}
							maxlength="20"
							placeholder="Nama tamu..."
						/>
					</div>

					<!-- START BUTTONS -->
					<div class="ft-modal-actions mt-4">
						<button
							type="button"
							class="ft-btn-primary w-100"
							onclick={handleStartAdventure}
						>
							🎮 MULAI PETUALANGAN
						</button>
						<button
							type="button"
							class="ft-btn-plain mt-2"
							onclick={() => {
								hasStarted = true;
								showCharSelectModal = false;
								viewMode = 'scroll';
							}}
						>
							📜 Buka Mode Baca Undangan Langsung
						</button>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- MODAL DIALOG POPUP (`ft-window ft-dialog`)     -->
	<!-- ============================================== -->
	{#if activeModal}
		<div class="ft-scrim" onclick={closeModal}>
			<div
				class="ft-window ft-dialog"
				onclick={(e) => e.stopPropagation()}
			>
				<div class="ft-window-header">
					<span>FOREVER TOWN · {activeModal.toUpperCase()}</span>
					<button type="button" class="ft-close" onclick={closeModal}>✕</button>
				</div>

				<div class="ft-window-body">
					<!-- PLACES JURNAL -->
					{#if activeModal === 'places'}
						<p class="ft-eyebrow">JURNAL PETUALANGAN KAMU</p>
						<h2 class="ft-dialog-title">Halo, {playerName || 'Petualang'}.</h2>
						<p class="ft-lead-text">
							Rama & Sari lagi jalan-jalan di alun-alun kota. Samperin atau tap pin di peta buat nyapa dan buka tiap bagian pernikahan!
						</p>

						<div class="ft-progress-badge">
							{visitedPlaces.size} / 8 tempat sudah dikunjungi
						</div>

						<div class="ft-places-list mt-3">
							{#each LANDMARKS as lm}
								<button
									type="button"
									class="ft-place-btn"
									onclick={() => openPlaceModal(lm.id)}
								>
									<span>{lm.icon} {lm.name} ({lm.subtitle})</span>
									<span class="ft-arrow">{visitedPlaces.has(lm.id) ? '✓' : '→'}</span>
								</button>
							{/each}
						</div>

						{#if partyMonsters.length}
							<div class="ft-party-section mt-3">
								<p class="ft-pick-title">ROMBONGAN KAMU ({partyMonsters.length})</p>
								<div class="ft-party-icons">
									{#each partyMonsters as p}
										<div class="ft-party-tag">
											<img src="/templates/forever-town/{p.asset}.png" alt={p.name} />
											<span>{p.name}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<button
							type="button"
							class="ft-btn-plain mt-3"
							onclick={() => {
								closeModal();
								showCharSelectModal = true;
							}}
						>
							↺ Ganti Karakter / Teman Jalan
						</button>

					<!-- PENDOPO (UNDANGAN) -->
					{:else if activeModal === 'invitation'}
						<p class="ft-eyebrow">PENDOPO · UNDANGAN KAMI</p>
						<h2 class="ft-dialog-title">Petualangan baru. Cinta yang selamanya.</h2>
						<p class="ft-lead-text">
							Bareng keluarga kami, kamu kami undang buat mulai petualangan paling besar kami.
						</p>
						<div class="ft-summary-box">
							<p>📅 <b>{weddingData?.acara?.resepsi?.tanggal || 'Sabtu, 19 Juni 2027'}</b></p>
							<p>📍 <b>{weddingData?.acara?.resepsi?.tempat || 'Taman Janji · Ubud, Bali'}</b></p>
						</div>
						<div class="ft-dialog-buttons mt-3">
							<button type="button" class="ft-btn-primary" onclick={() => openPlaceModal('rsvp')}>
								IKUT PESTA KAMI? · RSVP
							</button>
							<a href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer" class="ft-btn-secondary ms-2">
								SIMPAN KE KALENDER
							</a>
						</div>

					<!-- COUPLE (MEMPELAI) -->
					{:else if activeModal === 'couple'}
						<p class="ft-eyebrow">KETEMU · DUA PENGANTIN</p>
						<h2 class="ft-dialog-title">Hai, kenalin! Kami yang mau nikah.</h2>
						<div class="ft-couple-dialog-wrap">
							<div class="ft-couple-dialog-person">
								<img src={weddingData?.mempelai?.pria?.foto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400'} alt="Groom" />
								<h4>{weddingData?.mempelai?.pria?.namaLengkap || 'I Made Rama Pratama'}</h4>
								<p>Putra dari {weddingData?.mempelai?.pria?.ayah || 'Bpk. I Nyoman Pratama'} & {weddingData?.mempelai?.pria?.ibu || 'Ibu Ni Ketut Ratih'}</p>
							</div>
							<div class="ft-couple-dialog-person">
								<img src={weddingData?.mempelai?.wanita?.foto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400'} alt="Bride" />
								<h4>{weddingData?.mempelai?.wanita?.namaLengkap || 'Ni Putu Sari Pradnyani'}</h4>
								<p>Putri dari {weddingData?.mempelai?.wanita?.ayah || 'Bpk. I Wayan Pradnyana'} & {weddingData?.mempelai?.wanita?.ibu || 'Ibu Ni Made Purnami'}</p>
							</div>
						</div>
						<p class="ft-dialog-note mt-3">
							"Seneng banget kamu nemu kami di sini. Jalan-jalan dulu, titip doa, terus ikut ke bab berikutnya bareng kami ya!"
						</p>

					<!-- RUMAH KAMI (STORY) -->
					{:else if activeModal === 'story'}
						<p class="ft-eyebrow">RUMAH KAMI · CERITA KAMI</p>
						<h2 class="ft-dialog-title">Semua petualangan mulai dari satu halo.</h2>
						<div class="ft-timeline-list mt-3">
							{#each MEMORIES as m}
								<div class="ft-timeline-node">
									<span class="ft-year-pill">{m.year}</span>
									<h4>{m.title}</h4>
									<p>{m.story}</p>
								</div>
							{/each}
						</div>

					<!-- POHON FOTO (GALLERY) -->
					{:else if activeModal === 'gallery'}
						<p class="ft-eyebrow">POHON FOTO · KENANGAN KECIL</p>
						<h2 class="ft-dialog-title">Hal-hal kecil yang kami simpan.</h2>
						<p class="ft-lead-text">Tiga bab petualangan kami, digantung satu-satu di pohon.</p>
						<div class="ft-gallery-grid mt-3">
							{#each galleryPhotos as photo, idx}
								<div class="ft-photo-card" onclick={() => (lightboxImage = photo.image)}>
									<img src={photo.image} alt={photo.caption || 'Foto Pernikahan'} />
									{#if photo.caption}
										<span>{photo.caption}</span>
									{/if}
								</div>
							{/each}
						</div>

					<!-- KAFE KITA -->
					{:else if activeModal === 'cafe'}
						<p class="ft-eyebrow">KAFE KITA · DI SINI SEMUANYA MULAI</p>
						<h2 class="ft-dialog-title">Ngopi lagi, yuk?</h2>
						<p class="ft-lead-text">
							2019. Dua cangkir kopi. Satu awal. Dua orang asing, satu kafe kecil, dan obrolan yang nggak ada yang mau tutup.
						</p>
						<img src="/templates/forever-town/forever-town-desktop.webp" alt="Kafe Kita" class="ft-cafe-hero mt-2" />
						<button type="button" class="ft-btn-primary mt-3" onclick={() => openPlaceModal('story')}>
							BACA CERITA KAMI SELENGKAPNYA
						</button>

					<!-- TAMAN BUNGA (DETAILS) -->
					{:else if activeModal === 'details'}
						<p class="ft-eyebrow">TAMAN BUNGA · SIMPAN TANGGALNYA</p>
						<h2 class="ft-dialog-title">Tujuan kamu berikutnya.</h2>
						<div class="ft-summary-box">
							<p>⏰ <b>16.00 WITA</b> · Akad Nikah</p>
							<p>⏰ <b>18.00 WITA</b> · Resepsi & Ramah Tamah</p>
							<p>👗 <b>Dress Code:</b> Garden Party · Warna lembut & earthy</p>
						</div>
						<div class="ft-dialog-buttons mt-3">
							<a href={getGoogleCalendarUrl()} target="_blank" rel="noreferrer" class="ft-btn-primary">
								SIMPAN KE KALENDER
							</a>
						</div>

					<!-- SUDUT HADIAH (GIFT) -->
					{:else if activeModal === 'gift'}
						<p class="ft-eyebrow">SUDUT HADIAH · KALAU KAMU MAU</p>
						<h2 class="ft-dialog-title">Kehadiran kamu sudah jadi hadiah.</h2>
						<p class="ft-lead-text">
							Tapi kalau kamu tetap mau kirim sesuatu buat bab baru kami, ini tempatnya. Nggak wajib sama sekali.
						</p>
						<div class="ft-bank-box mt-3">
							<div class="ft-bank-name">BANK CENTRAL ASIA (BCA)</div>
							<div class="ft-bank-num">1234567890</div>
							<div class="ft-bank-holder">a.n. RAMA & SARI</div>
							<button
								type="button"
								class="ft-btn-copy mt-2"
								onclick={() => copyText('1234567890', 'Nomor Rekening BCA')}
							>
								COPY NOMOR REKENING
							</button>
						</div>

					<!-- AIR MANCUR (RSVP) -->
					{:else if activeModal === 'rsvp'}
						<p class="ft-eyebrow">AIR MANCUR · TITIP DOA</p>
						<h2 class="ft-dialog-title">Lempar satu doa buat selamanya.</h2>
						<p class="ft-lead-text">
							Kabarin ya, biar kami tahu mau nyiapin berapa kursi. Sekalian titip doanya di sini.
						</p>

						<form onsubmit={handleRsvpSubmit} class="ft-rsvp-form mt-3">
							<div class="ft-form-group">
								<label for="ft-modal-rsvp-name">NAMA KAMU</label>
								<input id="ft-modal-rsvp-name" type="text" bind:value={rsvpNama} required placeholder="Nama Anda..." />
							</div>
							<div class="ft-form-group">
								<label for="ft-modal-rsvp-att">BISA DATANG?</label>
								<select id="ft-modal-rsvp-att" bind:value={rsvpKehadiran}>
									<option value="hadir">Iya, aku datang</option>
									<option value="tidak_hadir">Maaf, belum bisa</option>
								</select>
							</div>
							<div class="ft-form-group">
								<label for="ft-modal-rsvp-wish">TITIP DOA ATAU PESAN</label>
								<textarea id="ft-modal-rsvp-wish" rows="3" bind:value={rsvpUcapan} placeholder="Doa untuk Rama & Sari..."></textarea>
							</div>
							<button type="submit" class="ft-btn-primary w-100">
								KIRIM KONFIRMASI
							</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- ============================================== -->
	<!-- BATTLE ARENA SCREEN (`ft-battle`)              -->
	<!-- ============================================== -->
	{#if battleActive}
		<div class="ft-battle-root">
			<div class="ft-battle-header">
				<span>TEMAN LIAR MUNCUL</span>
				<button type="button" class="ft-close" onclick={closeBattle}>✕</button>
			</div>

			<div class="ft-battle-stage">
				<!-- FOE MONSTER AREA -->
				<div class="ft-foe-area">
					<div class="ft-mon-wrap {foeMonster.anim} {foeMonster.fainted ? 'ft-fainted' : ''}">
						<div class="ft-mon" style="background-image: url('{foeMonster.sprite}');"></div>
					</div>
					<div class="ft-stat-box ft-foe-stats">
						<b>{foeMonster.name}</b>
						<i>Lv{foeMonster.level}</i>
						<div class="ft-hp-track">
							<span
								class="{foeHpPercent < 0.25 ? 'ft-hp-low' : foeHpPercent < 0.5 ? 'ft-hp-mid' : ''}"
								style="width: {foeHpPercent * 100}%;"
							></span>
						</div>
					</div>
				</div>

				<!-- PLAYER BUDDY AREA -->
				<div class="ft-player-area">
					<div class="ft-mon-wrap {playerBuddyMonster.anim} {playerBuddyMonster.fainted ? 'ft-fainted' : ''}">
						<div class="ft-mon ft-mon-you" style="background-image: url('{playerBuddyMonster.sprite}');"></div>
					</div>
					<div class="ft-stat-box ft-player-stats">
						<b>{playerBuddyMonster.name}</b>
						<i>Lv{playerBuddyMonster.level}</i>
						<div class="ft-hp-track">
							<span
								class="{playerHpPercent < 0.25 ? 'ft-hp-low' : playerHpPercent < 0.5 ? 'ft-hp-mid' : ''}"
								style="width: {playerHpPercent * 100}%;"
							></span>
						</div>
						<small>{Math.max(0, Math.round(playerBuddyMonster.hp))} / {playerBuddyMonster.maxHp}</small>
					</div>
				</div>

				<!-- RING THROW ANIMATION -->
				{#if ringFlying}
					<div class="ft-ring-projectile">💍</div>
				{/if}
			</div>

			<!-- BATTLE BOTTOM CONSOLE -->
			<div class="ft-battle-console">
				<div class="ft-battle-textbox">
					<p>{battleText}</p>
				</div>

				{#if battleMenuOptions.length}
					<div class="ft-battle-menu">
						{#each battleMenuOptions as opt}
							<button
								type="button"
								class="ft-battle-btn"
								disabled={opt.disabled}
								onclick={opt.run}
							>
								<span class="ft-btn-label">{opt.label}</span>
								{#if opt.note}
									<span class="ft-btn-note">{opt.note}</span>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- LIGHTBOX PREVIEW -->
	{#if lightboxImage}
		<div class="ft-scrim" onclick={() => (lightboxImage = null)}>
			<div class="ft-lightbox-wrap" onclick={(e) => e.stopPropagation()}>
				<img src={lightboxImage} alt="Preview Foto" class="ft-lightbox-img" />
				<button type="button" class="ft-close ft-lightbox-close" onclick={() => (lightboxImage = null)}>✕</button>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Specific layout integrations */
	.ft-root {
		width: 100%;
		flex: 1 1 0;
		min-height: 0;
		display: flex;
		flex-direction: column;
		background: #f8f5e8;
		font-family: 'Plus Jakarta Sans', sans-serif;
		color: #303b39;
		position: relative;
		overflow-x: hidden;
	}

	.ft-root.is-game-mode {
		height: 100%;
		overflow: hidden;
	}

	.ft-root.is-scroll-mode {
		display: block;
		height: auto;
		min-height: 100vh;
		overflow-y: auto;
	}

	.is-simulator-box {
		min-height: 100%;
		height: 100%;
	}

	/* TOP BAR */
	.ft-top-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 16px;
		background: #fffdf2;
		border-bottom: 3px solid #22404b;
		box-shadow: 0 4px 0 rgba(34, 64, 75, 0.15);
		position: sticky;
		top: 0;
		z-index: 40;
	}

	.ft-brand {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.ft-gem {
		font-size: 1.25rem;
	}

	.ft-town-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.85rem;
		color: #22404b;
		font-weight: 700;
		letter-spacing: 0.5px;
	}

	.ft-badge-pill {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.55rem;
		background: #b94448;
		color: #ffffff;
		padding: 3px 6px;
		border-radius: 4px;
	}

	.ft-bar-actions {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.ft-btn-mode {
		background: #f7f1cf;
		border: 2px solid #22404b;
		color: #22404b;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		box-shadow: 2px 2px 0 #22404b;
		transition: transform 0.1s;
	}

	.ft-btn-mode:active {
		transform: translate(1px, 1px);
		box-shadow: 1px 1px 0 #22404b;
	}

	.ft-btn-audio {
		background: #fff;
		border: 2px solid #22404b;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		font-size: 1rem;
		box-shadow: 2px 2px 0 #22404b;
	}

	.ft-btn-audio.is-playing {
		animation: pulse-spin 3s linear infinite;
	}

	@keyframes pulse-spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* GAME VIEWPORT (FULLSCREEN & RESPONSIVE) */
	.ft-game-viewport {
		position: relative;
		width: 100%;
		flex: 1 1 0;
		min-height: 0;
		height: 100%;
		background: #193038;
		overflow: hidden;
	}

	.ft-frame {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		background: #193038;
		overflow: hidden;
		user-select: none;
		touch-action: none;
	}

	.ft-scene {
		position: absolute;
		left: 0;
		top: 0;
		width: 512px;
		height: 384px;
		transform-origin: 0 0;
		will-change: transform;
	}

	.ft-canvas {
		width: 512px;
		height: 384px;
		display: block;
		image-rendering: pixelated;
		image-rendering: crisp-edges;
		cursor: crosshair;
	}

	/* MAP OVERLAY PINS */
	.ft-map-pin {
		position: absolute;
		transform: translate(-50%, -100%);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		transition: transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		z-index: 10;
	}

	.ft-map-pin:hover {
		transform: translate(-50%, -115%) scale(1.1);
	}

	.ft-pin-bubble {
		display: flex;
		align-items: center;
		gap: 4px;
		background: #fffdf2;
		border: 2px solid #22404b;
		padding: 3px 6px;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
		white-space: nowrap;
	}

	.ft-pin-icon {
		font-size: 0.85rem;
	}

	.ft-pin-text {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
		color: #22404b;
	}

	.ft-pin-arrow {
		width: 0;
		height: 0;
		border-left: 5px solid transparent;
		border-right: 5px solid transparent;
		border-top: 5px solid #22404b;
	}

	.ft-map-pin.is-visited .ft-pin-bubble {
		background: #f7f1cf;
		border-color: #8a5b17;
	}

	/* BOTTOM HUD (ACTION BUTTON ON BOTTOM RIGHT) */
	.ft-hud-overlay {
		position: absolute;
		bottom: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 10px;
		pointer-events: none;
		z-index: 30;
	}

	/* JOURNAL FLOATING CENTER BUTTON */
	.ft-journal-center {
		position: absolute;
		bottom: 20px;
		left: 50%;
		transform: translateX(-50%);
		pointer-events: auto;
		z-index: 30;
	}

	.ft-btn-journal,
	.ft-btn-action {
		pointer-events: auto;
		display: flex;
		align-items: center;
		gap: 8px;
		background: #fffdf2;
		border: 3px solid #22404b;
		box-shadow: 3px 3px 0 #22404b;
		padding: 8px 14px;
		border-radius: 8px;
		cursor: pointer;
		font-family: 'Press Start 2P', monospace;
		transition: transform 0.1s;
	}

	.ft-btn-journal:active,
	.ft-btn-action:active {
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 #22404b;
	}

	.ft-journal-label {
		font-size: 0.65rem;
		color: #22404b;
	}

	.ft-action-key {
		background: #b94448;
		color: #fff;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.65rem;
		font-weight: 700;
	}

	.ft-action-text {
		font-size: 0.65rem;
		color: #22404b;
	}

	/* D-PAD FOR MOBILE (BOTTOM LEFT) */
	.ft-dpad-container {
		position: absolute;
		bottom: 20px;
		left: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		z-index: 30;
		opacity: 0.92;
		user-select: none;
		touch-action: none;
	}

	.ft-dpad-row {
		display: flex;
		align-items: center;
	}

	.ft-dpad-btn {
		width: 44px;
		height: 44px;
		background: #22404b;
		color: #f7f1cf;
		border: 2px solid #ddd49f;
		font-size: 1rem;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		touch-action: manipulation;
		user-select: none;
		box-shadow: 2px 2px 0 #112228;
	}

	.ft-dpad-btn:active {
		background: #b94448;
	}

	.ft-dpad-center {
		width: 32px;
		height: 32px;
		background: #193038;
	}

	/* DESKTOP CONTROLS HINT */
	.ft-desktop-hints {
		position: absolute;
		bottom: 20px;
		left: 20px;
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(34, 64, 75, 0.9);
		backdrop-filter: blur(8px);
		border: 2px solid #ddd49f;
		box-shadow: 2px 2px 0 #112228;
		padding: 7px 14px;
		border-radius: 8px;
		color: #f7f1cf;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.52rem;
		pointer-events: none;
		z-index: 25;
	}

	.ft-hint-chip {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.ft-kbd {
		background: #f7f1cf;
		color: #22404b;
		border: 1px solid #112228;
		border-radius: 3px;
		padding: 2px 5px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
		box-shadow: 1px 1px 0 #112228;
	}

	@media (max-width: 767px) {
		.ft-desktop-hints {
			display: none;
		}
	}

	@media (min-width: 768px) {
		.ft-dpad-container {
			display: none;
		}
	}

	/* SCROLL MODE CONTAINER */
	.ft-scroll-container {
		max-width: 680px;
		margin: 0 auto;
		padding: 24px 16px 80px 16px;
	}

	.ft-scroll-hero {
		background: #fffdf2;
		border: 3px solid #22404b;
		box-shadow: 6px 6px 0 #22404b;
		padding: 32px 20px;
		text-align: center;
		margin-bottom: 28px;
		border-radius: 8px;
	}

	.ft-pixel-badge {
		display: inline-block;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.6rem;
		background: #b94448;
		color: #fff;
		padding: 5px 10px;
		border-radius: 4px;
		margin-bottom: 16px;
	}

	.ft-scroll-names {
		font-family: 'Press Start 2P', monospace;
		font-size: 1.3rem;
		line-height: 1.5;
		color: #22404b;
		margin-bottom: 12px;
	}

	.ft-scroll-date {
		font-size: 0.95rem;
		color: #646e64;
		margin-bottom: 20px;
	}

	.ft-scroll-countdown {
		display: flex;
		justify-content: center;
		gap: 10px;
		margin-bottom: 24px;
	}

	.ft-cd-box {
		background: #f7f1cf;
		border: 2px solid #22404b;
		padding: 10px 14px;
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 2px 2px 0 #22404b;
	}

	.ft-cd-box b {
		font-family: 'Press Start 2P', monospace;
		font-size: 1.1rem;
		color: #b94448;
	}

	.ft-cd-box span {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.5rem;
		color: #22404b;
		margin-top: 4px;
	}

	.ft-scroll-section {
		margin-bottom: 28px;
	}

	.ft-dialog-card {
		background: #fffdf2;
		border: 3px solid #22404b;
		box-shadow: 5px 5px 0 #22404b;
		border-radius: 8px;
		overflow: hidden;
	}

	.ft-card-header {
		background: #f7f1cf;
		border-bottom: 2px solid #22404b;
		padding: 8px 16px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		color: #22404b;
	}

	.ft-card-body {
		padding: 20px;
	}

	.ft-couple-row {
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 16px;
		flex-wrap: wrap;
	}

	.ft-person-card {
		text-align: center;
		max-width: 240px;
	}

	.ft-person-img {
		width: 140px;
		height: 140px;
		object-fit: cover;
		border-radius: 8px;
		border: 3px solid #22404b;
		box-shadow: 3px 3px 0 #22404b;
		margin-bottom: 12px;
	}

	.ft-person-name {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.75rem;
		color: #22404b;
		margin-bottom: 6px;
	}

	.ft-person-desc {
		font-size: 0.85rem;
		color: #646e64;
		line-height: 1.4;
	}

	.ft-ig-link {
		display: inline-block;
		font-size: 0.8rem;
		color: #b94448;
		text-decoration: none;
		margin-top: 6px;
		font-weight: 600;
	}

	.ft-events-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 14px;
	}

	@media (max-width: 580px) {
		.ft-events-grid {
			grid-template-columns: 1fr;
		}
	}

	.ft-event-item {
		background: #f8f5e8;
		border: 2px solid #22404b;
		padding: 14px;
		border-radius: 6px;
	}

	.ft-event-item h4 {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.75rem;
		color: #b94448;
		margin-bottom: 8px;
	}

	.ft-event-time, .ft-event-loc {
		font-size: 0.85rem;
		margin-bottom: 4px;
		color: #303b39;
	}

	.ft-bank-box {
		background: #f7f1cf;
		border: 2px solid #22404b;
		padding: 16px;
		border-radius: 8px;
		max-width: 360px;
		margin: 0 auto;
		box-shadow: 3px 3px 0 #22404b;
	}

	.ft-bank-name {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.7rem;
		color: #22404b;
	}

	.ft-bank-num {
		font-family: 'Press Start 2P', monospace;
		font-size: 1.1rem;
		color: #b94448;
		margin: 8px 0;
		letter-spacing: 1px;
	}

	.ft-bank-holder {
		font-size: 0.85rem;
		color: #646e64;
	}

	/* BUTTONS */
	.ft-btn-primary {
		background: #b94448;
		color: #ffffff;
		border: 2px solid #22404b;
		box-shadow: 3px 3px 0 #22404b;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		padding: 10px 16px;
		border-radius: 6px;
		cursor: pointer;
		display: inline-block;
		text-decoration: none;
		transition: transform 0.1s;
	}

	.ft-btn-primary:active {
		transform: translate(2px, 2px);
		box-shadow: 1px 1px 0 #22404b;
	}

	.ft-btn-secondary {
		background: #fffdf2;
		color: #22404b;
		border: 2px solid #22404b;
		box-shadow: 3px 3px 0 #22404b;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		padding: 10px 16px;
		border-radius: 6px;
		cursor: pointer;
		display: inline-block;
		text-decoration: none;
	}

	.ft-btn-copy {
		background: #43634e;
		color: #ffffff;
		border: 2px solid #22404b;
		box-shadow: 2px 2px 0 #22404b;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.6rem;
		padding: 8px 12px;
		border-radius: 4px;
		cursor: pointer;
	}

	.ft-btn-plain {
		background: none;
		border: none;
		color: #646e64;
		font-size: 0.85rem;
		text-decoration: underline;
		cursor: pointer;
		padding: 6px;
	}

	/* MODALS */
	.ft-scrim {
		position: fixed;
		inset: 0;
		background: rgba(18, 32, 38, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		z-index: 100;
	}

	.ft-window {
		background: #fffdf2;
		border: 4px solid #22404b;
		box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.4);
		border-radius: 8px;
		width: 100%;
		max-width: 520px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		animation: popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}

	@keyframes popIn {
		from { transform: scale(0.92); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}

	.ft-window-header {
		background: #f7f1cf;
		border-bottom: 3px solid #22404b;
		padding: 10px 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		color: #22404b;
	}

	.ft-close {
		background: #b94448;
		color: #fff;
		border: 2px solid #22404b;
		width: 24px;
		height: 24px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		cursor: pointer;
		font-size: 0.75rem;
	}

	.ft-window-body {
		padding: 20px;
		overflow-y: auto;
	}

	.ft-dialog-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.95rem;
		color: #22404b;
		margin: 8px 0 12px 0;
		line-height: 1.4;
	}

	.ft-lead-text {
		font-size: 0.9rem;
		color: #303b39;
		line-height: 1.5;
	}

	.ft-eyebrow {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.55rem;
		color: #b94448;
		letter-spacing: 0.5px;
	}

	.ft-summary-box {
		background: #f8f5e8;
		border: 2px solid #22404b;
		padding: 14px;
		border-radius: 6px;
		margin-top: 12px;
		font-size: 0.85rem;
	}

	.ft-summary-box p {
		margin-bottom: 6px;
	}

	/* CHARACTER SELECTION */
	.ft-pick-section {
		text-align: left;
	}

	.ft-pick-title {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.6rem;
		color: #22404b;
		margin-bottom: 8px;
		display: block;
	}

	.ft-pick-row {
		display: flex;
		gap: 10px;
	}

	.ft-pick-btn {
		flex: 1;
		background: #f8f5e8;
		border: 2px solid #22404b;
		padding: 10px;
		border-radius: 6px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		box-shadow: 2px 2px 0 #22404b;
	}

	.ft-pick-btn.is-selected {
		background: #f7f1cf;
		border-color: #b94448;
		box-shadow: 3px 3px 0 #b94448;
	}

	.ft-pick-btn span {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.55rem;
		color: #22404b;
	}

	.ft-sprite-preview {
		width: 32px;
		height: 32px;
		background-repeat: no-repeat;
		background-position: 0 0;
		image-rendering: pixelated;
	}

	.ft-buddy-img {
		width: 24px;
		height: 24px;
		image-rendering: pixelated;
	}

	.ft-input-pixel {
		width: 100%;
		background: #ffffff;
		border: 2px solid #22404b;
		padding: 10px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.75rem;
		color: #22404b;
		border-radius: 4px;
		box-sizing: border-box;
	}

	/* PLACES JURNAL LIST */
	.ft-progress-badge {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.6rem;
		background: #e0a63c;
		color: #22404b;
		padding: 6px 10px;
		border-radius: 4px;
		display: inline-block;
		margin: 8px 0;
	}

	.ft-places-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.ft-place-btn {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: #f8f5e8;
		border: 2px solid #22404b;
		padding: 10px 14px;
		border-radius: 6px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.6rem;
		color: #22404b;
		cursor: pointer;
	}

	.ft-place-btn:hover {
		background: #f7f1cf;
	}

	.ft-party-icons {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.ft-party-tag {
		display: flex;
		align-items: center;
		gap: 6px;
		background: #f7f1cf;
		border: 2px solid #22404b;
		padding: 4px 8px;
		border-radius: 4px;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.55rem;
	}

	.ft-party-tag img {
		width: 20px;
		height: 20px;
		image-rendering: pixelated;
	}

	/* COUPLE DIALOG WRAP */
	.ft-couple-dialog-wrap {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 14px;
	}

	.ft-couple-dialog-person {
		background: #f8f5e8;
		border: 2px solid #22404b;
		padding: 10px;
		border-radius: 6px;
		text-align: center;
	}

	.ft-couple-dialog-person img {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: 6px;
		border: 2px solid #22404b;
		margin-bottom: 8px;
	}

	.ft-couple-dialog-person h4 {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		color: #22404b;
		margin-bottom: 4px;
	}

	.ft-couple-dialog-person p {
		font-size: 0.75rem;
		color: #646e64;
	}

	.ft-dialog-note {
		font-style: italic;
		font-size: 0.85rem;
		color: #303b39;
		background: #f7f1cf;
		border-left: 4px solid #b94448;
		padding: 8px 12px;
	}

	/* TIMELINE */
	.ft-timeline-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.ft-timeline-node {
		background: #f8f5e8;
		border: 2px solid #22404b;
		padding: 12px;
		border-radius: 6px;
	}

	.ft-year-pill {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.6rem;
		background: #b94448;
		color: #fff;
		padding: 3px 6px;
		border-radius: 3px;
	}

	.ft-timeline-node h4 {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.75rem;
		color: #22404b;
		margin: 8px 0 4px 0;
	}

	.ft-timeline-node p {
		font-size: 0.85rem;
		color: #646e64;
		line-height: 1.4;
	}

	/* GALLERY */
	.ft-gallery-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.ft-photo-card {
		background: #fff;
		border: 2px solid #22404b;
		padding: 6px 6px 12px 6px;
		box-shadow: 2px 2px 0 #22404b;
		cursor: pointer;
		text-align: center;
	}

	.ft-photo-card img {
		width: 100%;
		aspect-ratio: 1;
		object-fit: cover;
		display: block;
		margin-bottom: 6px;
	}

	.ft-photo-card span {
		font-size: 0.75rem;
		color: #303b39;
	}

	.ft-cafe-hero {
		width: 100%;
		border-radius: 6px;
		border: 2px solid #22404b;
	}

	/* RSVP FORM */
	.ft-form-group {
		margin-bottom: 12px;
		text-align: left;
	}

	.ft-form-group label {
		display: block;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.6rem;
		color: #22404b;
		margin-bottom: 6px;
	}

	.ft-form-group input,
	.ft-form-group select,
	.ft-form-group textarea {
		width: 100%;
		padding: 10px;
		border: 2px solid #22404b;
		border-radius: 4px;
		font-size: 0.9rem;
		box-sizing: border-box;
		background: #fff;
	}

	.ft-alert-success {
		background: #d4edda;
		color: #155724;
		border: 2px solid #c3e6cb;
		padding: 8px 12px;
		font-size: 0.85rem;
		border-radius: 4px;
		font-weight: 600;
	}

	.ft-wishes-list h4 {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.7rem;
		color: #22404b;
		margin-bottom: 12px;
	}

	.ft-wish-item {
		background: #f8f5e8;
		border: 2px solid #22404b;
		padding: 10px 14px;
		border-radius: 6px;
		margin-bottom: 10px;
	}

	.ft-wish-header {
		display: flex;
		justify-content: space-between;
		font-size: 0.85rem;
		margin-bottom: 6px;
	}

	.ft-wish-badge {
		font-size: 0.7rem;
		color: #721c24;
	}

	.ft-wish-badge.is-attending {
		color: #155724;
		font-weight: 700;
	}

	.ft-wish-content {
		font-size: 0.85rem;
		color: #303b39;
		margin-bottom: 6px;
	}

	.ft-wish-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.75rem;
		color: #646e64;
	}

	.ft-btn-like {
		background: none;
		border: 1px solid #ddd;
		border-radius: 12px;
		padding: 2px 8px;
		cursor: pointer;
		font-size: 0.75rem;
	}

	/* ============================================== */
	/* BATTLE ARENA (RETRO POKÉMON STYLE)             */
	/* ============================================== */
	.ft-battle-root {
		position: fixed;
		inset: 0;
		background: #152220;
		z-index: 120;
		display: flex;
		flex-direction: column;
		max-width: 600px;
		margin: 0 auto;
		border: 4px solid #22404b;
	}

	.ft-battle-header {
		background: #f7f1cf;
		border-bottom: 3px solid #22404b;
		padding: 10px 16px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.75rem;
		color: #22404b;
	}

	.ft-battle-stage {
		flex: 1;
		background-color: #76a066;
		background-image: url('/templates/forever-town/meadow.png');
		background-size: cover;
		background-position: center;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		padding: 20px;
	}

	.ft-foe-area {
		display: flex;
		justify-content: flex-end;
		position: relative;
		height: 120px;
	}

	.ft-player-area {
		display: flex;
		justify-content: flex-start;
		position: relative;
		height: 120px;
	}

	.ft-mon-wrap {
		position: relative;
	}

	.ft-mon {
		width: 96px;
		height: 96px;
		background-repeat: no-repeat;
		background-size: contain;
		image-rendering: pixelated;
	}

	.ft-stat-box {
		background: #fffdf2;
		border: 3px solid #22404b;
		padding: 8px 12px;
		border-radius: 6px;
		font-family: 'Press Start 2P', monospace;
		min-width: 140px;
		box-shadow: 3px 3px 0 #22404b;
	}

	.ft-foe-stats {
		position: absolute;
		left: 10px;
		top: 10px;
	}

	.ft-player-stats {
		position: absolute;
		right: 10px;
		bottom: 10px;
	}

	.ft-stat-box b {
		display: block;
		font-size: 0.65rem;
		color: #22404b;
		margin-bottom: 4px;
	}

	.ft-stat-box i {
		font-size: 0.55rem;
		color: #646e64;
		font-style: normal;
	}

	.ft-hp-track {
		height: 8px;
		background: #ddd49f;
		border: 2px solid #22404b;
		border-radius: 4px;
		margin: 4px 0;
		overflow: hidden;
	}

	.ft-hp-track span {
		display: block;
		height: 100%;
		background: #43634e;
		transition: width 0.3s ease;
	}

	.ft-hp-track span.ft-hp-mid {
		background: #e0a63c;
	}

	.ft-hp-track span.ft-hp-low {
		background: #b94448;
	}

	.ft-ring-projectile {
		position: absolute;
		font-size: 2rem;
		left: 25%;
		bottom: 25%;
		animation: ringThrow 0.8s forwards;
	}

	@keyframes ringThrow {
		0% { transform: translate(0, 0) scale(1) rotate(0deg); }
		50% { transform: translate(120px, -80px) scale(1.4) rotate(180deg); }
		100% { transform: translate(220px, -140px) scale(0.8) rotate(360deg); }
	}

	.ft-battle-console {
		background: #fffdf2;
		border-top: 4px solid #22404b;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.ft-battle-textbox {
		background: #f8f5e8;
		border: 3px solid #22404b;
		padding: 12px;
		border-radius: 6px;
		min-height: 52px;
		box-sizing: border-box;
	}

	.ft-battle-textbox p {
		font-family: 'Press Start 2P', monospace;
		font-size: 0.7rem;
		color: #22404b;
		line-height: 1.5;
		margin: 0;
	}

	.ft-battle-menu {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.ft-battle-btn {
		background: #f7f1cf;
		border: 3px solid #22404b;
		padding: 10px;
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		cursor: pointer;
		box-shadow: 2px 2px 0 #22404b;
		font-family: 'Press Start 2P', monospace;
	}

	.ft-battle-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.ft-btn-label {
		font-size: 0.7rem;
		color: #22404b;
	}

	.ft-btn-note {
		font-size: 0.5rem;
		color: #646e64;
		margin-top: 4px;
	}

	/* LIGHTBOX */
	.ft-lightbox-wrap {
		position: relative;
		max-width: 90vw;
		max-height: 90vh;
	}

	.ft-lightbox-img {
		max-width: 100%;
		max-height: 85vh;
		border-radius: 8px;
		border: 4px solid #22404b;
	}

	.ft-lightbox-close {
		position: absolute;
		top: -12px;
		right: -12px;
	}

	/* TOAST */
	.ft-toast {
		position: fixed;
		top: 64px;
		left: 50%;
		transform: translateX(-50%);
		background: #22404b;
		color: #f7f1cf;
		border: 2px solid #e0a63c;
		font-family: 'Press Start 2P', monospace;
		font-size: 0.65rem;
		padding: 10px 18px;
		border-radius: 6px;
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
		z-index: 200;
		animation: popIn 0.2s;
	}
</style>
