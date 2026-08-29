<script>
	import { weddingStore } from '$lib/weddingStore.svelte.js';
	import AuthModal from '$lib/components/AuthModal.svelte';

	let isMobileMenuOpen = $state(false);
	let isAuthModalOpen = $state(false);

	function toggleMenu() {
		isMobileMenuOpen = !isMobileMenuOpen;
	}

	function closeMenu() {
		isMobileMenuOpen = false;
	}

	function handleLogout() {
		weddingStore.logout();
	}
</script>

<header class="navbar-wrapper">
	<div class="nav-container">
		<a href="/" class="brand-logo" onclick={closeMenu}>
			<img src="/logo.png" alt="Logo Kisah Nikah" class="nav-logo-img" />
			<div class="brand-text">
				<span class="brand-title">Kisah Nikah</span>
				<span class="brand-tagline">kisahnikah.web.id</span>
			</div>
		</a>

		<nav class="desktop-nav">
			<a href="/#beranda" class="nav-link">Beranda</a>
			<a href="/#fitur" class="nav-link">Fitur Unggulan</a>
			<a href="/#template" class="nav-link">Katalog Template</a>
			<a href="/#harga" class="nav-link highlight-nav-link">Harga & Paket</a>
			<a href="/#cara-buat" class="nav-link">Cara Buat</a>
			<a href="/#testimoni" class="nav-link">Testimoni</a>
			<a href="/#faq" class="nav-link">FAQ</a>
		</nav>

		<div class="nav-actions">
			{#if weddingStore.user.isLoggedIn}
				<div class="user-profile-badge">
					<div class="user-avatar-circle">
						<i class="bi bi-person-fill"></i>
					</div>
					<div class="user-text-info">
						<span class="user-name-label">{weddingStore.user.name}</span>
						{#if weddingStore.user.tier === 'vip'}
							<span class="tier-pill-pro" style="background: linear-gradient(135deg, #9e1b32, #dfb15b);">👑 VIP Exclusive</span>
						{:else if weddingStore.user.tier === 'premium'}
							<span class="tier-pill-pro">⭐ Premium Pro</span>
						{:else}
							<span class="tier-pill-free">Akun Free</span>
						{/if}
					</div>
					<button
						type="button"
						class="btn-logout-nav"
						onclick={handleLogout}
						title="Keluar / Logout"
						aria-label="Logout"
					>
						<i class="bi bi-box-arrow-right"></i>
					</button>
				</div>
			{:else}
				<button
					type="button"
					class="btn btn-login-nav"
					onclick={() => (isAuthModalOpen = true)}
				>
					<i class="bi bi-person-circle"></i>
					<span>Masuk / Daftar</span>
				</button>
			{/if}

			<button
				type="button"
				class="btn btn-primary-nav"
				onclick={() => {
					if (!weddingStore.user.isLoggedIn) {
						isAuthModalOpen = true;
					} else {
						window.location.href = '/editor';
					}
				}}
				title="Mulai Buat Undangan"
			>
				<i class="bi bi-magic"></i>
				<span>Buat Undangan</span>
			</button>
			<button
				class="mobile-toggle"
				onclick={toggleMenu}
				aria-label="Toggle navigasi"
				aria-expanded={isMobileMenuOpen}
			>
				<i class="bi {isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'}"></i>
			</button>
		</div>
	</div>

	{#if isMobileMenuOpen}
		<div class="mobile-drawer">
			<div class="mobile-nav-links">
				<a href="/#beranda" onclick={closeMenu}><i class="bi bi-house"></i> Beranda</a>
				<a href="/#fitur" onclick={closeMenu}><i class="bi bi-stars"></i> Fitur Unggulan</a>
				<a href="/#template" onclick={closeMenu}><i class="bi bi-palette"></i> Katalog Template</a>
				<a href="/#harga" onclick={closeMenu}><i class="bi bi-tag-fill"></i> Harga & Paket</a>
				<a href="/#cara-buat" onclick={closeMenu}><i class="bi bi-check2-circle"></i> Cara Buat</a>
				<a href="/#testimoni" onclick={closeMenu}><i class="bi bi-chat-quote"></i> Testimoni</a>
				<a href="/#faq" onclick={closeMenu}><i class="bi bi-question-circle"></i> FAQ</a>
			</div>
			<div class="mobile-nav-actions">
				{#if !weddingStore.user.isLoggedIn}
					<button
						type="button"
						class="btn btn-login-nav w-100"
						onclick={() => {
							closeMenu();
							isAuthModalOpen = true;
						}}
					>
						<i class="bi bi-person-circle"></i> Masuk / Daftar Akun
					</button>
				{:else}
					<div class="mobile-user-status">
						<span>Masuk sebagai: <strong>{weddingStore.user.name}</strong> ({weddingStore.user.tier === 'vip' ? '👑 VIP' : (weddingStore.user.tier === 'premium' ? '⭐ Premium' : 'Free')})</span>
						<button type="button" class="btn btn-secondary-nav w-100" onclick={handleLogout}>
							<i class="bi bi-box-arrow-right"></i> Logout
						</button>
					</div>
				{/if}
				<button
					type="button"
					class="btn btn-primary-nav w-100"
					onclick={() => {
						closeMenu();
						if (!weddingStore.user.isLoggedIn) {
							isAuthModalOpen = true;
						} else {
							window.location.href = '/editor';
						}
					}}
				>
					<i class="bi bi-magic"></i> Buat Undangan Sekarang
				</button>
			</div>
		</div>
	{/if}
</header>

<AuthModal
	isOpen={isAuthModalOpen}
	onClose={() => (isAuthModalOpen = false)}
	onSuccess={() => {
		window.location.href = '/editor';
	}}
/>

<style>
	.navbar-wrapper {
		position: sticky;
		top: 0;
		z-index: 1100;
		background: rgba(255, 255, 255, 0.94);
		backdrop-filter: blur(14px);
		border-bottom: 1px solid rgba(226, 215, 197, 0.45);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0.9rem 1.5rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1.5rem;
	}

	.brand-logo {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: #1a1a1a;
	}

	.nav-logo-img {
		width: 44px;
		height: 44px;
		object-fit: contain;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	.brand-text {
		display: flex;
		flex-direction: column;
	}

	.brand-title {
		font-family: 'Cinzel', serif;
		font-weight: 800;
		font-size: 1.35rem;
		letter-spacing: 1px;
		color: #1a1918;
		line-height: 1.1;
	}

	.brand-tagline {
		font-size: 0.68rem;
		letter-spacing: 2px;
		text-transform: uppercase;
		color: #a88439;
		font-weight: 600;
	}

	.desktop-nav {
		display: flex;
		align-items: center;
		gap: 1.8rem;
	}

	.nav-link {
		font-size: 0.92rem;
		font-weight: 500;
		color: #4b4742;
		text-decoration: none;
		transition: all 0.2s ease;
		position: relative;
		padding: 0.3rem 0;
	}

	.nav-link:hover {
		color: #c5a059;
	}

	.nav-link:hover::after {
		content: '';
		position: absolute;
		bottom: 0;
		left: 0;
		width: 100%;
		height: 2px;
		background: #c5a059;
		border-radius: 2px;
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 0.65rem 1.25rem;
		border-radius: 30px;
		font-size: 0.88rem;
		font-weight: 600;
		text-decoration: none;
		transition: all 0.25s ease;
		cursor: pointer;
		border: none;
	}

	.highlight-nav-link {
		color: #a88439;
		font-weight: 700;
	}

	.btn-login-nav {
		background: #fdfaf5;
		color: #4b3e28;
		border: 1px solid #ebdcc8;
		padding: 0.6rem 1.1rem;
		border-radius: 25px;
		font-size: 0.84rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		transition: all 0.2s ease;
	}

	.btn-login-nav:hover {
		background: #f5ece0;
		color: #1a1408;
		border-color: #c5a059;
	}

	.user-profile-badge {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		background: #fcfaf7;
		border: 1px solid #e7ded2;
		border-radius: 30px;
		padding: 0.3rem 0.8rem 0.3rem 0.4rem;
	}

	.user-avatar-circle {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		color: #ffffff;
		font-size: 0.9rem;
	}

	.user-text-info {
		display: flex;
		flex-direction: column;
		text-align: left;
	}

	.user-name-label {
		font-size: 0.78rem;
		font-weight: 700;
		color: #1a1918;
		max-width: 110px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.tier-pill-pro {
		font-size: 0.65rem;
		font-weight: 800;
		color: #b45309;
	}

	.tier-pill-free {
		font-size: 0.65rem;
		font-weight: 600;
		color: #6b7280;
	}

	.btn-logout-nav {
		background: none;
		border: none;
		color: #9ca3af;
		cursor: pointer;
		padding: 0.2rem;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
	}

	.btn-logout-nav:hover {
		color: #ef4444;
	}

	.mobile-user-status {
		background: #fbf9f4;
		border: 1px solid #ebdcc8;
		border-radius: 12px;
		padding: 0.8rem;
		font-size: 0.82rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		text-align: center;
	}

	.btn-secondary-nav {
		background: #f7f3ec;
		color: #5c4d34;
		border: 1px solid #e5d8c3;
	}

	.btn-secondary-nav:hover {
		background: #eee5d4;
		color: #3b301f;
		transform: translateY(-1px);
	}

	.btn-primary-nav {
		background: linear-gradient(135deg, #c5a059 0%, #e2c079 50%, #9e7529 100%);
		color: #1a1408;
		font-weight: 700;
		box-shadow: 0 4px 15px rgba(197, 160, 89, 0.35);
	}

	.btn-primary-nav:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(197, 160, 89, 0.45);
		color: #000;
	}

	.mobile-toggle {
		display: none;
		background: none;
		border: none;
		font-size: 1.6rem;
		color: #333;
		cursor: pointer;
		padding: 0.3rem;
	}

	.mobile-drawer {
		display: none;
		background: #ffffff;
		border-top: 1px solid #eee;
		padding: 1.25rem 1.5rem;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
	}

	.mobile-nav-links {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		margin-bottom: 1.25rem;
	}

	.mobile-nav-links a {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		text-decoration: none;
		color: #333;
		font-size: 0.95rem;
		font-weight: 500;
		padding: 0.4rem 0;
	}

	.mobile-nav-links a i {
		color: #c5a059;
		font-size: 1.1rem;
	}

	.mobile-nav-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.w-100 {
		width: 100%;
	}

	@media (max-width: 991px) {
		.desktop-nav {
			display: none;
		}

		.btn-secondary-nav {
			display: none;
		}

		.mobile-toggle {
			display: block;
		}

		.mobile-drawer {
			display: block;
		}
	}
</style>
