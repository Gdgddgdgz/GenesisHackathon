import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserPlus, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const schema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Signup = () => {
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data) => {
        setIsLoading(true);
        setError('');
        try {
            await signup(data.name, data.email, data.password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)] relative overflow-hidden font-sans transition-colors duration-300">
            {/* Background Decorations */}
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md px-6 py-12 bg-[var(--bg-card)] backdrop-blur-xl border border-[var(--border-glass)] rounded-3xl shadow-2xl relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl mb-4 shadow-lg shadow-emerald-600/30">
                        <UserPlus className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Get Started</h1>
                    <p className="text-[var(--text-secondary)] mt-2">Create your supply-chain hub account</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm"
                    >
                        <AlertCircle size={18} />
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" size={18} />
                            <input
                                {...register('name')}
                                type="text"
                                placeholder="John Doe"
                                className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                            />
                        </div>
                        {errors.name && <p className="text-red-400 text-[10px] mt-1.5 font-bold uppercase ml-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" size={18} />
                            <input
                                {...register('email')}
                                type="email"
                                placeholder="name@company.com"
                                className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                            />
                        </div>
                        {errors.email && <p className="text-red-400 text-[10px] mt-1.5 font-bold uppercase ml-1">{errors.email.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 ml-1">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] opacity-50" size={18} />
                            <input
                                {...register('password')}
                                type="password"
                                placeholder="••••••••"
                                className="w-full pl-12 pr-4 py-3.5 bg-[var(--bg-main)] border border-[var(--border-glass)] rounded-xl text-[var(--text-primary)] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-medium"
                            />
                        </div>
                        {errors.password && <p className="text-red-400 text-[10px] mt-1.5 font-bold uppercase ml-1">{errors.password.message}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/25 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Create Account'}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t border-[var(--border-glass)] text-center">
                    <p className="text-[var(--text-secondary)] text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
