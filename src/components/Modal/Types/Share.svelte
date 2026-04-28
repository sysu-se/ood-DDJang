<script>
	import { onMount } from 'svelte';
	import { BASE_URL } from '@sudoku/constants';
	import { modal } from '@sudoku/stores/modal';
	import { gameDomain } from '@sudoku/stores/gameDomain';
	import { encodeSudoku } from '@sudoku/sencode';
	import Clipboard from '../../Utils/Clipboard.svelte';

	export let data = {};
	export let hideModal;

	$: sencode = $gameDomain.grid ? encodeSudoku($gameDomain.grid) : '';

	const link = BASE_URL + '#' + sencode;
	const encodedLink = encodeURIComponent(link);
	const facebookLink = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedLink;
	const twitterLink = 'https://twitter.com/intent/tweet?text=Check%20out%20this%20Sudoku%20puzzle!&url=' + encodedLink;
	const mailToLink = 'mailto:?subject=A%20Sudoku%20puzzle%20for%20you&body=Here%27s%20a%20link%20to%20a%20Sudoku%20puzzle%20on%20sudoku.jonasgeiler.com%3A%0A%0A' + encodedLink;

	let copyText;

	function select(element) {
		element.select();
		element.setSelectionRange(0, element.value.length);
	}

	onMount(() => {
		let canShare = false;
		const shareData = {
			url: link,
			title: 'Sudoku',
			text: 'Check out this Sudoku puzzle!',
		};
		if (navigator.canShare && navigator.canShare(shareData)) {
			canShare = true;
		}

		if (canShare) {
			navigator.share(shareData).then(() => {
				hideModal();
			}).catch((err) => {
				console.log(err);
			});
		}
	});
</script>

<div class="flex flex-col items-center p-4">
	<div class="mb-4">
		<h2 class="text-lg font-semibold text-gray-700 text-center">Challenge your friends</h2>
		<p class="text-sm text-gray-500 text-center">Send this link</p>
	</div>

	<input
		class="hidden"
		bind:this={copyText}
		type="text"
		value={link}
		on:click={select}
	/>

	<Clipboard value={link} />

	<div class="flex justify-center space-x-4 mt-4">
		<a href={twitterLink} target="_blank" class="text-blue-400 hover:text-blue-600">
			<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
		</a>

		<a href={facebookLink} target="_blank" class="text-blue-600 hover:text-blue-800">
			<svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
		</a>

		<a href={mailToLink} class="text-gray-600 hover:text-gray-900">
			<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
		</a>
	</div>
</div>