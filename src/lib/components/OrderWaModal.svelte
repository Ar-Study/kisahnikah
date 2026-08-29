<script>
	import { weddingStore, TEMPLATES } from '$lib/weddingStore.svelte.js';
	import { supabase } from '$lib/supabaseClient.js';

	/**
	 * @type {{
	 *   isOpen: boolean,
	 *   packageName?: string,
	 *   amount?: number,
	 *   targetTemplateName?: string,
	 *   onClose: () => void,
	 *   onSuccess?: () => void
	 * }}
	 */
	let {
		isOpen,
		packageName = 'Paket Premium All-in-One',
		amount = 140000,
		targetTemplateName = 'Emerald Forest Luxury',
		onClose,
		onSuccess
	} = $props();

	let customerName = $state('');
	let customerPhone = $state('');
	let selectedTemplate = $state('');
	let copiedNotice = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (isOpen) {
			customerName = weddingStore.user.name && weddingStore.user.name !== 'Pengunjung' ? weddingStore.user.name : '';
			customerPhone = '';
			selectedTemplate = targetTemplateName || 'Emerald Forest Luxury';
		}
	});

	function formatRupiah(num) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(num);
	}

	function copyToClipboard(text, label) {
		navigator.clipboard.writeText(text).then(() => {
			copiedNotice = `${label} berhasil disalin!`;
			setTimeout(() => {
				copiedNotice = '';
			}, 2500);
		});
	}

	async function handleSubmitOrder(e) {
		e.preventDefault();
		if (!customerName.trim()) return;

		isSubmitting = true;
		const invoiceId = 'INV-EVM-' + Math.floor(100000 + Math.random() * 900000);

		// Record order in Supabase database
		try {
			await supabase.from('orders').insert([
				{
					invoice_id: invoiceId,
					customer_name: customerName.trim(),
					customer_phone: customerPhone.trim(),
					customer_email: weddingStore.user.email || '',
					package_name: packageName,
					amount: amount,
					payment_method: 'whatsapp',
					notes: `Template: ${selectedTemplate}`,
					status: 'PENDING'
				}
			]);
		} catch (err) {
			console.warn('Order save to Supabase note:', err);
		}

		// Also record in local store
		weddingStore.createPaymentOrder(packageName, amount, 'whatsapp');

		// Format WhatsApp Message
		const text = encodeURIComponent(
			`Halo Admin Kisah Nikah,\n` +
			`Saya ingin memesan undangan digital:\n\n` +
			`📋 *No. Invoice:* ${invoiceId}\n` +
			`📦 *Paket:* ${packageName} (${formatRupiah(amount)})\n` +
			`🎨 *Template:* ${selectedTemplate}\n` +
			`💍 *Nama Mempelai:* ${customerName.trim()}\n` +
			`📱 *WhatsApp:* ${customerPhone.trim() || '-'}\n\n` +
			`Saya siap transfer ke rekening Admin. Mohon nomor rekening dan proses pembuatan akun Premium saya. Terima kasih!`
		);

		isSubmitting = false;
		if (onSuccess) onSuccess();
		onClose();

		// Open WhatsApp
		window.open(`https://wa.me/6289669788817?text=${text}`, '_blank');
	}
</script>

{#if isOpen}
	<div
		class="modal-backdrop"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="presentation"
		tabindex="-1"
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
				<div class="header-brand">
					<i class="bi bi-whatsapp"></i>
					<span>Pemesanan Paket via WhatsApp</span>
				</div>
				<button type="button" class="btn-close" onclick={onClose} aria-label="Tutup">
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<div class="modal-body">
				<!-- Order Summary Pill -->
				<div class="package-summary-card">
					<div class="package-meta">
						<span class="badge-pkg">PILIHAN PAKET</span>
						<h4 class="package-title">{packageName}</h4>
						<span class="template-choice">Template: <strong>{selectedTemplate}</strong></span>
					</div>
					<div class="package-price">
						{formatRupiah(amount)}
					</div>
				</div>

				{#if copiedNotice}
					<div class="copy-alert">
						<i class="bi bi-check-circle-fill"></i>
						<span>{copiedNotice}</span>
					</div>
				{/if}

				<!-- BANK ACCOUNT INFO FOR TRANSFER -->
				<div class="bank-info-box">
					<div class="bank-info-title">
						<i class="bi bi-credit-card-2-front-fill"></i>
						<span>Rekening Pembayaran Resmi Admin:</span>
					</div>
					<div class="bank-items-grid">
						<div class="bank-chip">
							<div class="bank-name">BANK BCA</div>
							<div class="bank-num-row">
								<span class="bank-num">8040 123 456</span>
								<button
									type="button"
									class="btn-copy-sm"
									onclick={() => copyToClipboard('8040123456', 'Rekening BCA')}
								>
									Salin
								</button>
							</div>
							<div class="bank-an">a.n Kisah Nikah Digital</div>
						</div>

						<div class="bank-chip">
							<div class="bank-name">BANK BSI</div>
							<div class="bank-num-row">
								<span class="bank-num">7123 456 789</span>
								<button
									type="button"
									class="btn-copy-sm"
									onclick={() => copyToClipboard('7123456789', 'Rekening BSI')}
								>
									Salin
								</button>
							</div>
							<div class="bank-an">a.n Kisah Nikah Digital</div>
						</div>
					</div>
				</div>

				<!-- CUSTOMER FORM -->
				<form onsubmit={handleSubmitOrder} class="order-form">
					<div class="form-field">
						<label for="order-name">Nama Mempelai / Pemesan: <span class="text-danger">*</span></label>
						<div class="input-wrap">
							<i class="bi bi-person"></i>
							<input
								type="text"
								id="order-name"
								bind:value={customerName}
								placeholder="contoh: Rizky & Anin"
								required
							/>
						</div>
					</div>

					<div class="form-field">
						<label for="order-phone">Nomor WhatsApp Aktif: <span class="text-danger">*</span></label>
						<div class="input-wrap">
							<i class="bi bi-whatsapp"></i>
							<input
								type="tel"
								id="order-phone"
								bind:value={customerPhone}
								placeholder="contoh: 081234567890"
								required
							/>
						</div>
					</div>

					<div class="form-field">
						<label for="order-tpl">Pilihan Desain Template:</label>
						<div class="input-wrap">
							<i class="bi bi-palette"></i>
							<select id="order-tpl" bind:value={selectedTemplate}>
								<optgroup label="🎁 TEMPLATE GRATIS">
									{#each TEMPLATES.filter((t) => t.tier === 'free') as tpl}
										<option value={tpl.name}>🎁 {tpl.name} (Gratis)</option>
									{/each}
								</optgroup>
								<optgroup label="⭐ TEMPLATE PREMIUM PRO (Rp 140rb)">
									{#each TEMPLATES.filter((t) => t.tier === 'premium') as tpl}
										<option value={tpl.name}>⭐ {tpl.name} (Premium)</option>
									{/each}
								</optgroup>
								<optgroup label="👑 TEMPLATE VIP EXCLUSIVE (Rp 250rb)">
									{#each TEMPLATES.filter((t) => t.tier === 'vip') as tpl}
										<option value={tpl.name}>👑 {tpl.name} (VIP)</option>
									{/each}
								</optgroup>
							</select>
						</div>
					</div>

					<div class="info-flow-box">
						<div class="flow-step">
							<span class="step-badge">1</span>
							<span>Kirim pesanan ke WhatsApp Admin & lakukan pembayaran.</span>
						</div>
						<div class="flow-step">
							<span class="step-badge">2</span>
							<span>Admin akan membuatkan <strong>Akun Premium</strong> untuk Anda dan mengirimkan detail login via WhatsApp.</span>
						</div>
					</div>

					<button type="submit" class="btn-submit-wa" disabled={isSubmitting}>
						<i class="bi bi-whatsapp"></i>
						<span>Lanjutkan Pesan ke WhatsApp Admin</span>
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(12, 10, 8, 0.75);
		backdrop-filter: blur(6px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}

	.modal-dialog {
		background: #ffffff;
		border-radius: 24px;
		max-width: 480px;
		width: 100%;
		max-height: 92vh;
		overflow-y: auto;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
		border: 1px solid #ebdcc8;
		animation: modalZoom 0.25s ease;
	}

	@keyframes modalZoom {
		from {
			opacity: 0;
			transform: scale(0.93);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.modal-header {
		background: #191613;
		color: #ffffff;
		padding: 1.1rem 1.4rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.header-brand {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-family: 'Cinzel', serif;
		font-size: 0.92rem;
		font-weight: 700;
		color: #22c55e;
	}

	.header-brand i {
		font-size: 1.2rem;
	}

	.btn-close {
		background: none;
		border: none;
		color: #aaa;
		font-size: 1.1rem;
		cursor: pointer;
	}

	.btn-close:hover {
		color: #fff;
	}

	.modal-body {
		padding: 1.4rem;
	}

	.package-summary-card {
		background: #fdfaf6;
		border: 1px solid #ebdcc8;
		border-radius: 16px;
		padding: 1rem 1.25rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}

	.badge-pkg {
		font-size: 0.65rem;
		font-weight: 800;
		color: #8c6a27;
		letter-spacing: 1px;
		display: block;
	}

	.package-title {
		font-family: 'Cinzel', serif;
		font-size: 1.1rem;
		font-weight: 700;
		color: #1a1918;
		margin: 0.2rem 0;
	}

	.template-choice {
		font-size: 0.78rem;
		color: #665d52;
	}

	.package-price {
		font-family: 'Cinzel', serif;
		font-size: 1.25rem;
		font-weight: 800;
		color: #8c6a27;
		white-space: nowrap;
	}

	.copy-alert {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #166534;
		font-size: 0.8rem;
		padding: 0.5rem 0.8rem;
		border-radius: 10px;
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-bottom: 1rem;
	}

	.bank-info-box {
		background: #fcfbf9;
		border: 1px solid #f0e6d6;
		border-radius: 14px;
		padding: 1rem;
		margin-bottom: 1.25rem;
	}

	.bank-info-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.78rem;
		font-weight: 700;
		color: #8c6a27;
		margin-bottom: 0.65rem;
	}

	.bank-items-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.6rem;
	}

	.bank-chip {
		background: #ffffff;
		border: 1px solid #e7ded2;
		border-radius: 10px;
		padding: 0.6rem 0.75rem;
	}

	.bank-name {
		font-size: 0.7rem;
		font-weight: 800;
		color: #1a1918;
		margin-bottom: 0.2rem;
	}

	.bank-num-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.3rem;
	}

	.bank-num {
		font-family: monospace;
		font-size: 0.84rem;
		font-weight: 700;
		color: #2b2212;
	}

	.btn-copy-sm {
		background: #eee6d8;
		border: none;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 0.2rem 0.45rem;
		border-radius: 6px;
		cursor: pointer;
	}

	.btn-copy-sm:hover {
		background: #dfd2be;
	}

	.bank-an {
		font-size: 0.65rem;
		color: #887e70;
		margin-top: 0.2rem;
	}

	.order-form {
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

	.text-danger {
		color: #dc2626;
	}

	.input-wrap {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-wrap i {
		position: absolute;
		left: 12px;
		color: #999;
		font-size: 0.95rem;
	}

	.input-wrap input,
	.input-wrap select {
		width: 100%;
		padding: 0.7rem 0.9rem 0.7rem 2.4rem;
		border-radius: 12px;
		border: 1px solid #dcd1be;
		background: #fdfdfc;
		font-size: 0.86rem;
		font-family: inherit;
		outline: none;
	}

	.input-wrap input:focus,
	.input-wrap select:focus {
		border-color: #c5a059;
		box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.15);
	}

	.info-flow-box {
		background: #fdfaf6;
		border: 1px dashed #dfd2be;
		border-radius: 12px;
		padding: 0.8rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		font-size: 0.78rem;
		color: #4b4131;
	}

	.flow-step {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
	}

	.step-badge {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: #c5a059;
		color: #fff;
		font-size: 0.65rem;
		font-weight: 800;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 0.1rem;
	}

	.btn-submit-wa {
		background: #22c55e;
		color: #ffffff;
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
		box-shadow: 0 4px 15px rgba(34, 197, 94, 0.35);
		transition: all 0.2s ease;
	}

	.btn-submit-wa:hover {
		background: #16a34a;
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(34, 197, 94, 0.45);
	}

	@media (max-width: 480px) {
		.bank-items-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
