'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggleButton() {
	const [isLight, setIsLight] = useState(false);

	useEffect(() => {
		try {
			const saved = localStorage.getItem('theme');
			const light = saved === 'light' || document.body.classList.contains('modern');
			setIsLight(light);
		} catch {}
	}, []);

	const toggle = () => {
		const nextLight = !isLight;
		try {
			if (nextLight) {
				localStorage.setItem('theme', 'light');
				document.body.classList.add('modern');
			} else {
				localStorage.setItem('theme', 'terminal');
				document.body.classList.remove('modern');
			}
			window.dispatchEvent(new Event('curio-theme-change'));
			setIsLight(nextLight);
		} catch {}
	};

	return (
		<button
			type="button"
			aria-label="Toggle theme"
			onClick={toggle}
			className="fixed top-3 left-3 z-[70] w-9 h-9 rounded-full border border-green-700 text-green-500 hover:text-green-300 hover:border-green-500 bg-transparent flex items-center justify-center"
			title={isLight ? 'Switch to terminal theme' : 'Switch to light theme'}
		>
			{isLight ? (
				/* Moon icon */
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
					<path d="M21.64 13a9 9 0 1 1-10.63-10.6 1 1 0 0 1 1.11 1.48A7 7 0 1 0 20.16 12a1 1 0 0 1 1.48 1z"/>
				</svg>
			) : (
				/* Sun icon */
				<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
					<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zm10.48 0l1.79-1.8-1.41-1.41-1.8 1.79 1.42 1.42zM12 4V1h-2v3h2zm0 19v-3h-2v3h2zm8-9h3v-2h-3v2zM1 12H4v-2H1v2zm3.55 7.45l1.8-1.79-1.42-1.42-1.79 1.8 1.41 1.41zm14.9 0l1.41-1.41-1.79-1.8-1.42 1.42 1.8 1.79zM12 8a4 4 0 100 8 4 4 0 000-8z"/>
				</svg>
			)}
		</button>
	);
}

