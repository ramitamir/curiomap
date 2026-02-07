'use client';

import { useEffect } from 'react';

export default function ThemeClient() {
	useEffect(() => {
		try {
			const saved = localStorage.getItem('theme');
			const isLight = saved === 'light';
			document.body.classList.toggle('modern', !!isLight);
			// Disable CRT in modern theme via body class
		} catch {}
	}, []);

	return null;
}

