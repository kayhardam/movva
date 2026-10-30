<script lang="ts">
	/** A tiny line of values over time: no chart library, a few lines of SVG. */
	let { values }: { values: number[] } = $props();

	const W = 104;
	const H = 36;
	const P = 4;

	const points = $derived.by(() => {
		const low = Math.min(...values);
		const high = Math.max(...values);
		const span = high - low || 1;
		return values.map((v, i) => {
			const x = P + ((W - 2 * P) * i) / Math.max(values.length - 1, 1);
			const y = high === low ? H / 2 : H - P - ((H - 2 * P) * (v - low)) / span;
			return [Number(x.toFixed(1)), Number(y.toFixed(1))] as const;
		});
	});
	const line = $derived(points.map((p) => p.join(',')).join(' '));
	const end = $derived(points.at(-1));
	const area = $derived(
		points.length
			? `M${points[0]?.[0]},${H - P} L${points.map((p) => p.join(',')).join(' L')} L${end?.[0]},${H - P} Z`
			: ''
	);
</script>

{#if values.length > 1 && end}
	<svg class="spark" viewBox="0 0 {W} {H}" aria-hidden="true">
		<path class="area" d={area} />
		<polyline class="line" points={line} />
		<circle class="dot" cx={end[0]} cy={end[1]} r="3" />
	</svg>
{:else}
	<span class="spark" aria-hidden="true"></span>
{/if}

<style>
	.spark {
		width: 104px;
		height: 36px;
		display: block;
	}
	.area {
		fill: var(--accent-soft);
	}
	.line {
		fill: none;
		stroke: var(--accent);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.dot {
		fill: var(--accent);
	}
</style>
