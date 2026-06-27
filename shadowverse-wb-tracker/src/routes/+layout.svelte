<script lang="ts">
	import { page } from '$app/stores';

	const navItems = [
		{ href: '/', label: 'ダッシュボード' },
		{ href: '/records', label: '対戦記録' },
		{ href: '/decks', label: 'デッキ' },
		{ href: '/settings', label: '設定' }
	];

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		if (href === '/') return path === '/';
		return path.startsWith(href);
	}
</script>

<div class="app-layout">
	<nav class="sidebar">
		<div class="app-title">シャドバWB<br />戦績記録</div>
		<ul>
			{#each navItems as item}
				<li>
					<a href={item.href} class:active={isActive(item.href)}>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</nav>

	<main class="content">
		<slot />
	</main>
</div>

<style>
	:global(*, *::before, *::after) {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
	}

	:global(body) {
		font-family: 'Hiragino Sans', 'Meiryo', sans-serif;
		background: #0f0f0f;
		color: #e0e0e0;
		height: 100vh;
		overflow: hidden;
	}

	.app-layout {
		display: flex;
		height: 100vh;
	}

	.sidebar {
		width: 180px;
		min-width: 180px;
		background: #1a1a2e;
		border-right: 1px solid #2a2a4a;
		display: flex;
		flex-direction: column;
		padding: 20px 0;
	}

	.app-title {
		font-size: 13px;
		font-weight: 700;
		color: #7c83fd;
		padding: 0 20px 20px;
		border-bottom: 1px solid #2a2a4a;
		line-height: 1.4;
	}

	ul {
		list-style: none;
		margin-top: 12px;
	}

	li a {
		display: block;
		padding: 10px 20px;
		color: #a0a0c0;
		text-decoration: none;
		font-size: 14px;
		border-left: 3px solid transparent;
		transition: background 0.15s, color 0.15s;
	}

	li a:hover {
		background: #252545;
		color: #e0e0ff;
	}

	li a.active {
		background: #252545;
		color: #7c83fd;
		border-left-color: #7c83fd;
		font-weight: 600;
	}

	.content {
		flex: 1;
		overflow-y: auto;
		padding: 24px;
	}
</style>
