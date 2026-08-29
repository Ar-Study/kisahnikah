<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import { weddingStore } from '$lib/weddingStore.svelte.js';

	let newName = $state('');
	let newEmail = $state('');
	let newPhone = $state('');
	let newPassword = $state('');
	let newTier = $state('premium'); // 'premium' | 'vip'

	let isSubmitting = $state(false);
	let alertMsg = $state('');
	let alertType = $state('success'); // 'success' | 'danger'
	let generatedWaText = $state('');
	let lastCreatedUser = $state(null);

	let profilesList = $state([]);
	let ordersList = $state([]);
	let isLoadingData = $state(true);

	// Admin Auth Gate states
	let isAdminAuthenticated = $state(false);
	let adminEmail = $state('admin@evermomen.com');
	let adminPassword = $state('');
	let adminLoginError = $state('');
	let isAdminLoggingIn = $state(false);

	onMount(async () => {
		if (typeof window !== 'undefined') {
			const sessionAuth = sessionStorage.getItem('evermomen_admin_auth');
			if (sessionAuth === 'true') {
				isAdminAuthenticated = true;
				loadAdminData();
				return;
			}

			// Check Supabase session for admin
			const {
				data: { session }
			} = await supabase.auth.getSession();
			if (session?.user?.email) {
				const { data: prof } = await supabase
					.from('profiles')
					.select('role')
					.eq('id', session.user.id)
					.maybeSingle();
				if (prof?.role === 'admin' || session.user.email === 'admin@evermomen.com') {
					isAdminAuthenticated = true;
					sessionStorage.setItem('evermomen_admin_auth', 'true');
					loadAdminData();
				}
			}
		}
	});

	async function handleAdminLogin(e) {
		e.preventDefault();
		adminLoginError = '';
		isAdminLoggingIn = true;

		const email = adminEmail.trim().toLowerCase();
		const pass = adminPassword.trim();

		// Master Admin Passkey Check
		if (pass === 'evermomen2026' || (email === 'admin@evermomen.com' && pass === 'admin123')) {
			isAdminAuthenticated = true;
			if (typeof window !== 'undefined') {
				sessionStorage.setItem('evermomen_admin_auth', 'true');
			}
			loadAdminData();
			isAdminLoggingIn = false;
			return;
		}

		// Or check via Supabase Auth signIn
		try {
			const { data, error } = await supabase.auth.signInWithPassword({
				email: email,
				password: pass
			});

			if (!error && data?.user) {
				const { data: prof } = await supabase
					.from('profiles')
					.select('role')
					.eq('id', data.user.id)
					.maybeSingle();

				if (prof?.role === 'admin' || email.includes('admin')) {
					isAdminAuthenticated = true;
					if (typeof window !== 'undefined') {
						sessionStorage.setItem('evermomen_admin_auth', 'true');
					}
					loadAdminData();
					isAdminLoggingIn = false;
					return;
				}
			}
		} catch (err) {
			console.warn('Supabase admin login error:', err);
		}

		isAdminLoggingIn = false;
		adminLoginError = 'Akses ditolak. Email atau kata sandi admin salah.';
	}

	function handleAdminLogout() {
		if (typeof window !== 'undefined') {
			sessionStorage.removeItem('evermomen_admin_auth');
		}
		isAdminAuthenticated = false;
		adminPassword = '';
	}

	async function loadAdminData() {
		isLoadingData = true;
		try {
			// Load profiles
			const { data: profiles, error: pErr } = await supabase
				.from('profiles')
				.select('*')
				.order('created_at', { ascending: false });

			if (!pErr && profiles) {
				profilesList = profiles;
			}

			// Load orders
			const { data: orders, error: oErr } = await supabase
				.from('orders')
				.select('*')
				.order('created_at', { ascending: false });

			if (!oErr && orders) {
				ordersList = orders;
			}
		} catch (err) {
			console.warn('Load admin data error:', err);
		} finally {
			isLoadingData = false;
		}
	}

	async function handleCreatePaidAccount(e) {
		e.preventDefault();
		if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) return;

		isSubmitting = true;
		alertMsg = '';

		try {
			const targetUserTier = newTier === 'vip' ? 'vip' : 'premium';
			const packageName =
				newTier === 'vip' ? 'Paket VIP Custom Assist (Rp 250.000)' : 'Paket Premium All-in-One (Rp 140.000)';

			// Direct registration in Supabase Auth & profiles with tier: 'vip' | 'premium' (Bypasses email rate limit!)
			const { data: userId, error: rpcErr } = await supabase.rpc('register_user_direct', {
				p_email: newEmail.trim().toLowerCase(),
				p_password: newPassword.trim(),
				p_name: newName.trim(),
				p_phone: newPhone.trim(),
				p_tier: targetUserTier
			});

			if (rpcErr) {
				console.warn('RPC register fallback:', rpcErr);
				if (rpcErr.message && rpcErr.message.includes('sudah terdaftar')) {
					throw new Error(rpcErr.message);
				}
				const { data: authData, error: authErr } = await supabase.auth.signUp({
					email: newEmail.trim(),
					password: newPassword.trim(),
					options: {
						data: {
							full_name: newName.trim(),
							phone: newPhone.trim(),
							tier: targetUserTier
						}
					}
				});
				if (authErr) throw authErr;
			}

			// Ensure profiles table has package_name and tier: targetUserTier
			await supabase.from('profiles').update({
				tier: targetUserTier,
				package_name: packageName,
				updated_at: new Date().toISOString()
			}).eq('email', newEmail.trim().toLowerCase());

			// Format WhatsApp credentials message
			const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
			const waMessage =
				`Halo Kak *${newName.trim()}*,\n` +
				`Terima kasih telah memesan di *Kisah Nikah*! Pembayaran Anda telah kami terima dan Akun ${newTier === 'vip' ? 'VIP Exclusive' : 'Premium'} Anda sudah siap digunakan.\n\n` +
				`Berikut detail login Anda:\n` +
				`🌐 *Link Login:* ${origin}/ (klik menu Masuk di pojok kanan atas)\n` +
				`📧 *Email:* ${newEmail.trim()}\n` +
				`🔑 *Kata Sandi:* ${newPassword.trim()}\n` +
				`👑 *Status Paket:* *${packageName}*\n\n` +
				`Seluruh template mewah dan fitur tanpa batas (unlimited tamu, kado rekening, galeri HD) telah terbuka penuh. Selamat mendesain undangan pernikahan Anda!\n\n` +
				`Salam hangat,\n*Tim Kisah Nikah* (kisahnikah.web.id)`;

			generatedWaText = waMessage;
			lastCreatedUser = {
				name: newName.trim(),
				email: newEmail.trim(),
				phone: newPhone.trim(),
				password: newPassword.trim(),
				packageName
			};

			alertType = 'success';
			alertMsg = `Akun Premium untuk "${newName}" berhasil dibuat di database!`;

			// Reset form fields
			newName = '';
			newEmail = '';
			newPhone = '';
			newPassword = '';

			// Refresh data list
			loadAdminData();
		} catch (err) {
			console.error('Error create account:', err);
			alertType = 'danger';
			alertMsg = err.message || 'Gagal membuat akun di Supabase.';
		} finally {
			isSubmitting = false;
		}
	}

	function sendCredentialsViaWhatsApp() {
		if (!lastCreatedUser) return;
		let phone = (lastCreatedUser.phone || '').replace(/[^0-9]/g, '');
		if (phone.startsWith('0')) {
			phone = '62' + phone.slice(1);
		}
		const encoded = encodeURIComponent(generatedWaText);
		const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
		window.open(url, '_blank');
	}

	async function handleUpgradeUserTier(profileId, userEmail) {
		try {
			await supabase.from('profiles').update({ tier: 'premium', package_name: 'Paket Premium All-in-One' }).eq('id', profileId);
			alertType = 'success';
			alertMsg = `Pengguna ${userEmail} berhasil di-upgrade ke status Premium Pro!`;
			loadAdminData();
		} catch (e) {
			console.error(e);
		}
	}
</script>

<svelte:head>
	<title>Panel Admin — Pembuatan Akun & Order Kisah Nikah</title>
</svelte:head>

<div class="admin-page-root">
	{#if !isAdminAuthenticated}
		<!-- ADMIN LOGIN GATE SCREEN -->
		<div class="admin-login-screen">
			<div class="admin-login-card">
				<div class="login-badge-head">
					<div class="admin-shield-icon">
						<img src="/logo.png" alt="Logo" class="admin-gate-logo" />
					</div>
					<h2 class="login-portal-title">Panel Admin Kisah Nikah</h2>
					<p class="login-portal-sub">Masukkan kredensial administrator untuk membuka akses database & manajemen akun.</p>
				</div>

				{#if adminLoginError}
					<div class="alert alert-danger">
						<i class="bi bi-exclamation-triangle-fill"></i>
						<span>{adminLoginError}</span>
					</div>
				{/if}

				<form onsubmit={handleAdminLogin} class="admin-auth-form">
					<div class="form-group">
						<label for="adm-email">Email Admin:</label>
						<div class="input-with-icon">
							<i class="bi bi-person-fill-lock"></i>
							<input
								type="email"
								id="adm-email"
								bind:value={adminEmail}
								placeholder="admin@evermomen.com"
								required
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="adm-pass">Kata Sandi / Kunci Akses:</label>
						<div class="input-with-icon">
							<i class="bi bi-key-fill"></i>
							<input
								type="password"
								id="adm-pass"
								bind:value={adminPassword}
								placeholder="••••••••"
								required
							/>
						</div>
					</div>

					<button type="submit" class="btn btn-admin-login" disabled={isAdminLoggingIn}>
						{#if isAdminLoggingIn}
							<i class="bi bi-arrow-repeat spin-icon"></i> Memverifikasi...
						{:else}
							<i class="bi bi-box-arrow-in-right"></i> Masuk ke Panel Admin
						{/if}
					</button>
				</form>

				<div class="login-portal-footer">
					<div class="quick-pass-hint">
						<i class="bi bi-info-circle-fill"></i>
						<span>Kunci Akses Cepat: <strong>evermomen2026</strong></span>
					</div>
					<a href="/" class="back-link">
						<i class="bi bi-arrow-left"></i> Kembali ke Beranda Utama
					</a>
				</div>
			</div>
		</div>
	{:else}
		<!-- AUTHENTICATED ADMIN DASHBOARD -->
		<header class="admin-header">
			<div class="admin-container header-inner">
				<div class="brand-box">
					<img src="/logo.png" alt="Logo" class="admin-header-logo" />
					<div>
						<h1 class="brand-title">Admin Kisah Nikah Studio</h1>
						<span class="brand-sub">Panel Pembuatan Akun Pelanggan Berbayar & Database</span>
					</div>
				</div>

				<div class="admin-header-actions">
					<span class="badge-admin-on">
						<i class="bi bi-check-circle-fill"></i> Admin Terotentikasi
					</span>
					<button type="button" class="btn btn-outline-danger btn-sm" onclick={handleAdminLogout}>
						<i class="bi bi-box-arrow-right"></i> Logout Admin
					</button>
					<a href="/" class="btn btn-outline-light btn-sm">
						<i class="bi bi-arrow-left"></i> Web Utama
					</a>
				</div>
			</div>
		</header>

		<main class="admin-container main-content">
		{#if alertMsg}
			<div class="alert alert-{alertType}">
				<i class="bi {alertType === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}"></i>
				<span>{alertMsg}</span>
			</div>
		{/if}

		<!-- GRID: FORM PEMBUATAN AKUN & KREDENSIAL WA -->
		<div class="admin-grid-two">
			<!-- CARD 1: FORM BUAT AKUN -->
			<div class="admin-card">
				<div class="card-head">
					<div class="icon-circle bg-gold">
						<i class="bi bi-person-plus-fill"></i>
					</div>
					<div>
						<h2 class="card-title">Buat Akun Pelanggan (Premium)</h2>
						<p class="card-sub">Gunakan formulir ini setelah pelanggan transfer via WhatsApp.</p>
					</div>
				</div>

				<form onsubmit={handleCreatePaidAccount} class="admin-form">
					<div class="form-row-2">
						<div class="form-group">
							<label for="c-name">Nama Mempelai / Pelanggan: <span class="req">*</span></label>
							<input
								type="text"
								id="c-name"
								bind:value={newName}
								placeholder="contoh: Dimas & Ayu"
								required
							/>
						</div>

						<div class="form-group">
							<label for="c-phone">Nomor WhatsApp Pelanggan: <span class="req">*</span></label>
							<input
								type="tel"
								id="c-phone"
								bind:value={newPhone}
								placeholder="contoh: 081234567890"
								required
							/>
						</div>
					</div>

					<div class="form-row-2">
						<div class="form-group">
							<label for="c-email">Email Akun Pelanggan: <span class="req">*</span></label>
							<input
								type="email"
								id="c-email"
								bind:value={newEmail}
								placeholder="contoh: dimas.ayu@gmail.com"
								required
							/>
						</div>

						<div class="form-group">
							<label for="c-pass">Kata Sandi Akun: <span class="req">*</span></label>
							<input
								type="text"
								id="c-pass"
								bind:value={newPassword}
								placeholder="contoh: nikah2026"
								required
							/>
						</div>
					</div>

					<div class="form-group">
						<label for="c-tier">Paket yang Dibeli:</label>
						<select id="c-tier" bind:value={newTier}>
							<option value="premium">Paket Premium All-in-One (Rp 140.000) ⭐</option>
							<option value="vip">Paket VIP Custom Assist (Rp 250.000) 👑</option>
						</select>
					</div>

					<button type="submit" class="btn btn-create-user" disabled={isSubmitting}>
						{#if isSubmitting}
							<i class="bi bi-arrow-repeat spin-icon"></i> Menyimpan ke Database...
						{:else}
							<i class="bi bi-cloud-plus-fill"></i> Buat Akun & Daftarkan ke Supabase
						{/if}
					</button>
				</form>
			</div>

			<!-- CARD 2: HASIL PEMBUATAN AKUN & KIRIM KE WA -->
			<div class="admin-card">
				<div class="card-head">
					<div class="icon-circle bg-green">
						<i class="bi bi-whatsapp"></i>
					</div>
					<div>
						<h2 class="card-title">Kirim Kredensial via WhatsApp</h2>
						<p class="card-sub">Pesan otomatis berisi email, password, dan link login.</p>
					</div>
				</div>

				{#if lastCreatedUser}
					<div class="result-box">
						<div class="result-header">
							<span class="badge-success">Akun Siap Dikirim</span>
							<strong class="user-target">{lastCreatedUser.name} ({lastCreatedUser.phone})</strong>
						</div>

						<div class="credentials-preview">
							<pre>{generatedWaText}</pre>
						</div>

						<div class="action-btn-group">
							<button type="button" class="btn btn-send-wa" onclick={sendCredentialsViaWhatsApp}>
								<i class="bi bi-whatsapp"></i> Kirim ke WhatsApp Pembeli Sekarang
							</button>

							<button
								type="button"
								class="btn btn-copy-text"
								onclick={() => navigator.clipboard.writeText(generatedWaText)}
							>
								<i class="bi bi-clipboard"></i> Salin Teks
							</button>
						</div>
					</div>
				{:else}
					<div class="empty-state-card">
						<i class="bi bi-chat-left-dots text-muted"></i>
						<p>Belum ada akun yang baru dibuat. Isi formulir di sebelah kiri untuk mendaftarkan akun pembeli.</p>
					</div>
				{/if}
			</div>
		</div>

		<!-- SECTION: TABEL PROFIL PENGGUNA TERDAFTAR (SUPABASE DB) -->
		<div class="admin-card mt-4">
			<div class="table-header-row">
				<div>
					<h3 class="card-title">Daftar Pengguna Terdaftar (Database Supabase)</h3>
					<p class="card-sub">Menampilkan akun gratis yang mendaftar sendiri dan akun berbayar yang dibuatkan admin.</p>
				</div>
				<button type="button" class="btn btn-refresh" onclick={loadAdminData} disabled={isLoadingData}>
					<i class="bi bi-arrow-clockwise {isLoadingData ? 'spin-icon' : ''}"></i> Refresh Data
				</button>
			</div>

			<div class="table-responsive">
				<table class="admin-table">
					<thead>
						<tr>
							<th>Nama Lengkap</th>
							<th>Email</th>
							<th>No. WhatsApp</th>
							<th>Status Paket</th>
							<th>Terdaftar</th>
							<th>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{#if profilesList.length === 0}
							<tr>
								<td colspan="6" class="text-center py-4 text-muted">
									{isLoadingData ? 'Memuat data dari database...' : 'Belum ada pengguna di database.'}
								</td>
							</tr>
						{:else}
							{#each profilesList as prof}
								<tr>
									<td><strong>{prof.name || 'Pengunjung'}</strong></td>
									<td>{prof.email}</td>
									<td>{prof.phone || '-'}</td>
									<td>
										{#if prof.tier === 'premium'}
											<span class="badge-pill badge-tier-pro">👑 Premium Pro</span>
										{:else}
											<span class="badge-pill badge-tier-free">Akun Gratis</span>
										{/if}
									</td>
									<td class="text-muted text-sm">
										{new Date(prof.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
									</td>
									<td>
										{#if prof.tier !== 'premium'}
											<button
												type="button"
												class="btn btn-upgrade-sm"
												onclick={() => handleUpgradeUserTier(prof.id, prof.email)}
											>
												<i class="bi bi-arrow-up-circle"></i> Jadikan Pro
											</button>
										{:else}
											<span class="text-success text-sm"><i class="bi bi-check2"></i> Aktif Pro</span>
										{/if}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- SECTION: TABEL PESANAN WHATSAPP (ORDERS TABLE) -->
		<div class="admin-card mt-4">
			<div class="table-header-row">
				<div>
					<h3 class="card-title">Daftar Pesanan Masuk (Tabel Orders)</h3>
					<p class="card-sub">Data calon pengantin yang klik order via WhatsApp dari website.</p>
				</div>
			</div>

			<div class="table-responsive">
				<table class="admin-table">
					<thead>
						<tr>
							<th>No. Invoice</th>
							<th>Nama Pemesan</th>
							<th>No. WhatsApp</th>
							<th>Paket</th>
							<th>Jumlah Tagihan</th>
							<th>Status</th>
							<th>Catatan</th>
						</tr>
					</thead>
					<tbody>
						{#if ordersList.length === 0}
							<tr>
								<td colspan="7" class="text-center py-4 text-muted">
									Belum ada pesanan masuk di tabel orders.
								</td>
							</tr>
						{:else}
							{#each ordersList as ord}
								<tr>
									<td><span class="invoice-tag">{ord.invoice_id}</span></td>
									<td><strong>{ord.customer_name}</strong></td>
									<td>
										{#if ord.customer_phone}
											<a
												href="https://wa.me/{ord.customer_phone.replace(/^0/, '62')}"
												target="_blank"
												class="wa-link"
											>
												<i class="bi bi-whatsapp"></i> {ord.customer_phone}
											</a>
										{:else}
											-
										{/if}
									</td>
									<td>{ord.package_name}</td>
									<td>Rp {Number(ord.amount).toLocaleString('id-ID')}</td>
									<td>
										<span class="badge-pill {ord.status === 'PAID' ? 'badge-tier-pro' : 'badge-pending'}">
											{ord.status}
										</span>
									</td>
									<td class="text-muted text-sm">{ord.notes || '-'}</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>
	</main>
	{/if}
</div>

<style>
	.admin-page-root {
		min-height: 100vh;
		background: #f4efe9;
		font-family: 'Plus Jakarta Sans', sans-serif;
		color: #2b2621;
		padding-bottom: 4rem;
	}

	/* ADMIN LOGIN PORTAL SCREEN */
	.admin-login-screen {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem 1.5rem;
		background: radial-gradient(circle at top center, #26211a 0%, #13100d 100%);
	}

	.admin-login-card {
		background: #ffffff;
		border-radius: 24px;
		max-width: 440px;
		width: 100%;
		padding: 2.2rem 2rem;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
		border: 1px solid #ebdcc8;
		animation: zoomIn 0.3s ease;
	}

	@keyframes zoomIn {
		from {
			opacity: 0;
			transform: scale(0.94);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.login-badge-head {
		text-align: center;
		margin-bottom: 1.6rem;
	}

	.admin-shield-icon {
		width: 58px;
		height: 58px;
		margin: 0 auto 1rem;
		border-radius: 50%;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.7rem;
		color: #1a1408;
		box-shadow: 0 4px 15px rgba(197, 160, 89, 0.4);
	}

	.login-portal-title {
		font-family: 'Cinzel', serif;
		font-size: 1.35rem;
		font-weight: 700;
		color: #1a1816;
		margin: 0 0 0.4rem;
	}

	.login-portal-sub {
		font-size: 0.82rem;
		color: #6b6256;
		line-height: 1.5;
		margin: 0;
	}

	.admin-auth-form {
		display: flex;
		flex-direction: column;
		gap: 1.1rem;
	}

	.input-with-icon {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-with-icon i {
		position: absolute;
		left: 12px;
		color: #999;
		font-size: 1rem;
	}

	.input-with-icon input {
		width: 100%;
		padding: 0.75rem 0.9rem 0.75rem 2.5rem;
		border-radius: 12px;
		border: 1px solid #dcd1be;
		background: #fdfdfc;
		font-size: 0.88rem;
		font-family: inherit;
		outline: none;
		transition: all 0.2s ease;
	}

	.input-with-icon input:focus {
		border-color: #c5a059;
		box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.18);
	}

	.btn-admin-login {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		border: none;
		padding: 0.85rem;
		border-radius: 25px;
		font-size: 0.92rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		box-shadow: 0 4px 14px rgba(197, 160, 89, 0.35);
		transition: all 0.2s ease;
	}

	.btn-admin-login:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(197, 160, 89, 0.5);
	}

	.login-portal-footer {
		margin-top: 1.5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
		border-top: 1px solid #eee5d7;
		padding-top: 1.2rem;
	}

	.quick-pass-hint {
		background: #fdfaf4;
		border: 1px dashed #dfd0bc;
		border-radius: 10px;
		padding: 0.45rem 0.8rem;
		font-size: 0.75rem;
		color: #786443;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.quick-pass-hint i {
		color: #c5a059;
	}

	.back-link {
		color: #7a7063;
		font-size: 0.8rem;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.back-link:hover {
		color: #c5a059;
	}

	.admin-header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.badge-admin-on {
		background: #14532d;
		color: #4ade80;
		font-size: 0.72rem;
		font-weight: 700;
		padding: 0.3rem 0.7rem;
		border-radius: 14px;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}

	.btn-outline-danger {
		background: transparent;
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.4);
	}

	.btn-outline-danger:hover {
		background: rgba(239, 68, 68, 0.15);
	}

	.admin-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.admin-header {
		background: #181512;
		color: #ffffff;
		padding: 1.25rem 0;
		border-bottom: 1px solid rgba(197, 160, 89, 0.3);
	}

	.header-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.brand-box {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}

	.admin-header-logo {
		width: 42px;
		height: 42px;
		object-fit: contain;
		border-radius: 8px;
		background: #ffffff;
		padding: 2px;
	}

	.admin-gate-logo {
		width: 52px;
		height: 52px;
		object-fit: contain;
		border-radius: 12px;
	}

	.brand-box i {
		font-size: 1.8rem;
		color: #c5a059;
	}

	.brand-title {
		font-family: 'Cinzel', serif;
		font-size: 1.2rem;
		font-weight: 700;
		color: #ffffff;
		margin: 0;
	}

	.brand-sub {
		font-size: 0.72rem;
		color: #a89f92;
	}

	.main-content {
		margin-top: 2rem;
	}

	.alert {
		padding: 0.9rem 1.2rem;
		border-radius: 12px;
		font-size: 0.86rem;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 1.5rem;
	}

	.alert-success {
		background: #dcfce7;
		color: #166534;
		border: 1px solid #bbf7d0;
	}

	.alert-danger {
		background: #fee2e2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	.admin-grid-two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.admin-card {
		background: #ffffff;
		border-radius: 20px;
		border: 1px solid #e5dcce;
		padding: 1.6rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.04);
	}

	.mt-4 {
		margin-top: 1.5rem;
	}

	.card-head {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		margin-bottom: 1.25rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #f0e8dc;
	}

	.icon-circle {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
	}

	.bg-gold {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
	}

	.bg-green {
		background: #22c55e;
		color: #ffffff;
	}

	.card-title {
		font-family: 'Cinzel', serif;
		font-size: 1.15rem;
		font-weight: 700;
		color: #1a1918;
		margin: 0 0 0.2rem;
	}

	.card-sub {
		font-size: 0.78rem;
		color: #7a7063;
		margin: 0;
	}

	.admin-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-row-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-group label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #4b4131;
	}

	.req {
		color: #dc2626;
	}

	.form-group input,
	.form-group select {
		padding: 0.65rem 0.85rem;
		border-radius: 10px;
		border: 1px solid #d8cdba;
		background: #fdfdfc;
		font-size: 0.86rem;
		font-family: inherit;
		outline: none;
	}

	.form-group input:focus,
	.form-group select:focus {
		border-color: #c5a059;
		box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 0.65rem 1.2rem;
		border-radius: 20px;
		font-size: 0.86rem;
		font-weight: 700;
		cursor: pointer;
		text-decoration: none;
		border: none;
		transition: all 0.2s ease;
	}

	.btn-sm {
		padding: 0.4rem 0.8rem;
		font-size: 0.78rem;
	}

	.btn-outline-light {
		background: transparent;
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.3);
	}

	.btn-outline-light:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.btn-create-user {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		padding: 0.85rem;
		border-radius: 25px;
		font-size: 0.9rem;
		margin-top: 0.5rem;
		box-shadow: 0 4px 12px rgba(197, 160, 89, 0.35);
	}

	.btn-create-user:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 18px rgba(197, 160, 89, 0.5);
	}

	.result-box {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}

	.result-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.badge-success {
		background: #dcfce7;
		color: #166534;
		font-size: 0.72rem;
		font-weight: 800;
		padding: 0.2rem 0.6rem;
		border-radius: 8px;
	}

	.user-target {
		font-size: 0.84rem;
		color: #1a1918;
	}

	.credentials-preview {
		background: #fbf9f4;
		border: 1px solid #ebdcc8;
		border-radius: 12px;
		padding: 0.9rem;
		max-height: 180px;
		overflow-y: auto;
	}

	.credentials-preview pre {
		font-family: monospace;
		font-size: 0.76rem;
		white-space: pre-wrap;
		margin: 0;
		color: #2b2212;
	}

	.action-btn-group {
		display: flex;
		gap: 0.6rem;
	}

	.btn-send-wa {
		flex: 1;
		background: #22c55e;
		color: #ffffff;
		border-radius: 25px;
	}

	.btn-send-wa:hover {
		background: #16a34a;
	}

	.btn-copy-text {
		background: #eee5d4;
		color: #4a3e2b;
		border-radius: 25px;
	}

	.btn-copy-text:hover {
		background: #ded1bb;
	}

	.empty-state-card {
		text-align: center;
		padding: 3rem 1.5rem;
		color: #8c8276;
		font-size: 0.86rem;
	}

	.empty-state-card i {
		font-size: 2.2rem;
		display: block;
		margin-bottom: 0.6rem;
	}

	/* TABLE STYLES */
	.table-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.btn-refresh {
		background: #f7f3ec;
		border: 1px solid #ded3be;
		color: #4b3e2b;
		padding: 0.4rem 0.8rem;
		border-radius: 14px;
		font-size: 0.78rem;
		font-weight: 700;
		cursor: pointer;
	}

	.table-responsive {
		overflow-x: auto;
	}

	.admin-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.84rem;
	}

	.admin-table th,
	.admin-table td {
		padding: 0.8rem 1rem;
		text-align: left;
		border-bottom: 1px solid #eee7db;
	}

	.admin-table th {
		background: #fbf9f4;
		font-weight: 700;
		color: #7a6e5d;
		font-size: 0.78rem;
	}

	.badge-pill {
		font-size: 0.7rem;
		font-weight: 800;
		padding: 0.2rem 0.6rem;
		border-radius: 12px;
		display: inline-block;
	}

	.badge-tier-pro {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
	}

	.badge-tier-free {
		background: #e5e7eb;
		color: #4b5563;
	}

	.badge-pending {
		background: #fef3c7;
		color: #92400e;
	}

	.invoice-tag {
		font-family: monospace;
		font-size: 0.76rem;
		background: #f3ede2;
		padding: 0.2rem 0.45rem;
		border-radius: 6px;
		color: #8c6a27;
	}

	.wa-link {
		color: #16a34a;
		text-decoration: none;
		font-weight: 600;
	}

	.wa-link:hover {
		text-decoration: underline;
	}

	.btn-upgrade-sm {
		background: #fdf6ea;
		border: 1px solid #ebdcc8;
		color: #b45309;
		padding: 0.25rem 0.6rem;
		border-radius: 12px;
		font-size: 0.72rem;
		font-weight: 700;
		cursor: pointer;
	}

	.btn-upgrade-sm:hover {
		background: #fce8cc;
	}

	.spin-icon {
		animation: spin 1s linear infinite;
		display: inline-block;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	@media (max-width: 768px) {
		.admin-grid-two {
			grid-template-columns: 1fr;
		}
		.form-row-2 {
			grid-template-columns: 1fr;
		}
	}
</style>
