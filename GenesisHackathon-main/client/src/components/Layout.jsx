import React from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-300">
            {/* Animated Background Blobs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full animate-blob"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-blob animation-delay-2000"></div>
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600/5 blur-[120px] rounded-full animate-blob animation-delay-4000"></div>
            </div>

            <Sidebar />

            <main className="pl-72 relative z-10">
                <div className="p-8 lg:p-12 max-w-full mx-auto min-h-screen">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
};

export default Layout;
