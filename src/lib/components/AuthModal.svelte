<script>
	import { weddingStore } from '$lib/weddingStore.svelte.js';

	/** @type {{ isOpen: boolean, onClose: () => void, onSuccess?: () => void }} */
	let { isOpen, onClose, onSuccess } = $props();

	let authTab = $state('login'); // 'login' | 'register'
	let email = $state('');
	let password = $state('');
	let name = $state('');
	let phone = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleLogin(e) {
		e.preventDefault();
		if (!email.trim() || !password.trim()) return;
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		const res = await weddingStore.signInWithSupabase(email, password);
		isLoading = false;

		if (!res.success) {
			errorMessage = res.error;
			return;
		}

		successMessage = 'Berhasil masuk ke akun Anda!';
		if (onSuccess) onSuccess();
		setTimeout(() => {
			onClose();
			errorMessage = '';
			successMessage = '';
		}, 700);
	}

	async function handleRegister(e) {
		e.preventDefault();
		if (!email.trim() || !password.trim() || !name.trim()) return;
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		const res = await weddingStore.signUpWithSupabase(email, password, name, phone);
		isLoading = false;

		if (!res.success) {
			errorMessage = res.error;
			return;
		}

		successMessage = 'Pendaftaran berhasil! Akun Anda siap digunakan.';
		if (onSuccess) onSuccess();
		setTimeout(() => {
			onClose();
			errorMessage = '';
			successMessage = '';
		}, 900);
	}
</script>

{#if isOpen}
	<div
		class="auth-modal-backdrop"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="auth-modal-dialog"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-top">
				<div class="brand-badge">
					<img src="/logo.png" alt="Logo" class="auth-logo-img" />
					<span>Kisah Nikah Account</span>
				</div>
				<button type="button" class="btn-close-modal" onclick={onClose} aria-label="Tutup">
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<div class="modal-tab-headers">
				<button
					type="button"
					class="tab-btn {authTab === 'login' ? 'active' : ''}"
					onclick={() => (authTab = 'login')}
				>
					<i class="bi bi-box-arrow-in-right"></i> Masuk (Login)
				</button>
				<button
					type="button"
					class="tab-btn {authTab === 'register' ? 'active' : ''}"
					onclick={() => (authTab = 'register')}
				>
					<i class="bi bi-person-plus"></i> Daftar Akun Gratis
				</button>
			</div>

			<div class="modal-form-body">
				{#if errorMessage}
					<div class="auth-alert alert-error">
						<i class="bi bi-exclamation-triangle-fill"></i>
						<span>{errorMessage}</span>
					</div>
				{/if}

				{#if successMessage}
					<div class="auth-alert alert-success">
						<i class="bi bi-check-circle-fill"></i>
						<span>{successMessage}</span>
					</div>
				{/if}

				{#if authTab === 'login'}
					<p class="auth-notice-sub">
						<i class="bi bi-person-check"></i>
						<span>Masuk menggunakan akun Anda. Akun Premium yang dibuatkan oleh Admin juga masuk melalui menu ini.</span>
					</p>

					<form onsubmit={handleLogin} class="auth-form">
						<div class="form-field">
							<label for="login-email">Email Terdaftar:</label>
							<div class="input-wrap">
								<i class="bi bi-envelope"></i>
								<input
									type="email"
									id="login-email"
									bind:value={email}
									placeholder="contoh: calon.pengantin@gmail.com"
									required
								/>
							</div>
						</div>

						<div class="form-field">
							<label for="login-password">Kata Sandi:</label>
							<div class="input-wrap">
								<i class="bi bi-lock"></i>
								<input
									type="password"
									id="login-password"
									bind:value={password}
									placeholder="••••••••"
									required
								/>
							</div>
						</div>

						<button type="submit" class="btn-submit-auth" disabled={isLoading}>
							{#if isLoading}
								<i class="bi bi-arrow-repeat spin-icon"></i>
								<span>Memproses...</span>
							{:else}
								<i class="bi bi-box-arrow-in-right"></i>
								<span>Masuk Sekarang</span>
							{/if}
						</button>
					</form>
				{:else}
					<div class="auth-notice-box">
						<i class="bi bi-info-circle-fill"></i>
						<span>Pendaftaran ini khusus untuk <strong>Akun Gratis</strong>. Untuk aktivasi <strong>Paket Premium Berbayar</strong>, silakan order lewat WhatsApp Admin.</span>
					</div>

					<form onsubmit={handleRegister} class="auth-form">
						<div class="form-field">
							<label for="reg-name">Nama Lengkap / Mempelai:</label>
							<div class="input-wrap">
								<i class="bi bi-person"></i>
								<input
									type="text"
									id="reg-name"
									bind:value={name}
									placeholder="Nama Anda"
									required
								/>
							</div>
						</div>

						<div class="form-field">
							<label for="reg-email">Alamat Email:</label>
							<div class="input-wrap">
								<i class="bi bi-envelope"></i>
								<input
									type="email"
									id="reg-email"
									bind:value={email}
									placeholder="email@example.com"
									required
								/>
							</div>
						</div>

						<div class="form-field">
							<label for="reg-phone">Nomor WhatsApp:</label>
							<div class="input-wrap">
								<i class="bi bi-whatsapp"></i>
								<input
									type="tel"
									id="reg-phone"
									bind:value={phone}
									placeholder="081234567890"
								/>
							</div>
						</div>

						<div class="form-field">
							<label for="reg-password">Buat Kata Sandi:</label>
							<div class="input-wrap">
								<i class="bi bi-lock"></i>
								<input
									type="password"
									id="reg-password"
									bind:value={password}
									placeholder="Minimal 6 karakter"
									required
								/>
							</div>
						</div>

						<button type="submit" class="btn-submit-auth" disabled={isLoading}>
							{#if isLoading}
								<i class="bi bi-arrow-repeat spin-icon"></i>
								<span>Mendaftarkan...</span>
							{:else}
								<i class="bi bi-person-plus-fill"></i>
								<span>Buat Akun Gratis</span>
							{/if}
						</button>
					</form>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.auth-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(15, 12, 10, 0.7);
		backdrop-filter: blur(6px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.auth-modal-dialog {
		background: #ffffff;
		border-radius: 24px;
		max-width: 460px;
		width: 100%;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
		overflow: hidden;
		border: 1px solid #e7ded2;
		animation: modalZoom 0.25s ease;
	}

	@keyframes modalZoom {
		from {
			opacity: 0;
			transform: scale(0.94);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid #f0e8dc;
	}

	.brand-badge {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Cinzel', serif;
		font-size: 0.95rem;
		font-weight: 700;
		color: #1a1918;
	}

	.auth-logo-img {
		width: 24px;
		height: 24px;
		object-fit: contain;
		border-radius: 4px;
	}

	.btn-close-modal {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		color: #999;
		padding: 0.2rem;
	}

	.btn-close-modal:hover {
		color: #111;
	}


	.auth-notice-sub {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.8rem;
		color: #6b6357;
		line-height: 1.5;
		margin: 0 0 1.25rem;
		background: #fdfbf7;
		padding: 0.6rem 0.8rem;
		border-radius: 10px;
		border: 1px solid #f0e8dc;
	}

	.auth-notice-sub i {
		color: #c5a059;
		font-size: 1rem;
		flex-shrink: 0;
	}

	.auth-notice-box {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		color: #1e40af;
		padding: 0.7rem 0.9rem;
		border-radius: 12px;
		font-size: 0.8rem;
		line-height: 1.5;
		margin-bottom: 1.25rem;
	}

	.auth-notice-box i {
		font-size: 1rem;
		color: #3b82f6;
		margin-top: 0.1rem;
		flex-shrink: 0;
	}

	/* TAB HEADERS */
	.modal-tab-headers {
		display: flex;
		border-bottom: 1px solid #eee;
	}

	.tab-btn {
		flex: 1;
		padding: 0.95rem;
		background: none;
		border: none;
		font-size: 0.88rem;
		font-weight: 600;
		color: #777;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.2s ease;
	}

	.tab-btn.active {
		color: #c5a059;
		border-bottom-color: #c5a059;
		font-weight: 700;
		background: #ffffff;
	}

	/* FORM BODY */
	.modal-form-body {
		padding: 1.5rem;
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.form-field {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.form-field label {
		font-size: 0.8rem;
		font-weight: 600;
		color: #3b352e;
	}

	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-wrap i {
		position: absolute;
		left: 14px;
		color: #999;
		font-size: 1rem;
	}

	.input-wrap input {
		width: 100%;
		padding: 0.75rem 1rem 0.75rem 2.6rem;
		border-radius: 12px;
		border: 1px solid #dcd1be;
		background: #fdfdfc;
		font-size: 0.86rem;
		font-family: inherit;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.input-wrap input:focus {
		border-color: #c5a059;
		box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
	}

	.auth-alert {
		padding: 0.75rem 1rem;
		border-radius: 12px;
		font-size: 0.82rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(-4px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.alert-error {
		background: #fef2f2;
		color: #991b1b;
		border: 1px solid #fecaca;
	}

	.alert-success {
		background: #f0fdf4;
		color: #166534;
		border: 1px solid #bbf7d0;
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

	.btn-submit-auth:disabled {
		opacity: 0.7;
		cursor: not-allowed;
		transform: none;
	}

	.btn-submit-auth {
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		border: none;
		padding: 0.85rem;
		border-radius: 25px;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		margin-top: 0.5rem;
		box-shadow: 0 4px 15px rgba(197, 160, 89, 0.35);
		transition: all 0.2s ease;
	}

	.btn-submit-auth:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(197, 160, 89, 0.45);
	}
</style>
