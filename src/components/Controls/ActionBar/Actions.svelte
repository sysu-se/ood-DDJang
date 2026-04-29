<script>
	import { candidates } from '@sudoku/stores/candidates';
	import { cursor } from '@sudoku/stores/cursor';
	import { hints } from '@sudoku/stores/hints';
	import { notes } from '@sudoku/stores/notes';
	import { settings } from '@sudoku/stores/settings';
	import { keyboardDisabled } from '@sudoku/stores/keyboard';
	import { gamePaused } from '@sudoku/stores/game';
	import { gameDomain } from '@sudoku/stores/gameDomain';

	$: hintsAvailable = $hints > 0;

	let hintLevel = 0;
	let hintInfo = null;

	function handleHint() {
		if (!hintsAvailable || !$gameDomain.grid) return;
		const cellValue = $gameDomain.grid[$cursor.y][$cursor.x];
		if (cellValue !== 0) return;

		if (hintLevel === 0) {
			hintInfo = gameDomain.getHintInfo($cursor);
			if (hintInfo && hintInfo.candidates.length > 0) {
				hints.useHint();
				hintLevel = 1;
			}
		} else {
			hints.useHint();
			gameDomain.applyHint($cursor);
			hintLevel = 0;
			hintInfo = null;
		}
	}

	$: {
		if (hintLevel === 1 && hintInfo) {
			const cx = $cursor.x;
			const cy = $cursor.y;
			if (cx !== hintInfo.col || cy !== hintInfo.row) {
				hintLevel = 0;
				hintInfo = null;
			}
		}
	}

	function handleExplore() {
		if ($gameDomain.isExploring) {
			gameDomain.commitExploration();
		} else {
			gameDomain.enterExplore();
		}
	}

	function handleAbandon() {
		if ($gameDomain.isExploring) {
			gameDomain.abandonExploration();
		}
	}
</script>

{#if $gameDomain.isExploring && $gameDomain.isFailedPath}
	<div class="failed-path-warning" title="This board state was previously abandoned in exploration">
		<svg class="icon-outline h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
		</svg>
		<span>This path was previously explored and abandoned</span>
	</div>
{/if}

<div class="action-buttons space-x-3">

	<button class="btn btn-round" disabled={$gamePaused || !$gameDomain.canUndo} title="Undo" on:click={() => gameDomain.undo()}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
		</svg>
	</button>

	<button class="btn btn-round" disabled={$gamePaused || !$gameDomain.canRedo} title="Redo" on:click={() => gameDomain.redo()}>
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 90 00-8 8v2M21 10l-6 6m6-6l-6-6" />
		</svg>
	</button>

	<button class="btn btn-round btn-badge" disabled={$keyboardDisabled || !hintsAvailable || ($gameDomain.grid[$cursor.y][$cursor.x] !== 0 && hintLevel === 0)} on:click={handleHint} title="Hints ({$hints})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
		</svg>

		{#if $settings.hintsLimited}
			<span class="badge" class:badge-primary={hintsAvailable}>{$hints}</span>
		{/if}
	</button>

	{#if hintLevel === 1 && hintInfo}
		<div class="hint-info-panel">
			<span class="hint-candidates">
				Candidates: [{hintInfo.candidates.join(', ')}]
			</span>
			<span class="hint-explanation">
				{hintInfo.explanation}
			</span>
		</div>
	{/if}

	<button class="btn btn-round btn-badge" on:click={notes.toggle} title="Notes ({$notes ? 'ON' : 'OFF'})">
		<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
		</svg>

		<span class="badge tracking-tighter" class:badge-primary={$notes}>{$notes ? 'ON' : 'OFF'}</span>
	</button>

	{#if $gameDomain.isExploring}
		<button class="btn btn-round btn-badge-explore bg-green-500 hover:bg-green-600" on:click={handleExplore} title="Commit Exploration">
			<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
			</svg>
		</button>

		<button class="btn btn-round btn-badge-explore bg-red-500 hover:bg-red-600" on:click={handleAbandon} title="Abandon Exploration">
			<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	{:else}
		<button class="btn btn-round btn-badge-explore bg-purple-500 hover:bg-purple-600" disabled={$gamePaused || $gameDomain.isComplete} on:click={handleExplore} title="Explore Mode">
			<svg class="icon-outline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
			</svg>
		</button>
	{/if}

</div>


<style>
	.action-buttons {
		@apply flex flex-wrap justify-evenly self-end;
	}

	.btn-badge {
		@apply relative;
	}

	.badge {
		min-height: 20px;
		min-width:  20px;
		@apply p-1 rounded-full leading-none text-center text-xs text-white bg-gray-600 inline-block absolute top-0 left-0;
	}

	.badge-primary {
		@apply bg-primary;
	}

	.btn-badge-explore {
		@apply p-2 rounded-full text-white;
	}

	.failed-path-warning {
		background-color: #fff7ed;
		border-left-width: 4px;
		border-color: #f97316;
		color: #c2410c;
		padding: 0.5rem;
		margin-bottom: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
	}

	.failed-path-warning > * + * {
		margin-left: 0.5rem;
	}

	.hint-info-panel {
		background-color: #eff6ff;
		border-left-width: 4px;
		border-color: #60a5fa;
		color: #1d4ed8;
		padding: 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		display: flex;
		flex-direction: column;
	}

	.hint-info-panel > * + * {
		margin-top: 0.25rem;
	}

	.hint-candidates {
		font-weight: 600;
	}

	.hint-explanation {
		font-size: 0.75rem;
		opacity: 0.75;
	}
</style>