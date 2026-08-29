<script>
	import { weddingStore } from '$lib/weddingStore.svelte.js';

	/**
	 * @type {{
	 *   isOpen: boolean,
	 *   targetTemplateName?: string,
	 *   targetTier?: string,
	 *   onClose: () => void,
	 *   onUpgradeSuccess?: () => void,
	 *   onOpenPayment?: () => void
	 * }}
	 */
	let {
		isOpen,
		targetTemplateName = 'Template Premium',
		targetTier = 'premium',
		onClose,
		onUpgradeSuccess,
		onOpenPayment
	} = $props();

	const isVip = $derived(targetTier === 'vip');

	function handleProceedToPayment() {
		onClose();
		if (onOpenPayment) {
			onOpenPayment();
		} else {
			handleOrderWa();
		}
	}

	function handleOrderWa() {
		const pkg = isVip ? 'Paket VIP Custom Assist (Rp 250.000)' : 'Paket Premium All-in-One (Rp 140.000)';
		const msg = encodeURIComponent(
			`Halo Kisah Nikah, saya ingin memesan ${pkg} untuk template ${targetTemplateName}. Mohon info nomor rekening dan proses akun saya!`
		);
		window.open(`https://wa.me/6289669788817?text=${msg}`, '_blank');
	}
</script>

{#if isOpen}
	<div
		class="upgrade-modal-backdrop"
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="presentation"
		tabindex="-1"
	>
		<div
			class="upgrade-modal-dialog"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="upgrade-header">
				<div class="crown-icon-wrap {isVip ? 'is-vip-crown' : ''}">
					<i class="bi {isVip ? 'bi-crown-fill' : 'bi-stars'}"></i>
				</div>
				<button type="button" class="btn-close-modal" onclick={onClose} aria-label="Tutup">
					<i class="bi bi-x-lg"></i>
				</button>
			</div>

			<div class="upgrade-body">
				<span class="badge-premium-pill {isVip ? 'pill-vip' : ''}">
					{isVip ? '👑 TEMPLATE VIP EXCLUSIVE' : '⭐ TEMPLATE PREMIUM PRO'}
				</span>
				<h3 class="upgrade-title">Buka Akses "{targetTemplateName}"</h3>
				<p class="upgrade-desc">
					{#if isVip}
						Template ini merupakan mahakarya spesial di <strong>Paket VIP Custom Assist</strong>. Dibuatkan dan diinputkan data lengkap terima beres oleh tim profesional Kisah Nikah!
					{:else}
						Template ini merupakan desain eksklusif yang tersedia di <strong>Paket Premium All-in-One</strong>. Dapatkan akses lengkap ke seluruh fitur tanpa batas.
					{/if}
				</p>

				<!-- Price Box -->
				<div class="pricing-feature-box {isVip ? 'vip-feature-box' : ''}">
					<div class="pricing-tag-row">
						<div>
							<div class="price-strikethrough">{isVip ? 'Rp 400.000' : 'Rp 250.000'}</div>
							<div class="price-main">{isVip ? 'Rp 250.000' : 'Rp 140.000'} <span>/ sekali bayar</span></div>
						</div>
						<div class="discount-badge">{isVip ? 'DISKON 38%' : 'DISKON 44%'}</div>
					</div>

					<ul class="benefit-list">
						{#if isVip}
							<li><i class="bi bi-check-circle-fill"></i> <strong>Akses SEMUA 10 Template (Termasuk VIP)</strong></li>
							<li><i class="bi bi-check-circle-fill"></i> <strong>Dibantu Input Data Lengkap oleh Tim Kisah Nikah</strong></li>
							<li><i class="bi bi-check-circle-fill"></i> Bebas Revisi Data Hingga Hari H</li>
							<li><i class="bi bi-check-circle-fill"></i> Custom Subdomain Pilihan Pasangan</li>
							<li><i class="bi bi-check-circle-fill"></i> Unlimited Tamu Undangan & Lifetime</li>
							<li><i class="bi bi-check-circle-fill"></i> Prioritas CS WhatsApp 24/7</li>
						{:else}
							<li><i class="bi bi-check-circle-fill"></i> Akses Seluruh 8+ Template Mewah</li>
							<li><i class="bi bi-check-circle-fill"></i> Unlimited Tamu Undangan & Sapaan Personal</li>
							<li><i class="bi bi-check-circle-fill"></i> Masa Aktif Undangan Selamanya (Lifetime)</li>
							<li><i class="bi bi-check-circle-fill"></i> Kado Digital & 1-Klik Salin Nomor Rekening</li>
							<li><i class="bi bi-check-circle-fill"></i> Musik Latar Bebas Pilih & Galeri Foto HD</li>
							<li><i class="bi bi-check-circle-fill"></i> Generator Link & Pesan WhatsApp Otomatis</li>
						{/if}
					</ul>
				</div>

				<!-- Actions -->
				<div class="upgrade-actions">
					<button
						type="button"
						class="btn-upgrade-instant {isVip ? 'btn-vip-instant' : ''}"
						onclick={handleProceedToPayment}
					>
						<i class="bi bi-whatsapp"></i>
						<span>Pesan {isVip ? 'Paket VIP (Rp 250.000)' : 'Paket Premium (Rp 140.000)'} via WA</span>
					</button>

					<button type="button" class="btn-cancel-link" onclick={onClose}>
						Kembali ke Template Gratis (Champagne Gold / Terracotta / Botanical)
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.upgrade-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(12, 10, 8, 0.75);
		backdrop-filter: blur(8px);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.upgrade-modal-dialog {
		background: #ffffff;
		border-radius: 28px;
		max-width: 480px;
		width: 100%;
		box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
		overflow: hidden;
		border: 1px solid #ebdcc8;
		animation: modalPop 0.25s ease;
	}

	@keyframes modalPop {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.upgrade-header {
		position: relative;
		background: linear-gradient(135deg, #181512 0%, #2b251e 100%);
		padding: 2.2rem 1.5rem 1.2rem;
		text-align: center;
		display: flex;
		justify-content: center;
	}

	.crown-icon-wrap {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.8rem;
		color: #12100e;
		box-shadow: 0 8px 25px rgba(197, 160, 89, 0.45);
	}

	.crown-icon-wrap.is-vip-crown {
		background: linear-gradient(135deg, #dfb15b 0%, #ffd978 50%, #9e1b32 100%);
		box-shadow: 0 8px 25px rgba(223, 177, 91, 0.55);
	}

	.btn-close-modal {
		position: absolute;
		top: 16px;
		right: 18px;
		background: none;
		border: none;
		color: #a89f92;
		font-size: 1.2rem;
		cursor: pointer;
		transition: color 0.2s;
	}

	.btn-close-modal:hover {
		color: #ffffff;
	}

	.upgrade-body {
		padding: 1.8rem;
		text-align: center;
	}

	.badge-premium-pill {
		display: inline-block;
		font-family: 'Cinzel', serif;
		font-size: 0.68rem;
		font-weight: 700;
		letter-spacing: 2px;
		color: #a88439;
		background: rgba(197, 160, 89, 0.12);
		padding: 0.3rem 0.8rem;
		border-radius: 20px;
		margin-bottom: 0.6rem;
	}

	.badge-premium-pill.pill-vip {
		color: #9e1b32;
		background: rgba(158, 27, 50, 0.12);
		border: 1px solid rgba(158, 27, 50, 0.25);
	}

	.upgrade-title {
		font-family: 'Cinzel', serif;
		font-size: 1.4rem;
		color: #1a1918;
		margin: 0 0 0.5rem;
		font-weight: 700;
	}

	.upgrade-desc {
		font-size: 0.86rem;
		line-height: 1.6;
		color: #6d6459;
		margin: 0 0 1.5rem;
	}

	.pricing-feature-box {
		background: #fdfaf6;
		border: 1px solid #ebdcc8;
		border-radius: 18px;
		padding: 1.25rem 1.4rem;
		text-align: left;
		margin-bottom: 1.5rem;
	}

	.pricing-tag-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 0.9rem;
		margin-bottom: 0.9rem;
		border-bottom: 1px dashed #ded4c3;
	}

	.price-strikethrough {
		font-size: 0.8rem;
		color: #999;
		text-decoration: line-through;
	}

	.price-main {
		font-family: 'Cinzel', serif;
		font-size: 1.5rem;
		font-weight: 800;
		color: #8c6a27;
	}

	.price-main span {
		font-family: 'Plus Jakarta Sans', sans-serif;
		font-size: 0.75rem;
		color: #888;
		font-weight: 500;
	}

	.discount-badge {
		background: #dc2626;
		color: #ffffff;
		font-size: 0.72rem;
		font-weight: 800;
		padding: 0.25rem 0.6rem;
		border-radius: 8px;
	}

	.benefit-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
		font-size: 0.82rem;
		color: #3b352e;
	}

	.benefit-list li {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.benefit-list i {
		color: #16a34a;
		font-size: 0.9rem;
	}

	.upgrade-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.pricing-feature-box.vip-feature-box {
		background: #fdf6f7;
		border-color: #f0ccd3;
	}

	.btn-upgrade-instant {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		background: linear-gradient(135deg, #c5a059 0%, #ecd093 50%, #aa7c11 100%);
		color: #1a1408;
		border: none;
		padding: 0.85rem;
		border-radius: 25px;
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 4px 15px rgba(197, 160, 89, 0.4);
		transition: all 0.25s ease;
	}

	.btn-upgrade-instant.btn-vip-instant {
		background: linear-gradient(135deg, #9e1b32 0%, #c4334f 50%, #dfb15b 100%);
		color: #ffffff;
		box-shadow: 0 4px 18px rgba(158, 27, 50, 0.45);
	}

	.btn-upgrade-instant:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(197, 160, 89, 0.55);
	}

	.btn-upgrade-instant.btn-vip-instant:hover {
		box-shadow: 0 6px 22px rgba(158, 27, 50, 0.6);
	}

	.btn-cancel-link {
		background: none;
		border: none;
		font-size: 0.78rem;
		color: #887e70;
		cursor: pointer;
		text-decoration: underline;
		margin-top: 0.3rem;
	}

	.btn-cancel-link:hover {
		color: #222;
	}
</style>
