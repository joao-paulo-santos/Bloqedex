'use client';

import { useEffect, useState } from 'react';
import { OnlineStatusIndicator } from '@/components/common/OnlineStatusIndicator';
import { createPortal } from 'react-dom';

export function OnlineStatusWrapper() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const container = document.getElementById('online-status-container');

    if (!container) return null;

    return createPortal(<OnlineStatusIndicator />, container);
}
