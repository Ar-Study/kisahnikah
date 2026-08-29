// weddingStore.svelte.js - Centralized reactive wedding data store with Svelte 5 runes
import { supabase } from './supabaseClient.js';

export const TEMPLATES = [
	// TIER 1: GRATIS (FREE TRIAL)
	{
		id: 'champagne-gold',
		name: 'Champagne Gold Classic',
		tag: 'Royal & Luxurious',
		tier: 'free',
		isPremium: false,
		priceLabel: 'Gratis',
		category: 'Klasik & Mewah',
		badgeIcon: 'bi-gift',
		desc: 'Nuansa emas royal berpadu krem gading hangat, ornamen klasik eropa dan tipografi serif megah.',
		primaryColor: '#C5A059',
		secondaryColor: '#8C6A27',
		bgColor: '#FAF7F2',
		textColor: '#221F1E',
		cardBg: 'rgba(255, 255, 255, 0.94)',
		fontTitle: "'Alex Brush', cursive",
		fontHeading: "'Cinzel', serif",
		fontBody: "'Plus Jakarta Sans', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=700'
	},
	{
		id: 'bohemian-terracotta',
		name: 'Bohemian Terracotta',
		tag: 'Warm, Earthy & Rustic',
		tier: 'free',
		isPremium: false,
		priceLabel: 'Gratis',
		category: 'Rustic & Bohemian',
		badgeIcon: 'bi-gift',
		desc: 'Nuansa hangat terracotta mediterania berpadu warna tanah gurun, pampas rustic, dan layout editorial estetik.',
		primaryColor: '#C2593F',
		secondaryColor: '#793422',
		bgColor: '#FAF4EF',
		textColor: '#2B1E19',
		cardBg: 'rgba(255, 255, 255, 0.94)',
		fontTitle: "'Alex Brush', cursive",
		fontHeading: "'Playfair Display', serif",
		fontBody: "'Plus Jakarta Sans', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=700'
	},
	{
		id: 'botanical-sage',
		name: 'Simple Botanical Sage',
		tag: 'Fresh, Clean & Natural',
		tier: 'free',
		isPremium: false,
		priceLabel: 'Gratis',
		category: 'Minimalis & Alam',
		badgeIcon: 'bi-gift',
		desc: 'Kesegaran dedaunan sage green tropis berpadu latar putih bersih, sejuk, modern, dan minimalis natural.',
		primaryColor: '#4A6B52',
		secondaryColor: '#2B4232',
		bgColor: '#F2F6F3',
		textColor: '#1E2B21',
		cardBg: 'rgba(255, 255, 255, 0.95)',
		fontTitle: "'Great Vibes', cursive",
		fontHeading: "'Playfair Display', serif",
		fontBody: "'Plus Jakarta Sans', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=700'
	},

	// TIER 2: PREMIUM ALL-IN-ONE (RP 140.000)
	{
		id: 'emerald-forest',
		name: 'Emerald Forest Luxury',
		tag: 'Botanical & Prestigious',
		tier: 'premium',
		isPremium: true,
		priceLabel: 'Premium ⭐',
		category: 'Botanikal & Glamor',
		badgeIcon: 'bi-stars',
		desc: 'Harmoni hijau emerald hutan tropis nan megah dengan sentuhan dedaunan emas dan modern serif ballroom bintang lima.',
		primaryColor: '#2D6A4F',
		secondaryColor: '#D4AF37',
		bgColor: '#F0F5F2',
		textColor: '#1B2E24',
		cardBg: 'rgba(255, 255, 255, 0.95)',
		fontTitle: "'Great Vibes', cursive",
		fontHeading: "'Playfair Display', serif",
		fontBody: "'Inter', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=700'
	},
	{
		id: 'midnight-celestial',
		name: 'Midnight Celestial Glow',
		tag: 'Dark Glamour & Cinematic',
		tier: 'premium',
		isPremium: true,
		priceLabel: 'Premium ⭐',
		category: 'Sinematik & Modern',
		badgeIcon: 'bi-stars',
		desc: 'Latar gelap obsidian sinematik dihiasi kilau rasi bintang emas dan estetika visual modern glam suasana malam romantis.',
		primaryColor: '#E5C158',
		secondaryColor: '#FFDF78',
		bgColor: '#0C1017',
		textColor: '#F3F4F6',
		cardBg: 'rgba(21, 26, 36, 0.92)',
		fontTitle: "'Alex Brush', cursive",
		fontHeading: "'Cinzel', serif",
		fontBody: "'Plus Jakarta Sans', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=700'
	},
	{
		id: 'romantic-rose',
		name: 'Romantic Rose Floral',
		tag: 'Soft, Sweet & Tender',
		tier: 'premium',
		isPremium: true,
		priceLabel: 'Premium ⭐',
		category: 'Floral & Romantis',
		badgeIcon: 'bi-stars',
		desc: 'Palet bunga mawar blush dusty pink dipadu aksen burgundy anggun yang sarat romansa abadi dan watercolor lembut.',
		primaryColor: '#B86B77',
		secondaryColor: '#7A3845',
		bgColor: '#FFF5F6',
		textColor: '#2C1D21',
		cardBg: 'rgba(255, 255, 255, 0.94)',
		fontTitle: "'Great Vibes', cursive",
		fontHeading: "'Cormorant Garamond', serif",
		fontBody: "'Inter', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=700'
	},
	{
		id: 'javanese-heritage',
		name: 'Javanese Keraton Heritage',
		tag: 'Adat Jawa & Sentuhan Batik',
		tier: 'premium',
		isPremium: true,
		priceLabel: 'Premium ⭐',
		category: 'Adat Tradisional',
		badgeIcon: 'bi-stars',
		desc: 'Keagungan adat Jawa Keraton dengan ornamen gunungan wayang emas, motif batik kawung coklat soga, dan font etnik bangsawan.',
		primaryColor: '#C49746',
		secondaryColor: '#5C381E',
		bgColor: '#FAF5EE',
		textColor: '#2E1E14',
		cardBg: 'rgba(255, 255, 255, 0.95)',
		fontTitle: "'Cinzel', serif",
		fontHeading: "'Cinzel', serif",
		fontBody: "'Plus Jakarta Sans', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=700'
	},
	{
		id: 'islamic-moroccan',
		name: 'Islamic Moroccan Arabesque',
		tag: 'Kubah Mihrab & Syar\'i',
		tier: 'premium',
		isPremium: true,
		priceLabel: 'Premium ⭐',
		category: 'Islami & Syar\'i',
		badgeIcon: 'bi-stars',
		desc: 'Nuansa Islami megah dengan kubah mihrab maroko geometris, bismillah kaligrafi anggun, dan perpaduan hijau zaitun & emas pasir.',
		primaryColor: '#C5A059',
		secondaryColor: '#1E4535',
		bgColor: '#F7F8F4',
		textColor: '#1A2922',
		cardBg: 'rgba(255, 255, 255, 0.95)',
		fontTitle: "'Alex Brush', cursive",
		fontHeading: "'Playfair Display', serif",
		fontBody: "'Plus Jakarta Sans', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?q=80&w=700'
	},

	// TIER 3: VIP CUSTOM ASSIST (RP 250.000)
	{
		id: 'royal-velvet',
		name: 'Royal Velvet & Gold 3D',
		tag: 'VIP Royal Edition',
		tier: 'vip',
		isPremium: true,
		priceLabel: 'VIP Exclusive 👑',
		category: 'Royal Luxury',
		badgeIcon: 'bi-crown-fill',
		desc: 'Mahakarya pernikahan eksklusif warna merah marun velvet megah, list foil emas 3D, crown monogram, dan kemewahan istana eropa.',
		primaryColor: '#E6BC65',
		secondaryColor: '#7D1326',
		bgColor: '#17060A',
		textColor: '#FDF7E7',
		cardBg: 'rgba(38, 12, 19, 0.92)',
		fontTitle: "'Great Vibes', cursive",
		fontHeading: "'Cinzel', serif",
		fontBody: "'Inter', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?q=80&w=700'
	},
	{
		id: 'sundanese-parahyangan',
		name: 'Golden Sundanese Siger',
		tag: 'VIP Parahyangan Heritage',
		tier: 'vip',
		isPremium: true,
		priceLabel: 'VIP Exclusive 👑',
		category: 'Adat Tradisional',
		badgeIcon: 'bi-crown-fill',
		desc: 'Pesona adat Sunda Parahyangan dengan mahkota siger emas agung, untaian ronce melati suci, dan gradasi megamendung keemasan.',
		primaryColor: '#D4AF37',
		secondaryColor: '#8C6826',
		bgColor: '#FDFBF7',
		textColor: '#241F18',
		cardBg: 'rgba(255, 255, 255, 0.96)',
		fontTitle: "'Alex Brush', cursive",
		fontHeading: "'Cormorant Garamond', serif",
		fontBody: "'Plus Jakarta Sans', sans-serif",
		previewImage: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=700'
	}
];

export const MUSIC_TRACKS = [
	{
		id: 'track-1',
		title: 'Romantic Wedding Piano',
		artist: 'Soulful Melody',
		url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=romantic-wedding-piano-10065.mp3'
	},
	{
		id: 'track-2',
		title: 'Acoustic Wedding Love',
		artist: 'Sweet Harmony',
		url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=love-story-piano-6003.mp3'
	},
	{
		id: 'track-3',
		title: 'Cinematic Dream String',
		artist: 'Elegance Suite',
		url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_338a08d277.mp3?filename=gentle-piano-10700.mp3'
	}
];

const DEFAULT_WEDDING_DATA = {
	templateId: 'champagne-gold',
	coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200',
	music: {
		enabled: true,
		trackId: 'track-1',
		url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3?filename=romantic-wedding-piano-10065.mp3',
		title: 'Romantic Wedding Piano'
	},
	mempelai: {
		pria: {
			namaLengkap: 'Muhammad Rizky Pratama, S.T.',
			namaPanggilan: 'Rizky',
			anakKe: 'Putra Pertama',
			ayah: 'H. Bambang Susilo, S.E.',
			ibu: 'Hj. Endang Rahayu',
			foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400',
			instagram: 'rizkypratama'
		},
		wanita: {
			namaLengkap: 'Anindya Putri Kirana, S.Ked.',
			namaPanggilan: 'Anin',
			anakKe: 'Putri Kedua',
			ayah: 'Drs. H. Ahmad Wijaya',
			ibu: 'Hj. Siti Aminah',
			foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400',
			instagram: 'anindyaputri'
		}
	},
	kutipan: {
		salam: 'Assalamu’alaikum Warahmatullahi Wabarakatuh',
		teks: 'Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang.',
		sumber: 'QS. Ar-Rum: 21',
		pesan: 'Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta’ala, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk menghadiri hari bahagia pernikahan kami:'
	},
	acara: {
		akad: {
			judul: 'Akad Nikah',
			tanggal: '2026-12-12',
			waktuMulai: '08:00',
			waktuSelesai: '10:00',
			zonaWaktu: 'WIB',
			tempat: 'Masjid Raya Trans Studio',
			alamat: 'Jl. Gatot Subroto No. 289, Cibangkong, Batununggal, Kota Bandung',
			mapsUrl: 'https://maps.google.com/?q=Masjid+Raya+Trans+Studio+Bandung'
		},
		resepsi: {
			judul: 'Resepsi Pernikahan',
			tanggal: '2026-12-12',
			waktuMulai: '11:00',
			waktuSelesai: '14:00',
			zonaWaktu: 'WIB',
			tempat: 'Grand Ballroom Savoy Homann',
			alamat: 'Jl. Asia Afrika No. 112, Cikawao, Lengkong, Kota Bandung',
			mapsUrl: 'https://maps.google.com/?q=Savoy+Homann+Bandung',
			koordinat: '-6.921389,107.610833'
		}
	},
	cerita: [
		{
			id: 'c1',
			tahun: '2021',
			judul: 'Pertemuan Pertama',
			isi: 'Kami pertama kali saling mengenal saat terlibat dalam sebuah proyek riset kampus bersama di Bandung.'
		},
		{
			id: 'c2',
			tahun: '2023',
			judul: 'Memulai Komitmen Bersama',
			isi: 'Setelah dua tahun saling mendukung dalam karier dan bertumbuh, kami sepakat melangkah ke arah masa depan yang sama.'
		},
		{
			id: 'c3',
			tahun: '2025',
			judul: 'Ikatan Lamaran & Restu',
			isi: 'Di hadapan kedua keluarga besar tercinta, kami mengikat janji suci dan memohon doa restu menuju pelaminan.'
		}
	],
	galeri: [
		{
			id: 'g1',
			url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
			caption: 'Momen Prewedding di Alam Terbuka'
		},
		{
			id: 'g2',
			url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800',
			caption: 'Tawa dan Langkah Bahagia Bersama'
		},
		{
			id: 'g3',
			url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800',
			caption: 'Janji Setia Menghadapi Masa Depan'
		},
		{
			id: 'g4',
			url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800',
			caption: 'Kehangatan Kasih dalam Kesederhanaan'
		},
		{
			id: 'g5',
			url: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800',
			caption: 'Menatap Hari Esok Penuh Cinta'
		},
		{
			id: 'g6',
			url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?q=80&w=800',
			caption: 'Dua Jiwa Bertaut Menjadi Satu'
		}
	],
	kado: {
		deskripsi:
			'Doa restu Anda merupakan karunia terindah bagi kami. Namun jika Anda ingin memberikan tanda kasih berupa kado atau angpao digital, dapat melalui rekening berikut:',
		rekening: [
			{
				id: 'r1',
				bank: 'Bank Central Asia (BCA)',
				noRek: '7829104821',
				atasNama: 'Muhammad Rizky Pratama',
				icon: 'bi-credit-card-2-front'
			},
			{
				id: 'r2',
				bank: 'Bank Syariah Indonesia (BSI)',
				noRek: '9182304918',
				atasNama: 'Anindya Putri Kirana',
				icon: 'bi-cash-coin'
			},
			{
				id: 'r3',
				bank: 'GoPay / OVO / Dana',
				noRek: '081239919039',
				atasNama: 'Muhammad Rizky Pratama',
				icon: 'bi-phone'
			}
		],
		alamatKado:
			'Jl. Asia Afrika No. 112, Kel. Braga, Kec. Sumur Bandung, Kota Bandung, Jawa Barat 40111 (Penerima: Rizky & Anin / 0812-3991-9039)'
	},
	rundown: [
		{ jam: '08:00 - 09:30', acara: 'Akad Nikah / Ijab Qabul', desc: 'Prosesi ijab qabul sakral disaksikan keluarga inti', icon: 'bi-gem' },
		{ jam: '09:30 - 10:30', acara: 'Upacara Adat & Sungkeman', desc: 'Ungkapan bakti & restu kepada kedua orang tua', icon: 'bi-flower1' },
		{ jam: '11:00 - 13:00', acara: 'Resepsi & Ramah Tamah', desc: 'Penyambutan tamu undangan & jamuan prasmanan', icon: 'bi-cup-hot' },
		{ jam: '13:00 - 14:00', acara: 'Sesi Foto & Penutupan', desc: 'Foto bersama sahabat & keluarga besar', icon: 'bi-camera' }
	],
	dresscode: {
		enabled: true,
		judul: 'Panduan Busana (Dress Code)',
		deskripsi: 'Agar foto momen kebersamaan semakin indah dan serasi, tamu undangan disarankan mengenakan pakaian bernuansa:',
		warna: [
			{ nama: 'Champagne Gold', hex: '#C5A059' },
			{ nama: 'Sage Green', hex: '#4A6B52' },
			{ nama: 'Terracotta', hex: '#C2593F' },
			{ nama: 'Batik Soga', hex: '#5C381E' }
		]
	},
	streaming: {
		enabled: true,
		platform: 'YouTube Live',
		url: 'https://youtube.com/live',
		embedUrl: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk',
		pesan: 'Bagi keluarga dan sahabat yang berhalangan hadir langsung, Anda dapat menyaksikan siaran pernikahan kami secara online.'
	},
	protokol: [
		{ icon: 'bi-heart-pulse', judul: 'Kondisi Sehat', desc: 'Hadir dalam kondisi fisik sehat dan prima.' },
		{ icon: 'bi-clock-history', judul: 'Tepat Waktu', desc: 'Disarankan hadir 15 menit sebelum sesi dimulai.' },
		{ icon: 'bi-camera', judul: 'Fotografi Tertib', desc: 'Mohon tidak menghalangi dokumentasi resmi.' },
		{ icon: 'bi-flower2', judul: 'Doa Restu', desc: 'Sampaikan doa tulus keberkahan bagi mempelai.' }
	],
	rsvps: [
		{
			id: 1,
			nama: 'Budi Santoso & Keluarga',
			kehadiran: 'hadir',
			jumlah: 2,
			likes: 14,
			ucapan:
				'Selamat menempuh hidup baru Rizky & Anin! Semoga menjadi keluarga yang sakinah, mawaddah, dan warahmah.',
			waktu: 'Baru saja'
		},
		{
			id: 2,
			nama: 'dr. Sarah Amanda',
			kehadiran: 'hadir',
			jumlah: 1,
			likes: 9,
			ucapan:
				'Barakallahu lakuma wa baraka alaikuma wa jama’a bainakuma fii khair. Bahagia selalu ya kalian berdua!',
			waktu: '2 jam yang lalu'
		},
		{
			id: 3,
			nama: 'Dimas Aditya (Alumni FT)',
			kehadiran: 'hadir',
			jumlah: 2,
			likes: 6,
			ucapan:
				'Lancar sampai hari H bro Rizky! Pasti hadir meramaikan hari bahagia kalian berdua.',
			waktu: '5 jam yang lalu'
		},
		{
			id: 4,
			nama: 'Keluarga Besar dr. Herman',
			kehadiran: 'ragu',
			jumlah: 1,
			likes: 4,
			ucapan:
				'Selamat atas pernikahannya Anin & Rizky. Mohon maaf kami usahakan hadir, doa terbaik selalu menyertai.',
			waktu: '1 hari yang lalu'
		}
	],
	daftarTamu: [
		{ id: 't1', nama: 'Bapak Budi Santoso & Keluarga', nomorWa: '08123456789' },
		{ id: 't2', nama: 'dr. Sarah Amanda', nomorWa: '08571234567' },
		{ id: 't3', nama: 'Dimas Aditya & Rekan', nomorWa: '08139876543' },
		{ id: 't4', nama: 'Sahabat SMA 1 Bandung', nomorWa: '' }
	]
};

const STORAGE_KEY = 'evermomen_wedding_data_v1';
const STORAGE_USER_KEY = 'evermomen_user_session_v1';
const STORAGE_PAYMENTS_KEY = 'evermomen_payments_history_v1';

const DEFAULT_USER = {
	isLoggedIn: false,
	id: null,
	name: 'Pengunjung',
	email: '',
	tier: 'free', // 'free' | 'premium'
	planName: 'Paket Gratis'
};

class WeddingStore {
	data = $state(this.loadInitial());
	activeGuest = $state('Tamu Undangan');
	user = $state(this.loadUserInitial());
	payments = $state(this.loadPaymentsInitial());

	loadUserInitial() {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem(STORAGE_USER_KEY);
				if (saved) {
					return { ...DEFAULT_USER, ...JSON.parse(saved) };
				}
			} catch (e) {
				console.warn('Gagal membaca data user dari localStorage:', e);
			}
		}
		return JSON.parse(JSON.stringify(DEFAULT_USER));
	}

	saveUser() {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(this.user));
			} catch (e) {
				console.error('Gagal menyimpan data user ke localStorage:', e);
			}
		}
	}

	loadPaymentsInitial() {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem(STORAGE_PAYMENTS_KEY);
				if (saved) {
					return JSON.parse(saved);
				}
			} catch (e) {
				console.warn('Gagal membaca data payments dari localStorage:', e);
			}
		}
		return [];
	}

	savePayments() {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_PAYMENTS_KEY, JSON.stringify(this.payments));
			} catch (e) {
				console.error('Gagal menyimpan data payments ke localStorage:', e);
			}
		}
	}

	// Real Supabase Auth Methods
	async signUpWithSupabase(email, password, name, phone) {
		try {
			const cleanEmail = email.trim().toLowerCase();
			const cleanName = (name || '').trim();
			const cleanPhone = (phone || '').trim();

			// 1. Direct instant registration in Supabase DB (No email rate limit!)
			const { data: userId, error: rpcErr } = await supabase.rpc('register_user_direct', {
				p_email: cleanEmail,
				p_password: password,
				p_name: cleanName,
				p_phone: cleanPhone,
				p_tier: 'free'
			});

			if (rpcErr) {
				console.warn('RPC register error:', rpcErr);
				if (rpcErr.message && rpcErr.message.includes('sudah terdaftar')) {
					return { success: false, error: rpcErr.message };
				}
				// Fallback to standard signUp if RPC is unreachable
				const { data: stdData, error: stdErr } = await supabase.auth.signUp({
					email: cleanEmail,
					password: password,
					options: {
						data: {
							full_name: cleanName,
							phone: cleanPhone,
							tier: 'free'
						}
					}
				});
				if (stdErr) throw stdErr;
				if (stdData?.user) {
					this.login(cleanName || cleanEmail.split('@')[0], cleanEmail, 'free', stdData.user.id);
					this.syncUserTierFromDatabase(stdData.user.id);
					return { success: true, user: stdData.user, session: stdData.session };
				}
			}

			// 2. Immediately sign in with Supabase Auth to establish active session
			const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
				email: cleanEmail,
				password: password
			});

			if (loginErr) {
				console.warn('Direct signin error after RPC, manual session login:', loginErr);
			}

			const fullName = cleanName || cleanEmail.split('@')[0];
			this.login(fullName, cleanEmail, 'free', userId || loginData?.user?.id);
			if (userId || loginData?.user?.id) {
				this.syncUserTierFromDatabase(userId || loginData?.user?.id);
			}

			return {
				success: true,
				user: loginData?.user || { id: userId, email: cleanEmail },
				session: loginData?.session
			};
		} catch (err) {
			console.error('Supabase SignUp Error:', err);
			let msg = err.message || 'Gagal mendaftarkan akun.';
			if (msg.toLowerCase().includes('rate limit')) {
				msg =
					'Batas pengiriman email Supabase tercapai. Silakan coba kembali beberapa saat lagi atau login jika akun sudah ada.';
			}
			return { success: false, error: msg };
		}
	}

	async signInWithSupabase(email, password) {
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password: password
			});

			if (error) {
				throw error;
			}

			if (data?.user) {
				const meta = data.user.user_metadata || {};
				const fullName = meta.full_name || meta.name || email.split('@')[0];
				const initialTier = meta.tier === 'premium' ? 'premium' : 'free';
				this.login(fullName, email, initialTier, data.user.id);
				// Verify directly from Supabase profiles database table
				this.syncUserTierFromDatabase(data.user.id);
			}
			return { success: true, user: data?.user, session: data?.session };
		} catch (err) {
			console.error('Supabase SignIn Error:', err);
			let msg = err.message || 'Email atau kata sandi tidak sesuai.';
			if (msg.toLowerCase().includes('invalid login credentials')) {
				msg = 'Email atau kata sandi salah. Silakan periksa kembali.';
			}
			return { success: false, error: msg };
		}
	}

	async signOutSupabase() {
		try {
			await supabase.auth.signOut();
		} catch (e) {
			console.warn('Supabase SignOut error:', e);
		}
		this.logout();
	}

	initSupabaseAuth() {
		if (typeof window === 'undefined') return;
		try {
			// Check current session
			supabase.auth.getSession().then(({ data: { session } }) => {
				if (session?.user) {
					const meta = session.user.user_metadata || {};
					const fullName = meta.full_name || meta.name || session.user.email?.split('@')[0];
					const initialTier = meta.tier === 'premium' ? 'premium' : 'free';
					this.login(fullName, session.user.email, initialTier, session.user.id);
					this.syncUserTierFromDatabase(session.user.id);
				} else {
					if (this.user.tier === 'premium' && !this.user.id) {
						this.logout();
					}
				}
			});

			// Listen for auth state change
			supabase.auth.onAuthStateChange((_event, session) => {
				if (session?.user) {
					const meta = session.user.user_metadata || {};
					const fullName = meta.full_name || meta.name || session.user.email?.split('@')[0];
					const initialTier = meta.tier === 'premium' ? 'premium' : 'free';
					this.login(fullName, session.user.email, initialTier, session.user.id);
					this.syncUserTierFromDatabase(session.user.id);
				} else if (_event === 'SIGNED_OUT') {
					this.logout();
				}
			});
		} catch (e) {
			console.warn('Init Supabase Auth warning:', e);
		}
	}

	async syncUserTierFromDatabase(userId) {
		if (!userId) return;
		try {
			const { data: prof, error } = await supabase
				.from('profiles')
				.select('tier, package_name, name')
				.eq('id', userId)
				.maybeSingle();

			if (!error && prof) {
				const verifiedTier = prof.tier === 'premium' ? 'premium' : 'free';
				this.user.tier = verifiedTier;
				this.user.planName =
					prof.package_name ||
					(verifiedTier === 'premium' ? 'Paket Premium All-in-One' : 'Paket Gratis');
				if (prof.name) this.user.name = prof.name;
				this.saveUser();
			}
		} catch (err) {
			console.warn('Sync tier from database warning:', err);
		}
	}

	// Payment Gateway & Checkout methods
	createPaymentOrder(packageName, amount, paymentMethod = 'qris') {
		const invoiceId = 'INV-EVM-' + Math.floor(100000 + Math.random() * 900000);
		const order = {
			id: 'ord_' + Date.now(),
			invoiceId,
			packageName: packageName || 'Paket Premium All-in-One',
			amount: amount || 140000,
			adminFee: 0,
			totalAmount: amount || 140000,
			paymentMethod, // 'qris' | 'bca_va' | 'mandiri_va' | 'bri_va' | 'manual_bank'
			customerName: this.user.name || 'Calon Pengantin',
			customerEmail: this.user.email || 'customer@kisahnikah.web.id',
			status: 'PENDING',
			createdAt: new Date().toISOString(),
			paidAt: null
		};

		this.payments = [order, ...this.payments];
		this.savePayments();

		// Optional: attempt logging order to Supabase table if available
		try {
			supabase
				.from('orders')
				.insert([
					{
						invoice_id: order.invoiceId,
						package_name: order.packageName,
						amount: order.totalAmount,
						payment_method: order.paymentMethod,
						customer_email: order.customerEmail,
						status: 'PENDING'
					}
				])
				.then(() => {})
				.catch(() => {});
		} catch (_) {}

		return order;
	}

	confirmPayment(invoiceId) {
		const orderIndex = this.payments.findIndex((p) => p.invoiceId === invoiceId);
		let confirmedOrder = null;

		if (orderIndex !== -1) {
			this.payments[orderIndex].status = 'PAID';
			this.payments[orderIndex].paidAt = new Date().toISOString();
			confirmedOrder = this.payments[orderIndex];
		} else {
			confirmedOrder = {
				invoiceId,
				packageName: 'Paket Premium All-in-One',
				totalAmount: 140000,
				status: 'PAID',
				paidAt: new Date().toISOString()
			};
			this.payments = [confirmedOrder, ...this.payments];
		}

		this.savePayments();
		this.upgradeToPremium();

		// Update Supabase user metadata or order status
		try {
			supabase.auth.updateUser({
				data: { tier: 'premium' }
			});
			supabase
				.from('orders')
				.update({ status: 'PAID', paid_at: new Date().toISOString() })
				.eq('invoice_id', invoiceId)
				.then(() => {})
				.catch(() => {});
		} catch (_) {}

		return confirmedOrder;
	}

	login(name, email, tier = 'free', id = null) {
		this.user = {
			isLoggedIn: true,
			id: id || this.user?.id || null,
			name: name || (tier === 'premium' ? 'Rizky Pratama (VIP)' : 'Calon Pengantin'),
			email: email || 'user@example.com',
			tier: tier,
			planName: tier === 'premium' ? 'Paket Premium All-in-One' : 'Paket Gratis'
		};
		this.saveUser();
		if (this.user.id) {
			this.loadUserWeddingData(this.user.id);
		}
	}

	async loadUserWeddingData(userId) {
		try {
			const { data, error } = await supabase
				.from('weddings')
				.select('data, template_id')
				.eq('user_id', userId)
				.maybeSingle();

			if (!error && data?.data) {
				this.data = { ...DEFAULT_WEDDING_DATA, ...data.data };
				if (data.template_id) this.data.templateId = data.template_id;
				if (typeof window !== 'undefined') {
					localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
				}
			}
		} catch (e) {
			console.warn('Load user wedding data error:', e);
		}
	}

	logout() {
		this.user = JSON.parse(JSON.stringify(DEFAULT_USER));
		this.saveUser();
	}

	upgradeToPremium() {
		this.user.isLoggedIn = true;
		this.user.tier = 'premium';
		this.user.planName = 'Paket Premium All-in-One';
		if (!this.user.name || this.user.name === 'Pengunjung') {
			this.user.name = 'Rizky Pratama (VIP)';
			this.user.email = 'rizky@kisahnikah.web.id';
		}
		this.saveUser();
		if (this.user.id) {
			try {
				supabase.from('profiles').update({ tier: 'premium', package_name: 'Paket Premium All-in-One' }).eq('id', this.user.id).then(() => {}).catch(() => {});
			} catch (_) {}
		}
	}

	isTemplateUnlocked(templateId) {
		const tpl = TEMPLATES.find((t) => t.id === templateId);
		if (!tpl) return true;
		if (tpl.tier === 'free' || !tpl.isPremium) return true;
		if (!this.user.isLoggedIn) return false;
		if (this.user.tier === 'vip') return true;
		if (this.user.tier === 'premium' && tpl.tier !== 'vip') return true;
		return false;
	}

	loadInitial() {
		if (typeof window !== 'undefined') {
			try {
				const saved = localStorage.getItem(STORAGE_KEY);
				if (saved) {
					const parsed = JSON.parse(saved);
					return { ...DEFAULT_WEDDING_DATA, ...parsed };
				}
			} catch (e) {
				console.warn('Gagal membaca data dari localStorage:', e);
			}
		}
		return JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA));
	}

	save() {
		if (typeof window !== 'undefined') {
			try {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
			} catch (e) {
				console.error('Gagal menyimpan ke localStorage:', e);
			}
		}

		// Also persist wedding data to Supabase weddings table if user is logged in
		if (this.user?.id) {
			try {
				supabase
					.from('weddings')
					.upsert(
						{
							user_id: this.user.id,
							template_id: this.data.templateId,
							data: this.data,
							updated_at: new Date().toISOString()
						},
						{ onConflict: 'user_id' }
					)
					.then(() => {})
					.catch(() => {});
			} catch (_) {}
		}
	}

	reset() {
		this.data = JSON.parse(JSON.stringify(DEFAULT_WEDDING_DATA));
		this.save();
	}

	setTemplate(templateId) {
		this.data.templateId = templateId;
		this.save();
	}

	setMusicTrack(trackId) {
		const track = MUSIC_TRACKS.find((t) => t.id === trackId);
		if (track) {
			this.data.music.trackId = track.id;
			this.data.music.title = track.title;
			this.data.music.url = track.url;
			this.save();
		}
	}

	// RSVP methods
	addRsvp(nama, kehadiran, jumlah, ucapan) {
		const newRsvp = {
			id: Date.now(),
			nama: nama.trim() || 'Tamu Undangan',
			kehadiran: kehadiran || 'hadir',
			jumlah: parseInt(jumlah, 10) || 1,
			ucapan: ucapan.trim() || 'Memberikan doa restu terbaik untuk kedua mempelai.',
			waktu: 'Baru saja'
		};
		this.data.rsvps = [newRsvp, ...this.data.rsvps];
		this.save();

		// Save to Supabase rsvps table
		try {
			supabase
				.from('rsvps')
				.insert([
					{
						nama: newRsvp.nama,
						kehadiran: newRsvp.kehadiran,
						jumlah: newRsvp.jumlah,
						ucapan: newRsvp.ucapan
					}
				])
				.then(() => {})
				.catch(() => {});
		} catch (_) {}

		return newRsvp;
	}

	// Guest management methods
	addTamu(nama, nomorWa) {
		const newTamu = {
			id: 't_' + Date.now(),
			nama: nama.trim(),
			nomorWa: (nomorWa || '').trim()
		};
		this.data.daftarTamu = [newTamu, ...this.data.daftarTamu];
		this.save();
		return newTamu;
	}

	removeTamu(id) {
		this.data.daftarTamu = this.data.daftarTamu.filter((t) => t.id !== id);
		this.save();
	}

	// Milestone Story methods
	addCerita(tahun, judul, isi) {
		const item = {
			id: 'c_' + Date.now(),
			tahun: tahun.trim(),
			judul: judul.trim(),
			isi: isi.trim()
		};
		this.data.cerita = [...this.data.cerita, item];
		this.save();
	}

	removeCerita(id) {
		this.data.cerita = this.data.cerita.filter((c) => c.id !== id);
		this.save();
	}

	// Photo Gallery methods
	addFotoGaleri(url, caption) {
		const item = {
			id: 'g_' + Date.now(),
			url: url.trim(),
			caption: caption ? caption.trim() : 'Momen Bahagia'
		};
		this.data.galeri = [...this.data.galeri, item];
		this.save();
	}

	removeFotoGaleri(id) {
		this.data.galeri = this.data.galeri.filter((g) => g.id !== id);
		this.save();
	}

	// Bank Account methods
	addRekening(bank, noRek, atasNama) {
		const item = {
			id: 'r_' + Date.now(),
			bank: bank.trim(),
			noRek: noRek.trim(),
			atasNama: atasNama.trim(),
			icon: 'bi-credit-card-2-front'
		};
		this.data.kado.rekening = [...this.data.kado.rekening, item];
		this.save();
	}

	removeRekening(id) {
		this.data.kado.rekening = this.data.kado.rekening.filter((r) => r.id !== id);
		this.save();
	}

	// Export / Import JSON
	exportJson() {
		return JSON.stringify(this.data, null, 2);
	}

	importJson(jsonString) {
		try {
			const parsed = JSON.parse(jsonString);
			this.data = { ...DEFAULT_WEDDING_DATA, ...parsed };
			this.save();
			return true;
		} catch (e) {
			console.error('Invalid JSON data:', e);
			return false;
		}
	}

	// Generate WhatsApp invitation text
	generateWaText(guestName, baseUrl = '') {
		const groom = this.data.mempelai.pria.namaPanggilan;
		const bride = this.data.mempelai.wanita.namaPanggilan;
		const link = `${baseUrl}/invite?to=${encodeURIComponent(guestName)}`;
		const akadDate = this.data.acara.akad.tanggal;

		return (
			`*Kepada Yth. Bapak/Ibu/Saudara/i:*\n` +
			`_${guestName}_\n\n` +
			`_Assalamu’alaikum Warahmatullahi Wabarakatuh_\n\n` +
			`Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri hari bahagia pernikahan kami:\n\n` +
			`💍 *${this.data.mempelai.pria.namaLengkap}*\n` +
			`& *${this.data.mempelai.wanita.namaLengkap}*\n\n` +
			`🗓️ Tanggal: *${akadDate}*\n` +
			`📍 Tempat: *${this.data.acara.resepsi.tempat}*\n\n` +
			`Untuk melihat informasi lengkap jadwal acara, lokasi, dan konfirmasi kehadiran (RSVP), silakan buka tautan undangan digital kami berikut:\n` +
			`👉 ${link}\n\n` +
			`Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu.\n\n` +
			`Terima kasih.\n` +
			`Salam hangat,\n` +
			`*${groom} & ${bride}*`
		);
	}
}

export const weddingStore = new WeddingStore();
